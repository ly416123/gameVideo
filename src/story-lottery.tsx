import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import type {LotteryProps} from './story-lottery-config';

const START = 66;
const STOP = 225;
const ROW = 106;
const WINDOW_HEIGHT = ROW * 7;

const seededShuffle = (items: string[], seed: number) => {
  const result = [...items];
  let state = seed >>> 0;
  const random = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

const roundRect = (radius: number, background: string, border: string) => ({
  borderRadius: radius,
  background,
  border: `2px solid ${border}`,
});

const TickSound: React.FC<{stories: string[]; winner: string; seed: number; frameOffset: number}> = ({stories, winner, seed, frameOffset}) => {
  const shuffled = seededShuffle(stories, seed);
  const target = Math.max(0, shuffled.indexOf(winner));
  const base = 54;
  const steps = base + ((target - base % shuffled.length + shuffled.length) % shuffled.length);

  return <>
    {Array.from({length: steps}, (_, i) => {
      const passed = i + 1;
      const normalized = 1 - Math.sqrt(1 - passed / steps);
      const at = START + Math.round(normalized * (STOP - START));
      return <Sequence key={i} from={at - frameOffset} durationInFrames={3}>
        <Audio src={staticFile('lottery-audio/tick.wav')} volume={0.42}/>
      </Sequence>;
    })}
    <Sequence from={STOP - frameOffset} durationInFrames={7}>
      <Audio src={staticFile('lottery-audio/stop.wav')} volume={0.76}/>
    </Sequence>
    <Sequence from={STOP + 4 - frameOffset} durationInFrames={90}>
      <Audio src={staticFile('lottery-audio/win.wav')} volume={0.78}/>
    </Sequence>
    <Sequence from={STOP + 75 - frameOffset} durationInFrames={90}>
      <Audio src={staticFile('lottery-audio/winner-voice.wav')} volume={1}/>
    </Sequence>
  </>;
};

export const StoryLottery: React.FC<LotteryProps & {frameOffset?: number}> = ({stories, winner, seed, frameOffset = 0}) => {
  const frame = useCurrentFrame() + frameOffset;
  const storyList = stories.length ? stories : [winner || '小马过河'];
  const safeStories = storyList.includes(winner) ? storyList : [...storyList, winner];
  const shuffled = seededShuffle(safeStories, seed);
  const winnerIndex = Math.max(0, shuffled.indexOf(winner));
  const baseSteps = 54;
  const steps = baseSteps + ((winnerIndex - baseSteps % shuffled.length + shuffled.length) % shuffled.length);
  const progress = interpolate(frame, [START, STOP], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const eased = 1 - Math.pow(1 - progress, 2);
  const travel = eased * steps;
  const stopped = frame >= STOP;
  const reveal = interpolate(frame, [STOP, STOP + 16], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const pulse = 0.5 + 0.5 * Math.sin(Math.max(0, frame - STOP) / 7);
  const startIndex = Math.floor(travel);
  const fractional = travel - startIndex;
  const firstRow = -3;
  const rollingRows = Array.from({length: 17}, (_, i) => {
    const relative = firstRow + i;
    const listIndex = ((startIndex + relative) % shuffled.length + shuffled.length) % shuffled.length;
    const title = shuffled[listIndex];
    const y = (relative - fractional) * ROW + (WINDOW_HEIGHT - ROW) / 2;
    const centered = relative === 0;
    const distance = Math.abs(relative - fractional);
    const opacity = Math.max(0.12, 1 - distance * 0.24);
    return {title, y, centered, opacity, key: `${relative}-${listIndex}`};
  });
  return <AbsoluteFill style={{overflow: 'hidden', background: '#080d24', color: '#fff5dc', fontFamily: 'monospace, "Microsoft YaHei", sans-serif'}}>
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 42%, #24386f 0%, #111a3d 43%, #080d24 78%)'}}/>
    <div style={{position: 'absolute', inset: 18, border: '4px solid #eec861', boxShadow: 'inset 0 0 0 5px #672d58, 0 0 0 5px #141936'}}/>
    <div style={{position: 'absolute', inset: 28, pointerEvents: 'none', opacity: 0.13, background: 'repeating-linear-gradient(0deg, transparent 0 5px, #d9e7ff 6px 7px)'}}/>

    <div style={{position: 'absolute', left: 86, top: 64, display: 'flex', alignItems: 'center', gap: 20}}>
      <div style={{width: 14, height: 14, background: '#ffda68', boxShadow: '0 0 18px #ffcc55'}}/>
      <div style={{fontSize: 21, color: '#f4d578', letterSpacing: 7}}>故事抽奖　/　STORY DRAW</div>
    </div>
    <div style={{position: 'absolute', right: 88, top: 68, fontSize: 18, color: '#abb8de', letterSpacing: 3}}>TONIGHT · 01</div>

    <div style={{position: 'absolute', top: 128, left: 0, right: 0, textAlign: 'center'}}>
      <div style={{fontSize: 54, lineHeight: 1.15, fontWeight: 900, letterSpacing: 8, color: '#fff1cc', textShadow: '0 4px #663753, 0 8px #101936'}}>
        今晚，读什么？
      </div>
      <div style={{marginTop: 14, fontSize: 20, letterSpacing: 5, color: '#9fb2dc'}}>STORIES ARE ON THE WAY</div>
    </div>

    <div style={{position: 'absolute', top: 250, left: '50%', width: 1040, height: WINDOW_HEIGHT, transform: 'translateX(-50%)', overflow: 'hidden', ...roundRect(26, '#0d1737e8', '#bf9b53'), boxShadow: '0 22px 80px #020617aa, inset 0 0 45px #738ac533'}}>
      <div style={{position: 'absolute', inset: 12, border: '1px solid #e2c57377', borderRadius: 18}}/>
      <div style={{position: 'absolute', top: 0, left: 0, right: 0, height: ROW * 2, background: 'linear-gradient(#0d1737 0%, #0d173700 100%)', zIndex: 3}}/>
      <div style={{position: 'absolute', bottom: 0, left: 0, right: 0, height: ROW * 2, background: 'linear-gradient(#0d173700 0%, #0d1737 100%)', zIndex: 3}}/>
      {rollingRows.map((row) => <div key={row.key} style={{position: 'absolute', top: row.y, left: 62, right: 62, height: ROW - 8, display: 'flex', alignItems: 'center', padding: '0 34px', opacity: row.opacity, transform: `scale(${row.centered ? 1.025 : 0.96})`, ...roundRect(15, row.centered ? '#293966' : '#111e42aa', row.centered ? '#f4d06c' : '#4d5f8a99'), boxShadow: row.centered ? '0 0 0 4px #7d3c59, 0 0 34px #ffd87566, inset 0 0 24px #ffdb7020' : 'inset 0 0 0 1px #ffffff0b', zIndex: row.centered ? 2 : 1}}>
        <div style={{width: 40, height: 40, marginRight: 26, display: 'grid', placeItems: 'center', color: row.centered ? '#161c38' : '#d4c278', background: row.centered ? '#f5d36f' : '#33456e', clipPath: 'polygon(50% 0,61% 37%,100% 50%,61% 63%,50% 100%,39% 63%,0 50%,39% 37%)'}}>✦</div>
        <div style={{fontSize: row.centered ? 41 : 32, fontWeight: 850, letterSpacing: 4, color: row.centered ? '#fff2cf' : '#bac8e5', textShadow: row.centered ? '0 3px #121a36' : 'none'}}>{row.title}</div>
        <div style={{marginLeft: 'auto', fontSize: 14, letterSpacing: 3, color: row.centered ? '#f5d578' : '#7384ad'}}>故事候选</div>
      </div>)}
      <div style={{position: 'absolute', left: 0, right: 0, top: (WINDOW_HEIGHT - ROW) / 2 - 4, height: ROW + 8, borderTop: '3px solid #ffdb76', borderBottom: '3px solid #ffdb76', boxShadow: '0 0 22px #ffcf5b99', pointerEvents: 'none', zIndex: 4}}/>
      <div style={{position: 'absolute', left: 8, top: WINDOW_HEIGHT / 2 - 19, width: 0, height: 0, borderTop: '19px solid transparent', borderBottom: '19px solid transparent', borderLeft: '27px solid #ffe07a', filter: 'drop-shadow(2px 3px #753a59)', zIndex: 5}}/>
      <div style={{position: 'absolute', right: 8, top: WINDOW_HEIGHT / 2 - 19, width: 0, height: 0, borderTop: '19px solid transparent', borderBottom: '19px solid transparent', borderRight: '27px solid #ffe07a', filter: 'drop-shadow(-2px 3px #753a59)', zIndex: 5}}/>
    </div>

    <div style={{position: 'absolute', left: 0, right: 0, top: 1010, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
      <div style={{padding: '13px 30px', fontSize: 18, letterSpacing: 5, color: stopped ? '#ffdf7d' : '#aab9df', ...roundRect(999, '#101a39', stopped ? '#edc560' : '#52648d'), boxShadow: stopped ? `0 0 ${18 + pulse * 16}px #ffc95a88` : 'none'}}>
        {stopped ? `本次抽中　「${winner}」` : '故事名单滚动中　·　正在抽取'}
      </div>
    </div>

    {stopped && Array.from({length: 22}, (_, i) => {
      const angle = (i / 22) * Math.PI * 2;
      const radius = 330 + ((i * 37) % 240);
      const x = 960 + Math.cos(angle + frame / 80) * radius;
      const y = 630 + Math.sin(angle + frame / 80) * radius * 0.52;
      const alpha = reveal * (0.45 + 0.5 * Math.sin(frame / 9 + i));
      return <div key={i} style={{position: 'absolute', left: x, top: y, width: i % 3 === 0 ? 12 : 7, height: i % 3 === 0 ? 12 : 7, background: i % 2 ? '#ffdf75' : '#f18c91', boxShadow: '0 0 12px currentColor', opacity: alpha, transform: `rotate(${frame * 2 + i * 21}deg)`}}/>;
    })}
    {frame >= START && <TickSound stories={safeStories} winner={winner} seed={seed} frameOffset={frameOffset}/>}
  </AbsoluteFill>;
};
