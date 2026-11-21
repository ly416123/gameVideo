import React from 'react';
import {Composition} from 'remotion';
import {StoryFilm} from './story-film';
import {fps, totalSeconds} from './story';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="XiaomaGuohe"
    component={StoryFilm}
    durationInFrames={totalSeconds * fps}
    fps={fps}
    width={1920}
    height={1080}
  />
);
