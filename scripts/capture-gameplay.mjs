import { chromium } from 'playwright';
import { spawn, execFileSync } from 'node:child_process';
import { mkdir, copyFile, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (name, fallback) => {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length) ?? fallback;
};
const seconds = Math.max(30, Math.min(600, Number(arg('duration', 180)) || 180));
const url = arg('url', 'http://localhost:4173/game/index.html');
const name = arg('name', 'xiaoma-guohe-gameplay-actual-v1');
const outputDir = path.join(root, 'content/stories/xiaoma-guohe/gameplay-captures', name);
const outputMp4 = path.join(root, 'out', `${name}.mp4`);
const rawDir = path.join(outputDir, 'raw');
const rawAudio = path.join(outputDir, 'game-audio.mka');
const finalRawVideo = path.join(outputDir, 'gameplay-screen.webm');
const manifestPath = path.join(outputDir, 'capture-manifest.json');
const viewport = { width: 1920, height: 1080 };

await mkdir(rawDir, { recursive: true });
await mkdir(path.dirname(outputMp4), { recursive: true });

let audioModuleId = null;
let audioRecorder = null;
let browser;
let page;
let videoHandle;
let frameLog = [];
let locallyStartedServer = null;
let running = true;
let endReason = 'time_limit';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const run = (command, args, options = {}) => execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...options });
const waitForServer = async (timeoutMs = 15000) => {
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1500) });
      if (response.ok) return;
    } catch {}
    await sleep(400);
  }
  throw new Error(`游戏页面没有响应：${url}`);
};

try {
  try {
    await waitForServer(1200);
  } catch {
    locallyStartedServer = spawn(process.execPath, ['game/server.mjs'], { cwd: root, stdio: 'ignore' });
    await waitForServer();
  }

  let pulseSink = null;
  if (process.platform === 'linux') {
    try {
      pulseSink = `xiaoma_gamecap_${process.pid}`;
      audioModuleId = run('pactl', ['load-module', 'module-null-sink', `sink_name=${pulseSink}`, 'rate=48000', 'channels=2']).trim();
      audioRecorder = spawn('ffmpeg', [
        '-hide_banner', '-loglevel', 'error', '-y', '-f', 'pulse', '-i', `${pulseSink}.monitor`,
        '-c:a', 'libopus', '-b:a', '128k', rawAudio,
      ], { stdio: 'ignore' });
      await sleep(350);
    } catch (error) {
      console.warn(`游戏声音采集不可用，将录制无声画面：${error.message}`);
      pulseSink = null;
      if (audioModuleId) {
        try { run('pactl', ['unload-module', audioModuleId]); } catch {}
        audioModuleId = null;
      }
    }
  }

  browser = await chromium.launch({
    headless: true,
    ignoreDefaultArgs: ['--mute-audio'],
    args: ['--autoplay-policy=no-user-gesture-required'],
    env: pulseSink ? { ...process.env, PULSE_SINK: pulseSink } : process.env,
  });
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    recordVideo: { dir: rawDir, size: viewport },
  });
  page = await context.newPage();
  page.on('console', (message) => {
    if (message.type() === 'error') console.warn(`页面错误：${message.text()}`);
  });
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.addStyleTag({ content: `
    html, body { width: 100vw !important; height: 100vh !important; min-height: 0 !important; margin: 0 !important; overflow: hidden !important; }
    body { display: block !important; }
    main { width: 100vw !important; max-width: none !important; height: 100vh !important; padding: 0 !important; margin: 0 !important; }
    header, footer, #audio-settings { display: none !important; }
    #frame { width: 100vw !important; height: 100vh !important; aspect-ratio: auto !important; border-width: 4px !important; box-shadow: none !important; }
    canvas { width: 100% !important; height: 100% !important; }
  ` });
  await page.waitForTimeout(800);
  const titleButton = page.locator('#overlay button').first();
  if (await titleButton.count()) await titleButton.click();

  const startedAt = new Date().toISOString();
  const startMs = Date.now();
  let heldKey = null;
  let lastDialogueAt = 0;
  let lastDropAt = 0;
  let lastLogAt = 0;
  let lastMode = '';
  let finalSequenceDeadline = 0;
  let waveZeroProgressAt = Date.now();
  let lastWaveZeroX = null;

  while (running && (Date.now() - startMs < seconds * 1000 || Date.now() < finalSequenceDeadline)) {
    const state = await page.evaluate(() => {
      const player = game?.p;
      return {
        mode,
        level,
        wave,
        dialogueKind,
        dialogueIndex,
        transitionTarget,
        line: dialogueKind ? dialogues[dialogueKind]?.[dialogueIndex]?.[1] : '',
        hp: player?.hp,
        maxHp: player?.maxHp,
        player: player && {
          x: player.x,
          y: player.y,
          face: player.face,
          stun: player.stun,
          jump: player.jump,
          attack: player.attack,
          dash: player.dash,
          weapon: player.weapon?.type ?? null,
        },
        gate: game?.gate,
        enemies: game?.enemies?.filter((enemy) => enemy.hp > 0).map((enemy) => ({
          type: enemy.type, x: enemy.x, y: enemy.y, hp: enemy.hp,
          oxWindup: enemy.oxWindup ?? 0,
          oxCharge: enemy.oxCharge ?? 0,
          oxAction: enemy.oxAction ?? null,
          bossWindup: enemy.bossWindup ?? 0,
          bossCharge: enemy.bossCharge ?? 0,
          bossAction: enemy.bossAction ?? null,
          markTimer: enemy.markTimer ?? 0,
          markX: enemy.markX ?? null,
        })) ?? [],
        drops: game?.drops?.map((drop) => ({ x: drop.x, y: drop.y, type: drop.type })) ?? [],
      };
    });

    const enteredMode = state.mode !== lastMode;
    if (enteredMode) {
      frameLog.push({ elapsed_seconds: Number(((Date.now() - startMs) / 1000).toFixed(1)), mode: state.mode, level: state.level, wave: state.wave });
      lastMode = state.mode;
      if (['dialogue', 'transition', 'win', 'lose'].includes(state.mode)) lastDialogueAt = Date.now();
    }
    if (state.mode === 'dialogue' && state.dialogueKind === 'finalVictory' && !finalSequenceDeadline) {
      finalSequenceDeadline = Date.now() + 30000;
    }
    if (Date.now() - lastLogAt > 10000) {
      const boss = state.enemies.find((enemy) => ['boss', 'ox', 'mareBoss', 'sealKing'].includes(enemy.type));
      const bossInfo = boss ? ` ${boss.type} ${Math.ceil(boss.hp)}HP` : '';
      const positionInfo = state.player ? ` x${Math.round(state.player.x)}` : '';
      console.log(`${Math.round((Date.now() - startMs) / 1000)}s`, `关卡${state.level} 第${state.wave}波`, state.mode, `体力 ${Math.round(state.hp ?? 0)}${positionInfo}${bossInfo}`);
      lastLogAt = Date.now();
    }

    if (state.mode === 'story') {
      // Let the game's own voice onended/timer advance every prologue slide.
      if (heldKey) { await page.keyboard.up(heldKey); heldKey = null; }
    } else if (state.mode === 'dialogue') {
      if (heldKey) { await page.keyboard.up(heldKey); heldKey = null; }
      const speakingMs = Math.min(4400, Math.max(2300, (state.line?.length ?? 8) * 125));
      if (!enteredMode && Date.now() - lastDialogueAt > speakingMs) {
        await page.keyboard.press('Enter');
        lastDialogueAt = Date.now();
      }
    } else if (state.mode === 'transition' || state.mode === 'win') {
      if (heldKey) { await page.keyboard.up(heldKey); heldKey = null; }
      if (Date.now() - lastDialogueAt > 2600) {
        const button = page.locator('#overlay button').first();
        if (await button.count()) await button.click();
        else await page.keyboard.press('Enter');
        lastDialogueAt = Date.now();
      }
    } else if (state.mode === 'lose') {
      if (heldKey) { await page.keyboard.up(heldKey); heldKey = null; }
      if (Date.now() - lastDialogueAt > 2000) {
        const button = page.locator('#overlay button').first();
        if (await button.count()) await button.click();
        lastDialogueAt = Date.now();
      }
    } else if (state.mode === 'ending') {
      if (heldKey) { await page.keyboard.up(heldKey); heldKey = null; }
      if (Date.now() - lastDialogueAt > 7000) {
        endReason = 'story_ending_reached';
        break;
      }
    } else if (state.mode === 'pause') {
      await page.keyboard.press('Escape');
    } else if (state.mode === 'play' && state.player) {
      const player = state.player;
      const nearestDrop = [...state.drops].sort((a, b) => Math.abs(a.x - player.x) - Math.abs(b.x - player.x))[0];
      const target = [...state.enemies].sort((a, b) => Math.abs(a.x - player.x) - Math.abs(b.x - player.x))[0];
      // Keep movement keys held continuously; a short `press()` here can release
      // the same key while the heldKey tracker still believes it is down.
      if (state.wave !== 0) lastWaveZeroX = null;
      const healthDropNeeded = nearestDrop && ['drumstick', 'burger'].includes(nearestDrop.type) && (state.hp ?? 120) < (state.maxHp ?? 120) - 8;
      const weaponDropNeeded = nearestDrop && ['stick', 'pipe'].includes(nearestDrop.type) && !player.weapon;
      const collectDrop = nearestDrop && (healthDropNeeded || weaponDropNeeded || Math.abs(nearestDrop.x - player.x) < 66);
      let direction = null;

      if (collectDrop && Math.hypot(nearestDrop.x - player.x, nearestDrop.y - player.y) < 48) {
        if (heldKey) { await page.keyboard.up(heldKey); heldKey = null; }
        if (Date.now() - lastDropAt > 700) {
          await page.keyboard.press('i');
          lastDropAt = Date.now();
        }
      } else if (collectDrop && Math.abs(nearestDrop.x - player.x) < 230 && (!target || healthDropNeeded)) {
        direction = nearestDrop.x > player.x ? 'd' : 'a';
      } else if (target) {
        const dx = target.x - player.x;
        const bossWarning = target.type === 'ox'
          ? target.oxWindup > 0 || target.oxCharge > 0
          : ['mareBoss', 'sealKing'].includes(target.type) && (target.bossWindup > 0 || target.bossCharge > 0);
        const marked = target.type === 'sealKing' && target.markTimer > 0;
        const warningTimer = target.type === 'ox' ? target.oxWindup : target.bossWindup;
        const charging = target.type === 'ox' ? target.oxCharge > 0 : target.bossCharge > 0;
        const action = target.type === 'ox' ? target.oxAction : target.bossAction;
        const shouldJump = !charging && warningTimer > 0 && warningTimer < 0.28 && (
          (target.type === 'ox' && action === 'stomp') ||
          (target.type === 'mareBoss' && [0, 1].includes(action)) ||
          (target.type === 'sealKing' && action === 1)
        );
        if (marked) {
          direction = player.x <= (target.markX ?? player.x) ? 'a' : 'd';
        } else if (charging || (bossWarning && !shouldJump && (target.type !== 'sealKing' || action === 1))) {
          direction = dx > 0 ? 'a' : 'd';
        } else if (shouldJump && (player.jump ?? 0) <= 0.18 && (player.attack ?? 0) <= 0.02) {
          await page.keyboard.press('k');
        }
        const defensive = marked || charging || (bossWarning && !shouldJump && (target.type !== 'sealKing' || action === 1));
        if (!defensive && Math.abs(dx) > 82) {
          if (player.x >= (state.gate ?? 0) - 6 && dx > 0) {
            // Back away from a ranged enemy at the gate so it advances into attack range.
            direction = player.x > target.x - 255 ? 'a' : 'd';
          } else {
            direction = dx > 0 ? 'd' : 'a';
          }
        } else if (!defensive && Math.abs(dx) > 12 && Math.sign(dx) !== player.face) {
          direction = dx > 0 ? 'd' : 'a';
        }
        const facesTarget = Math.abs(dx) <= 12 || Math.sign(dx) === player.face;
        const attackReady = (player.attack ?? 0) <= 0.02 && (player.dash ?? 0) <= 0.02;
        if (!defensive && Math.abs(dx) <= 90 && facesTarget && attackReady) {
          if (Math.abs(dx) <= 82) {
            await page.keyboard.press('l');
          } else {
            await page.keyboard.press('k');
          }
        }
      } else if (player.x < (state.wave === 0 ? 470 : (state.gate ?? 0) - 25)) {
        direction = 'd';
      }

      if (direction !== heldKey) {
        if (heldKey) await page.keyboard.up(heldKey);
        if (direction) await page.keyboard.down(direction);
        heldKey = direction;
      }
    }
    await page.waitForTimeout(120);
  }

  if (heldKey) await page.keyboard.up(heldKey);
  if (Date.now() - startMs >= seconds * 1000 && endReason !== 'story_ending_reached') endReason = 'time_limit';
  videoHandle = page.video();
  await page.context().close();
  await browser.close();
  browser = null;
  const browserVideoPath = await videoHandle.path();
  await copyFile(browserVideoPath, finalRawVideo);

  if (audioRecorder) {
    audioRecorder.kill('SIGINT');
    await new Promise((resolve) => audioRecorder.once('close', resolve));
    audioRecorder = null;
  }
  let hasAudio = false;
  try { hasAudio = (await stat(rawAudio)).size > 10000; } catch {}
  const muxArgs = ['-hide_banner', '-loglevel', 'error', '-y', '-i', finalRawVideo];
  if (hasAudio) muxArgs.push('-i', rawAudio);
  muxArgs.push('-map', '0:v:0');
  if (hasAudio) muxArgs.push('-map', '1:a:0');
  const encoderList = run('ffmpeg', ['-hide_banner', '-encoders']);
  if (encoderList.includes('h264_nvenc')) muxArgs.push('-c:v', 'h264_nvenc', '-preset', 'p4', '-cq', '20', '-b:v', '0');
  else muxArgs.push('-c:v', 'libx264', '-preset', 'fast', '-crf', '19');
  muxArgs.push('-pix_fmt', 'yuv420p');
  if (hasAudio) muxArgs.push('-c:a', 'aac', '-b:a', '160k', '-shortest');
  muxArgs.push('-movflags', '+faststart', outputMp4);
  run('ffmpeg', muxArgs);

  const probe = JSON.parse(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,size', '-show_entries', 'stream=codec_type,codec_name,width,height,sample_rate', '-of', 'json', outputMp4]));
  await writeFile(manifestPath, JSON.stringify({
    story: '小马过河',
    purpose: '实际浏览器运行画面和自动键盘操作录屏，可替换动画演绎片段。',
    capture_method: 'Playwright Chromium page video; keyboard-only movement, combat, dialogue and stage transition; audio captured to a dedicated local PulseAudio sink.',
    source_url: url,
    started_at: startedAt,
    finished_at: new Date().toISOString(),
    end_reason: endReason,
    requested_max_seconds: seconds,
    output: path.relative(root, outputMp4),
    reusable_raw_video: path.relative(root, finalRawVideo),
    reusable_raw_audio: hasAudio ? path.relative(root, rawAudio) : null,
    format: probe,
    progression: frameLog,
    controls: { move: 'WASD', attack: 'J', dash_attack: 'L', advance_dialogue: 'Enter', pickup: 'I' },
  }, null, 2) + '\n');
  console.log(`录制完成：${path.relative(root, outputMp4)}`);
  console.log(`原始素材：${path.relative(root, outputDir)}`);
  console.log(`实际结束：${endReason}`);
} finally {
  if (audioRecorder) {
    audioRecorder.kill('SIGINT');
    await new Promise((resolve) => audioRecorder.once('close', resolve));
  }
  if (browser) await browser.close().catch(() => {});
  if (audioModuleId) {
    try { run('pactl', ['unload-module', audioModuleId]); } catch {}
  }
  if (locallyStartedServer) locallyStartedServer.kill('SIGTERM');
}
