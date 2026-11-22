import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  Loop,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import {StoryLottery} from './story-lottery';
import {lotteryConfig} from './story-lottery-config';

const FPS = 30;
const LOTTERY_FRAMES = 295;
const PROLOGUE_FRAMES = 1335;
const STREET_INTRO = 12 * FPS;
const STREET_WAVE = 18 * FPS;
const SQUIRREL_FIGHT = 20 * FPS;
const SQUIRREL_TRUTH = 9 * FPS;
const TRANSITION_FRAMES = 4 * FPS;
const WATER_INTRO = 8 * FPS;
const WATER_WAVE = 18 * FPS;
const OX_FIGHT = 22 * FPS;
const OX_TRUTH = 9 * FPS;
const SANCTUM_INTRO = 10 * FPS;
const MARE_FIGHT = 22 * FPS;
const MOM_RESCUE = 9 * FPS;
const KING_FIGHT = 28 * FPS;
const ENDING = 18 * FPS;

const STREET_OFFSET = LOTTERY_FRAMES + PROLOGUE_FRAMES;
const STREET_WAVE_AT = STREET_OFFSET + STREET_INTRO;
const SQUIRREL_AT = STREET_WAVE_AT + STREET_WAVE;
const SQUIRREL_TRUTH_AT = SQUIRREL_AT + SQUIRREL_FIGHT;
const TO_WATER_AT = SQUIRREL_TRUTH_AT + SQUIRREL_TRUTH;
const WATER_OFFSET = TO_WATER_AT + TRANSITION_FRAMES;
const WATER_WAVE_AT = WATER_OFFSET + WATER_INTRO;
const OX_AT = WATER_WAVE_AT + WATER_WAVE;
const OX_TRUTH_AT = OX_AT + OX_FIGHT;
const TO_SANCTUM_AT = OX_TRUTH_AT + OX_TRUTH;
const SANCTUM_OFFSET = TO_SANCTUM_AT + TRANSITION_FRAMES;
const MARE_AT = SANCTUM_OFFSET + SANCTUM_INTRO;
const MOM_RESCUE_AT = MARE_AT + MARE_FIGHT;
const KING_AT = MOM_RESCUE_AT + MOM_RESCUE;
const ENDING_AT = KING_AT + KING_FIGHT;
export const EPISODE_DURATION_FRAMES = ENDING_AT + ENDING;

const asset = (path: string) => staticFile(`assets/${path}`);
const audio = (path: string) => staticFile(path);

type Slide = {caption: string; seconds: number};
const introSlides: Slide[] = [
  {caption: '麦田边，妈妈托小马把麦子送到河对岸。', seconds: 5},
  {caption: '来到河边，牛伯伯说水很浅，松鼠却警告水很深。', seconds: 5.2},
  {caption: '小马刚踏入河中，魔王的咒语突然降临。', seconds: 4},
  {caption: '咒语召来狂风暴雨，河水瞬间变得汹涌。', seconds: 4.5},
  {caption: '妈妈冲进洪水，把小马推回岸边，自己却被卷走。', seconds: 5.2},
  {caption: '昏迷前，小马看见老牛和松鼠露出诡异的笑。', seconds: 5.1},
  {caption: '醒来时，妈妈已经不见了。小马决定找到她。', seconds: 5.2},
  {caption: '河神告诉小马：妈妈被魔王带去了山上的城堡。', seconds: 4.3},
  {caption: '金色力量觉醒，小马化身战士，踏上救母之路。', seconds: 6},
];

const EpisodePrologue: React.FC = () => {
  const frame = useCurrentFrame();
  let from = 0;
  return <AbsoluteFill style={{background: '#07132b', color: '#fff5d9', overflow: 'hidden', fontFamily: 'sans-serif'}}>
    <Loop durationInFrames={PROLOGUE_FRAMES}>
      <Audio src={asset('free/audio/cg-intro.ogg')} volume={0.3}/>
    </Loop>
    {introSlides.map((slide, index) => {
      const duration = Math.round(slide.seconds * FPS);
      const start = from;
      from += duration;
      return <Sequence key={index} from={start} durationInFrames={duration}>
        <PrologueSlide index={index} slide={slide}/>
      </Sequence>;
    })}
    <div style={{position: 'absolute', left: 70, top: 45, padding: '11px 20px', background: '#08152dcc', border: '2px solid #f3cf67', color: '#ffdf84', fontSize: 25, letterSpacing: 4}}>小马过河　故事序章　{String(Math.min(9, Math.floor(frame / (PROLOGUE_FRAMES / 9)) + 1)).padStart(2, '0')} / 09</div>
    <div style={{position: 'absolute', inset: 0, pointerEvents: 'none', boxShadow: 'inset 0 0 90px #030817aa'}}/>
  </AbsoluteFill>;
};

const PrologueSlide: React.FC<{index: number; slide: Slide}> = ({index, slide}) => {
  const frame = useCurrentFrame();
  const duration = Math.round(slide.seconds * FPS);
  const fade = Math.min(
    interpolate(frame, [0, 12], [0, 1], {extrapolateRight: 'clamp'}),
    interpolate(frame, [duration - 12, duration], [1, 0], {extrapolateLeft: 'clamp'}),
  );
  const col = index % 3;
  const row = Math.floor(index / 3);
  const zoom = 1.02 + 0.025 * interpolate(frame, [0, duration], [0, 1], {extrapolateRight: 'clamp'});
  return <AbsoluteFill style={{opacity: fade, overflow: 'hidden', background: '#101a34'}}>
    <div style={{position: 'absolute', inset: -30, backgroundImage: `url(${asset('storyboard-arcade-v1.png')})`, backgroundSize: '300% 300%', backgroundPosition: `${col * 50}% ${row * 50}%`, transform: `scale(${zoom})`}}/>
    <Audio src={asset(`cg-audio/${String(index + 1).padStart(2, '0')}.wav`)} volume={0.96}/>
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 290, background: 'linear-gradient(transparent,#071127dd 42%,#071127f5)'}}/>
    <div style={{position: 'absolute', left: 160, right: 160, bottom: 104, textAlign: 'center', color: '#fff9e9', fontSize: 39, fontWeight: 800, lineHeight: 1.5, textShadow: '0 3px 7px #000, 0 0 18px #000'}}>{slide.caption}</div>
    <div style={{position: 'absolute', left: '12%', right: '12%', bottom: 63, height: 4, background: '#f4dfa866'}}>
      <div style={{height: '100%', width: `${Math.min(100, frame / duration * 100)}%`, background: '#f6ce62'}}/>
    </div>
  </AbsoluteFill>;
};

type Arena = 'street' | 'waterway' | 'sanctum';
type Fighter = 'pony' | 'mouse' | 'frog' | 'squirrel' | 'ox' | 'mare' | 'king';

const stageAssets: Record<Arena, string> = {
  street: 'free/streets/stage.png',
  waterway: 'castle-waterway-stage-v2.png',
  sanctum: 'seal-sanctum-stage-v2.png',
};
const fighterAssets: Record<Fighter, string> = {
  pony: '', mouse: '', frog: '', squirrel: '',
  ox: 'ox-battle-v1.png', mare: 'river-shade-knight-v1.png', king: 'seal-king-v1.png',
};

const ArenaSprite: React.FC<{fighter: Fighter; attacking: boolean; walking: boolean}> = ({fighter, attacking, walking}) => {
  const frame = useCurrentFrame();
  if (fighterAssets[fighter]) {
    const image = fighterAssets[fighter];
    return <Img src={asset(image)} style={{width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated', filter: 'drop-shadow(0 14px 12px #0008)'}}/>;
  }
  const row = fighter === 'pony' ? 0 : fighter === 'mouse' ? 1 : fighter === 'frog' ? 2 : 3;
  const col = attacking ? 3 : walking ? 1 + Math.floor(frame / 7) % 2 : 0;
  return <div style={{width: '100%', height: '100%', backgroundImage: `url(${asset('fighters-v1.png')})`, backgroundSize: '400% 400%', backgroundPosition: `${col * 100 / 3}% ${row * 100 / 3}%`, backgroundRepeat: 'no-repeat', imageRendering: 'pixelated', filter: 'drop-shadow(0 14px 12px #0008)'}}/>;
};

type BattleProps = {
  arena: Arena;
  title: string;
  wave: string;
  opponent: Fighter;
  narration: string;
  narrationAudio: string;
  narrationDuration: number;
  health: number;
  boss?: boolean;
};

const BattleReenactment: React.FC<BattleProps> = ({arena, title, wave, opponent, narration, narrationAudio, narrationDuration, health, boss = false}) => {
  const frame = useCurrentFrame();
  const seconds = frame / FPS;
  const impact = [2.8, 6.3, 10.1, 13.7, 16.5, 19.2, 23.4, 26.1].some((at) => Math.abs(seconds - at) < 0.22);
  const dash = [2.1, 5.5, 9.3, 12.9, 17.4, 22.6, 26.5].some((at) => Math.abs(seconds - at) < 0.38);
  const ponyX = interpolate(frame, [0, 3 * FPS, 8 * FPS, 13 * FPS, 20 * FPS, 30 * FPS], [13, 32, 23, 43, 31, 47], {extrapolateRight: 'clamp'});
  const foeX = interpolate(frame, [0, 4 * FPS, 9 * FPS, 15 * FPS, 23 * FPS, 30 * FPS], [75, 58, 70, 55, 65, 53], {extrapolateRight: 'clamp'});
  const ponyAttack = dash || (Math.floor(seconds * 2.2) % 5 === 2);
  const foeCycle = (seconds * 1.2) % 7;
  const foeAttack = foeCycle > 4 && foeCycle < 4.8;
  const hp = interpolate(frame, [0, 8 * FPS, 16 * FPS, 22 * FPS, 30 * FPS], [1, 0.78, 0.55, 0.28, 0.08], {extrapolateRight: 'clamp'});
  const jump = Math.max(0, Math.sin(seconds * Math.PI * 1.5)) * (dash ? 0.8 : 0.2);
  const stride = Math.sin(frame * 0.42);
  const foeBob = opponent === 'king' ? Math.sin(seconds * 3.2) * 11 : foeAttack ? -14 : Math.abs(stride) * (opponent === 'ox' ? 7 : 5);
  const foeLean = foeAttack ? (opponent === 'ox' ? -10 : opponent === 'king' ? -7 : -5) : stride * (opponent === 'king' ? 1.2 : 2.8);
  const foeSquash = foeAttack ? 1.06 : 1 + Math.abs(stride) * 0.012;
  return <AbsoluteFill style={{overflow: 'hidden', background: '#080d19', color: '#fff4dc', fontFamily: 'sans-serif'}}>
    <Img src={asset(stageAssets[arena])} style={{position: 'absolute', inset: '-6% -8%', width: '116%', height: '112%', objectFit: 'cover', objectPosition: 'center', transform: `translateX(${Math.sin(frame / 90) * -1.5}%)`, imageRendering: 'pixelated'}}/>
    <AbsoluteFill style={{background: 'linear-gradient(180deg,#03091855 0%,#07122308 35%,#07101b55 70%,#020713cc 100%)'}}/>
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: '24%', background: 'linear-gradient(0deg,#080d19cc,#111c2880 44%,transparent)'}}/>
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 122, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '34px 68px', boxSizing: 'border-box', background: 'linear-gradient(#061027cc,transparent)'}}>
      <div style={{width: 500}}><div style={{fontSize: 25, color: '#f6d477', letterSpacing: 3}}>{title}</div><div style={{marginTop: 10, fontSize: 17, color: '#c8d8ed', letterSpacing: 2}}>{wave}</div><div style={{marginTop: 12, width: 420, height: 12, background: '#1a2338', border: '1px solid #e5c66d'}}><div style={{width: `${100 * hp}%`, height: '100%', background: 'linear-gradient(90deg,#ffba52,#ec5c5d)'}}/></div><small style={{fontSize: 15, color: '#f8df9c'}}>小马　120 / 120</small></div>
      <div style={{width: 500, textAlign: 'right'}}><div style={{fontSize: 25, color: boss ? '#ffbd83' : '#d5e2f7', letterSpacing: 3}}>{boss ? '咒印守卫' : '守卫'}</div><div style={{marginTop: 22, marginLeft: 'auto', width: 420, height: 12, background: '#191b2d', border: '1px solid #e5c66d'}}><div style={{width: `${Math.max(4, health * hp) * 100}%`, height: '100%', background: 'linear-gradient(90deg,#bf4770,#ffad64)'}}/></div><small style={{fontSize: 15, color: '#f8df9c'}}>咒印　{Math.round(Math.max(4, health * hp))} / {health}</small></div>
    </div>
    <div style={{position: 'absolute', left: `${ponyX}%`, bottom: '15%', width: 300, height: 360, transform: `translateX(-50%) translateY(${-jump * 90}px)`, zIndex: 3}}><ArenaSprite fighter="pony" attacking={ponyAttack} walking={!ponyAttack}/></div>
    <div style={{position: 'absolute', left: `${foeX + (foeAttack ? -2.6 : stride * 0.45)}%`, bottom: '15%', width: boss ? 390 : 270, height: boss ? 440 : 330, transform: `translateX(-50%) translateY(${foeBob}px) rotate(${foeLean}deg) scaleX(-1) scale(${foeSquash},${foeAttack ? 0.96 : 1})`, transformOrigin: 'center bottom', zIndex: 3, filter: impact ? 'brightness(2.1)' : foeAttack && opponent === 'king' ? 'drop-shadow(0 0 28px #bd70ff)' : 'none'}}><ArenaSprite fighter={opponent} attacking={foeAttack} walking={!foeAttack}/></div>
    {dash && <div style={{position: 'absolute', left: `${(ponyX + foeX) / 2 - 7}%`, top: '55%', fontSize: 100, fontWeight: 900, color: '#ffe48a', textShadow: '0 0 18px #f66c6c, 0 0 38px #f4d681', transform: `rotate(${-20 + Math.sin(frame) * 4}deg)`, opacity: 0.9}}>╱</div>}
    {impact && <div style={{position: 'absolute', left: `${(ponyX + foeX) / 2}%`, top: '52%', width: 125, height: 125, border: '8px solid #fff0a2', borderRadius: '50%', boxShadow: '0 0 32px #ffcd61, inset 0 0 28px #fa8152', transform: `translate(-50%,-50%) scale(${0.72 + (frame % 8) / 24})`, opacity: 0.9}}/>}
    <div style={{position: 'absolute', right: 68, bottom: 48, padding: '11px 22px', border: '1px solid #e9ca70', background: '#07162bd9', color: '#f5d677', fontSize: 19, letterSpacing: 3}}>连击　{Math.max(2, Math.floor(seconds * 1.25) % 14 + 2)} HIT</div>
    <VoiceCaption text={narration} src={narrationAudio} duration={narrationDuration} startAt={0.7}/>
    {Array.from({length: 7}, (_, index) => <Sequence key={index} from={Math.round((2 + index * 3.7) * FPS)} durationInFrames={18}><Audio src={asset(arena === 'waterway' ? 'free/audio/castle/water-impact.ogg' : 'free/audio/castle/stone-impact.ogg')} volume={0.22}/></Sequence>)}
    {Array.from({length: 4}, (_, index) => <Sequence key={`neigh-${index}`} from={Math.round((4 + index * 6.8) * FPS)} durationInFrames={70}><Audio src={asset('free/audio/horse-attack.mp3')} volume={0.2}/></Sequence>)}
  </AbsoluteFill>;
};

const VoiceCaption: React.FC<{text: string; src: string; duration: number; startAt: number}> = ({text, src, duration, startAt}) => {
  const startFrame = Math.round(startAt * FPS);
  return <>
    <Sequence from={startFrame} durationInFrames={Math.ceil(duration * FPS)}>
      <Audio src={audio(src)} volume={0.94}/>
      <div style={{position: 'absolute', left: 150, right: 150, bottom: 88, padding: '18px 28px', border: '2px solid #e8c968', background: '#09172bea', color: '#fff6e2', textAlign: 'center', fontSize: 31, lineHeight: 1.5, fontWeight: 700, textShadow: '0 2px 5px #000'}}>{text}</div>
    </Sequence>
  </>;
};

type DialogueCardProps = {image: string; label: string; line: string; src: string; duration: number};
const DialogueCard: React.FC<DialogueCardProps> = ({image, label, line, src, duration}) => (
  <AbsoluteFill style={{overflow: 'hidden', background: '#091326', color: '#fff6e2', fontFamily: 'sans-serif'}}>
    <Img src={asset(image)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover'}}/>
    <div style={{position: 'absolute', left: 80, right: 80, bottom: 55, minHeight: 170, padding: '24px 38px', boxSizing: 'border-box', background: '#07152beF', border: '4px solid #e9c96b', boxShadow: '8px 8px #291a3b'}}>
      <div style={{fontSize: 20, color: '#f1d375', letterSpacing: 3}}>{label}</div>
      <div style={{marginTop: 20, fontSize: 38, lineHeight: 1.5, fontWeight: 750}}>{line}</div>
    </div>
    <Audio src={audio(src)} volume={0.95}/>
    <div style={{position: 'absolute', inset: 0, pointerEvents: 'none', boxShadow: 'inset 0 0 120px #02061199'}}/>
    <Sequence from={0} durationInFrames={Math.min(30, Math.round(duration * FPS))}>
      <AbsoluteFill style={{background: '#fff2c4'}}/>
    </Sequence>
  </AbsoluteFill>
);

type TransitionProps = {next: string; stage: Arena; subtitle: string};
const StageTransition: React.FC<TransitionProps> = ({next, stage, subtitle}) => (
  <AbsoluteFill style={{overflow: 'hidden', background: '#070e22', color: '#fff3d5', fontFamily: 'sans-serif'}}>
    <Img src={asset(stageAssets[stage])} style={{position: 'absolute', inset: '-12%', width: '124%', height: '124%', objectFit: 'cover', filter: 'blur(2px) brightness(.42)'}}/>
    <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', background: 'radial-gradient(ellipse,#08142e44,#030814aa)'}}>
      <div style={{fontSize: 22, color: '#f6d56f', letterSpacing: 12}}>TO BE CONTINUED</div>
      <div style={{marginTop: 28, fontSize: 61, fontWeight: 900, textShadow: '0 5px #6e3658'}}>{next}</div>
      <div style={{marginTop: 22, fontSize: 28, color: '#e4e7f5'}}>{subtitle}</div>
    </div>
  </AbsoluteFill>
);

const EpisodeEnding: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = interpolate(frame, [0, 24, ENDING - 24, ENDING], [0, 1, 1, 0], {extrapolateRight: 'clamp'});
  return <AbsoluteFill style={{overflow: 'hidden', background: '#15223a', color: '#fff7e4', opacity: fade, fontFamily: 'sans-serif'}}>
    <Img src={asset('farmhouse-morning.png')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.02 + frame / 5000})`}}/>
    <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(0deg,#081527e8,transparent 82%)'}}/>
    <Img src={asset('pony-dialogue-v1.png')} style={{position: 'absolute', left: '27%', bottom: '24%', width: 240, height: 270, objectFit: 'contain', transform: `translateY(${Math.sin(frame / 13) * 5}px)`, filter: 'drop-shadow(0 10px 14px #07101d77)'}}/>
    <Img src={asset('mother-mare.png')} style={{position: 'absolute', left: '55%', bottom: '23%', width: 430, height: 300, objectFit: 'contain', transform: `translateY(${Math.sin(frame / 16 + 1) * 4}px)`, filter: 'drop-shadow(0 10px 14px #07101d55)'}}/>
    <div style={{position: 'absolute', left: 170, right: 170, bottom: 105, padding: '34px 55px', background: '#0c1a31e8', border: '4px solid #e9c86a', textAlign: 'center', boxShadow: '9px 9px #4c2744'}}>
      <div style={{fontSize: 28, color: '#f4d878'}}>河水恢复平静，妈妈和小马终于团聚。</div>
      <h1 style={{margin: '15px 0', fontSize: 58, color: '#ffdf72', textShadow: '0 4px #663753'}}>小马过河 · 故事完</h1>
      <div style={{fontSize: 27}}>听取不同意见，也要观察事实，亲自判断。</div>
    </div>
    <Sequence from={0} durationInFrames={Math.round(8.16 * FPS)}><Audio src={asset('cg-audio/ending.wav')} volume={0.95}/></Sequence>
  </AbsoluteFill>;
};

export const XiaomaEpisode: React.FC = () => (
  <AbsoluteFill style={{background: '#07101d'}}>
    <Sequence from={STREET_OFFSET} durationInFrames={STREET_INTRO + STREET_WAVE + SQUIRREL_FIGHT + SQUIRREL_TRUTH}>
      <Audio src={asset('free/audio/battle.ogg')} volume={0.2}/>
    </Sequence>
    <Sequence from={WATER_OFFSET} durationInFrames={WATER_INTRO + WATER_WAVE + OX_FIGHT + OX_TRUTH}>
      <Audio src={asset('free/audio/second-level-dungeon.mp3')} volume={0.2}/>
    </Sequence>
    <Sequence from={SANCTUM_OFFSET} durationInFrames={SANCTUM_INTRO + MARE_FIGHT + MOM_RESCUE + KING_FIGHT}>
      <Loop durationInFrames={Math.round(57.74 * FPS)}><Audio src={asset('free/fc/audio/free-nes-music-pack/nes_02-doom.wav')} volume={0.22}/></Loop>
    </Sequence>
    <Sequence from={ENDING_AT} durationInFrames={ENDING}>
      <Loop durationInFrames={ENDING}><Audio src={asset('free/audio/cg-intro.ogg')} volume={0.18}/></Loop>
    </Sequence>
    <Sequence from={0} durationInFrames={LOTTERY_FRAMES}>
      <StoryLottery {...lotteryConfig} frameOffset={75}/>
    </Sequence>
    <Sequence from={LOTTERY_FRAMES} durationInFrames={PROLOGUE_FRAMES}><EpisodePrologue/></Sequence>
    <Sequence from={STREET_OFFSET} durationInFrames={STREET_INTRO}>
      <BattleReenactment arena="street" title="第一关 · 魔王城下的旧街" wave="河神指路 · 突破街口" opponent="mouse" narration="刚出发就撞上城堡守卫。小马边走边打，先清开街口，沿着魔王留下的咒印一路追过去。" narrationAudio="assets/episodes/xiaoma-guohe/voiceover/street-intro.wav" narrationDuration={10} health={70}/>
    </Sequence>
    <Sequence from={STREET_WAVE_AT} durationInFrames={STREET_WAVE}>
      <BattleReenactment arena="street" title="第一关 · 魔王城下的旧街" wave="第二波 · 守卫与投手" opponent="frog" narration="街头守卫从两侧围来，投手在后方丢出石块。小马一边闪避，一边打断他们的攻势，终于冲出旧街。" narrationAudio="assets/episodes/xiaoma-guohe/voiceover/street-wave.wav" narrationDuration={10} health={60}/>
    </Sequence>
    <Sequence from={SQUIRREL_AT} durationInFrames={SQUIRREL_FIGHT}>
      <BattleReenactment arena="street" title="第一关 Boss · 松鼠" wave="咒印守卫 · 旧街尽头" opponent="squirrel" narration="松鼠从屋顶跳下来，松果一颗接一颗。小马换到侧面冲刺，抓住它落地的空当还击。" narrationAudio="assets/episodes/xiaoma-guohe/voiceover/squirrel-fight.wav" narrationDuration={9} health={100} boss/>
    </Sequence>
    <Sequence from={SQUIRREL_TRUTH_AT} durationInFrames={SQUIRREL_TRUTH}>
      <DialogueCard image="squirrel-dialogue-after-v1.png" label="咒印破裂 · 松鼠恢复意识" line="对不起，我和老牛都被魔王控制了。妈妈被洪水卷进了城堡水道！" src="assets/episodes/xiaoma-guohe/voiceover/squirrel-truth.wav" duration={9}/>
    </Sequence>
    <Sequence from={TO_WATER_AT} durationInFrames={TRANSITION_FRAMES}>
      <StageTransition stage="street" next="第二关 · 城堡水道" subtitle="沿着河道找到封印核心"/>
    </Sequence>
    <Sequence from={WATER_OFFSET} durationInFrames={WATER_INTRO}>
      <BattleReenactment arena="waterway" title="第二关 · 城堡水道" wave="闸门入口 · 水道守卫" opponent="mouse" narration="小马冲进城堡水道，脚下的水流正把封印的力量带向深处。" narrationAudio="assets/episodes/xiaoma-guohe/voiceover/waterway-intro.wav" narrationDuration={7} health={80}/>
    </Sequence>
    <Sequence from={WATER_WAVE_AT} durationInFrames={WATER_WAVE}>
      <BattleReenactment arena="waterway" title="第二关 · 城堡水道" wave="守卫增援 · 留意地面震波" opponent="frog" narration="水道里，守卫分批堵住窄桥，老牛的冲锋还会带起震波。看准前摇跳开，才能留出反击的机会。" narrationAudio="assets/episodes/xiaoma-guohe/voiceover/waterway-wave.wav" narrationDuration={11} health={60}/>
    </Sequence>
    <Sequence from={OX_AT} durationInFrames={OX_FIGHT}>
      <BattleReenactment arena="waterway" title="第二关 Boss · 老牛" wave="第二枚咒印 · 冲锋与震波" opponent="ox" narration="老牛蓄力冲来，脚下水波一圈圈扩散。小马在最后一刻跳开，等老牛撞上闸门，再冲上前打碎咒印。" narrationAudio="assets/episodes/xiaoma-guohe/voiceover/ox-fight.wav" narrationDuration={12} health={120} boss/>
    </Sequence>
    <Sequence from={OX_TRUTH_AT} durationInFrames={OX_TRUTH}>
      <DialogueCard image="ox-dialogue-after-v1.png" label="第二枚咒印破裂 · 老牛恢复意识" line="封印核心就在水道尽头。去圣殿救回妈妈，那里也是暴雨力量的源头。" src="assets/episodes/xiaoma-guohe/voiceover/ox-truth.wav" duration={9}/>
    </Sequence>
    <Sequence from={TO_SANCTUM_AT} durationInFrames={TRANSITION_FRAMES}>
      <StageTransition stage="waterway" next="最终关 · 封印圣殿" subtitle="救回妈妈，摧毁封印核心"/>
    </Sequence>
    <Sequence from={SANCTUM_OFFSET} durationInFrames={SANCTUM_INTRO}>
      <BattleReenactment arena="sanctum" title="最终关 · 封印圣殿" wave="河影骑士 · 妈妈被咒印控制" opponent="mare" narration="封印圣殿深处，妈妈被紫色咒印包围。她认不出小马，化作河影骑士迎面挡住去路。" narrationAudio="assets/episodes/xiaoma-guohe/voiceover/sanctum-intro.wav" narrationDuration={9} health={100} boss/>
    </Sequence>
    <Sequence from={MARE_AT} durationInFrames={MARE_FIGHT}>
      <BattleReenactment arena="sanctum" title="最终关 Boss 第一阶段 · 河影骑士" wave="击碎咒印 · 救回妈妈" opponent="mare" narration="小马没有还手伤害妈妈，只躲过水刃和冲锋，寻找胸前咒印的破绽。最后一击落下，咒印终于碎了。" narrationAudio="assets/episodes/xiaoma-guohe/voiceover/mare-fight.wav" narrationDuration={10} health={100} boss/>
    </Sequence>
    <Sequence from={MOM_RESCUE_AT} durationInFrames={MOM_RESCUE}>
      <DialogueCard image="seal-sanctum-bg-v1.png" label="咒印破裂 · 母子重逢" line="小马……真的是你吗？封印还在吸取河神的力量，小心，魔王要出来了！" src="assets/episodes/xiaoma-guohe/voiceover/king-reveal.wav" duration={9}/>
    </Sequence>
    <Sequence from={KING_AT} durationInFrames={KING_FIGHT}>
      <BattleReenactment arena="sanctum" title="最终 Boss · 封印魔王" wave="封印核心 · 母子联手" opponent="king" narration="魔王放出咒影弹，圣殿水位跟着上涨。妈妈吸引它的注意，小马绕到水晶背后发动最后的冲刺，封印核心终于裂开。" narrationAudio="assets/episodes/xiaoma-guohe/voiceover/king-fight.wav" narrationDuration={11} health={150} boss/>
    </Sequence>
    <Sequence from={ENDING_AT} durationInFrames={ENDING}><EpisodeEnding/></Sequence>
  </AbsoluteFill>
);
