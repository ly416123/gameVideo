import React from 'react';
import {Composition} from 'remotion';
import {StoryFilm} from './story-film';
import {fps, totalSeconds} from './story';
import {StoryLottery} from './story-lottery';
import {lotteryConfig} from './story-lottery-config';
import {EPISODE_DURATION_FRAMES, XiaomaEpisode} from './story-episode';
import {StoryDraft, storyDraftMetadata} from './story-draft';

export const RemotionRoot: React.FC = () => (
  <>
  <Composition
    id="XiaomaGuohe"
    component={StoryFilm}
    durationInFrames={totalSeconds * fps}
    fps={fps}
    width={1920}
    height={1080}
  />
  <Composition
    id="StoryLottery"
    component={StoryLottery}
    durationInFrames={20 * fps}
    fps={fps}
    width={1920}
    height={1080}
    defaultProps={lotteryConfig}
  />
  <Composition
    id="XiaomaEpisode"
    component={XiaomaEpisode}
    durationInFrames={EPISODE_DURATION_FRAMES}
    fps={fps}
    width={1920}
    height={1080}
  />
  <Composition
    id="StoryDraft"
    component={StoryDraft}
    durationInFrames={storyDraftMetadata.durationInFrames}
    fps={30}
    width={1920}
    height={1080}
    defaultProps={storyDraftMetadata.defaultProps}
    calculateMetadata={storyDraftMetadata.calculateMetadata}
  />
  </>
);
