# 素材缺口与自动组片备注

## 当前可用

- 抽奖片：`out/story-lottery.mp4`，9.835 秒，包含抽奖滚动音效及“小马过河”配音。
- 完整实机片：`out/xiaoma-guohe-gameplay-final-v6.mp4`，225.84 秒，包含完整序章、三关流程、河影骑士和封印魔王战斗以及结局。
- 原始录屏与独立游戏音轨：`gameplay-captures/xiaoma-guohe-gameplay-final-v6/`。
- 九段序章 CG 配音：`public/assets/cg-audio/01.wav` 至 `09.wav`；CG BGM：`public/assets/free/audio/cg-intro.ogg`。
- 章节解说配音：`public/assets/episodes/xiaoma-guohe/voiceover/`；文本、模型和时长元数据：`voiceover.json`、`voiceover.generated.json`。
- 抽奖独立音效：`public/lottery-audio/`。

## 当前仍需审核/补齐

1. 实机片的章节时间点基于状态日志，精确到秒级，但尚无逐帧标注。逐镜头精剪前应人工检查边界，必要时以画面事件重新设置入出点。
2. 实机源片已含游戏原音；若后续添加章节旁白，应对照现有配音时长并做混音、避让对白和字幕，不应直接覆盖原音。
3. 当前抽奖成片的中奖故事配音等素材已在片内，不需另外生成。
4. 自动组片 v001 采用原片直接拼接，暂时没有单独生成字幕轨/工程时间线以外的可编辑字幕文件。需要独立字幕时可从台词清单导出 SRT。

本版本不需要新增美术或声音素材即可生成审核片。
