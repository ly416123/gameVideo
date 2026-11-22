#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const listPath = path.resolve(repoRoot, process.argv[2] ?? 'content/stories/xiaoma-guohe/edit/shot-list.json');
const data = JSON.parse(fs.readFileSync(listPath, 'utf8'));
const outputPath = path.resolve(repoRoot, data.output);
const sources = data.sources;
if (!Array.isArray(sources) || sources.length === 0) throw new Error('shot-list.json has no sources');
for (const source of sources) {
  const file = path.resolve(repoRoot, source.path);
  if (!fs.existsSync(file)) throw new Error(`Missing source: ${source.path}`);
}
fs.mkdirSync(path.dirname(outputPath), {recursive: true});

const inputs = sources.flatMap((source) => ['-i', path.resolve(repoRoot, source.path)]);
const filters = [];
const segments = [];
for (let i = 0; i < sources.length; i++) {
  filters.push(`[${i}:v:0]fps=${data.target.fps},format=yuv420p[v${i}]`);
  filters.push(`[${i}:a:0]aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo[a${i}]`);
  segments.push(`[v${i}][a${i}]`);
}
filters.push(`${segments.join('')}concat=n=${sources.length}:v=1:a=1[v][a]`);
const args = [
  '-hide_banner', '-y', ...inputs,
  '-filter_complex', filters.join(';'),
  '-map', '[v]', '-map', '[a]',
  '-c:v', 'h264_nvenc', '-preset', 'p5', '-cq', '19', '-b:v', '0',
  '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', outputPath,
];
console.log(`Assembling ${sources.length} clips -> ${path.relative(repoRoot, outputPath)}`);
const result = spawnSync('ffmpeg', args, {stdio: 'inherit', cwd: repoRoot});
if (result.error) throw result.error;
if (result.status !== 0) throw new Error(`ffmpeg exited with status ${result.status}`);
const probe = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', outputPath], {encoding: 'utf8'});
if (probe.status !== 0) throw new Error('ffprobe could not read assembled output');
const duration = Number(probe.stdout.trim());
console.log(`Done: ${duration.toFixed(3)} seconds`);
