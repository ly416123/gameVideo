import React from 'react';
import {AbsoluteFill, Audio, Img, Loop, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';

export type DraftScene = {
  title: string;
  caption: string;
  narration: string;
  visual: string;
  characters?: string[];
  voice: string;
  durationSeconds: number;
  wideShot?: boolean;
  voiceSegments?: {caption: string; voice: string; voiceDurationSeconds: number; durationSeconds: number}[];
};
export type StoryDraftProps = {title: string; style: string; scenes: DraftScene[]; music: string};
const FPS = 30;
const cleanSubtitle = (text: string) => text.replace(/\s+/g, '').replace(/[“”]/g, '');
const defaultProps: StoryDraftProps = {
  title: '故事标题', style: '抽象绘本', music: 'assets/free/audio/cg-intro.ogg',
  scenes: [{title: '故事开始', caption: '输入故事后生成分镜与旁白。', narration: '', visual: 'assets/farmhouse-morning.png', voice: '', durationSeconds: 6}],
};

export const storyDraftMetadata = {
  durationInFrames: 180,
  defaultProps,
  calculateMetadata: ({props}: {props: StoryDraftProps}) => ({
    durationInFrames: Math.max(FPS, Math.ceil(props.scenes.reduce((sum, scene) => sum + scene.durationSeconds, 0) * FPS)),
  }),
};

const SceneCard: React.FC<{scene: DraftScene; index: number}> = ({scene, index}) => {
  const frame = useCurrentFrame();
  const frames = Math.max(1, Math.round(scene.durationSeconds * FPS));
  const scale = interpolate(frame, [0, frames], scene.wideShot ? [1, 1.025] : [1.015, 1.07], {extrapolateRight: 'clamp'});
  const fade = Math.min(interpolate(frame, [0, 10], [0, 1], {extrapolateRight: 'clamp'}), interpolate(frame, [frames - 12, frames], [1, 0], {extrapolateLeft: 'clamp'}));
  const voiceSegments = scene.voiceSegments ?? [];
  let voiceOffset = 0;
  const timedVoiceSegments = voiceSegments.map((segment) => {
    const from = voiceOffset;
    const duration = Math.max(1, Math.round(segment.durationSeconds * FPS));
    voiceOffset += duration;
    return {...segment, from, duration};
  });
  const activeVoiceSegment = timedVoiceSegments.find((segment) => frame >= segment.from && frame < segment.from + segment.duration) ?? timedVoiceSegments[timedVoiceSegments.length - 1];
  const subtitle = cleanSubtitle(activeVoiceSegment?.caption ?? scene.caption ?? scene.narration);
  const characterLineup = (scene.characters ?? []).length === 1;
  return <AbsoluteFill style={{background: '#10172a', opacity: fade, color: '#fff5df', fontFamily: 'sans-serif', overflow: 'hidden'}}>
    <Img src={staticFile(scene.visual)} style={{position: 'absolute', inset: scene.wideShot ? '-1%' : '-5%', width: scene.wideShot ? '102%' : '110%', height: scene.wideShot ? '102%' : '110%', objectFit: 'cover', transform: `scale(${scale})`}} />
    <AbsoluteFill style={{background: 'linear-gradient(180deg,#08112499 0%,transparent 25%,#07112418 48%,#071124ee 100%)'}} />
    <div style={{position: 'absolute', left: 68, top: 48, color: '#ffdc7d', fontSize: 24, letterSpacing: 3, textShadow: '0 2px 5px #000'}}>故事工坊 · {String(index + 1).padStart(2, '0')}</div>
    {(scene.characters ?? []).map((character, characterIndex) => <Img key={`${character}-${characterIndex}`} src={staticFile(character)} style={{position:'absolute',left:characterLineup?'1.5%':`${18+characterIndex*22}%`,bottom:characterLineup?'2.5%':'12%',width:characterLineup?640:330,height:characterLineup?274:410,objectFit:'contain',filter:'drop-shadow(0 12px 12px #0009)'}} />)}
    <div style={{position: 'absolute', left: 72, right: 72, bottom: 126, textAlign: 'center', whiteSpace: 'nowrap', fontSize: 36, lineHeight: 1.25, fontWeight: 750, textShadow: '0 3px 12px #000'}}>{subtitle}</div>
    <div style={{position: 'absolute', left: 110, right: 110, bottom: 66, textAlign: 'center', fontSize: 19, color: '#f6db9c', textShadow: '0 2px 5px #000'}}>{scene.title}</div>
    {timedVoiceSegments.length ? timedVoiceSegments.map((segment, index) => <Sequence key={`${segment.voice}-${index}`} from={segment.from} durationInFrames={segment.duration}><Audio src={staticFile(segment.voice)} volume={0.96} /></Sequence>) : scene.voice && <Audio src={staticFile(scene.voice)} volume={0.96} />}
  </AbsoluteFill>;
};

export const StoryDraft: React.FC<StoryDraftProps> = ({title, style, scenes, music}) => {
  let start = 0;
  const sequences = scenes.map((scene, index) => {
    const duration = Math.max(1, Math.round(scene.durationSeconds * FPS));
    const from = start;
    start += duration;
    return <Sequence key={`${index}-${scene.title}`} from={from} durationInFrames={duration}><SceneCard scene={scene} index={index} /></Sequence>;
  });
  return <AbsoluteFill style={{background: '#081326'}}>
    {music && <Loop durationInFrames={start}><Audio src={staticFile(music)} volume={0.18} /></Loop>}
    <div style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:10}}>
      <div style={{position:'absolute',left:24,right:24,top:24,height:7,background:'#edc85f'}} />
      <div style={{position:'absolute',left:54,top:54,color:'#fff0c7',fontSize:22,textShadow:'0 2px 6px #000'}}>{title}　·　{style}</div>
    </div>
    {sequences}
  </AbsoluteFill>;
};
