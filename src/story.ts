export type Shot = {
  id: number;
  title: string;
  start: number;
  end: number;
  voiceover: string;
  caption: string;
  motion: 'push' | 'pan' | 'pull' | 'hold';
  mood: 'warm' | 'curious' | 'tense' | 'hopeful';
};

export const shots: Shot[] = [
  {id: 1, title: '出发', start: 0, end: 4, voiceover: '小马要替妈妈把一袋麦子送到河对岸。', caption: '小马要替妈妈送麦子', motion: 'push', mood: 'warm'},
  {id: 2, title: '遇河', start: 4, end: 9, voiceover: '可到了河边，它停住了：这条河到底有多深？', caption: '这条河到底有多深？', motion: 'pan', mood: 'curious'},
  {id: 3, title: '老牛', start: 9, end: 14, voiceover: '老牛说，水很浅，刚没过小腿。', caption: '老牛说：水很浅', motion: 'push', mood: 'warm'},
  {id: 4, title: '松鼠', start: 14, end: 20, voiceover: '小松鼠却急忙喊，水很深，千万别下去！', caption: '松鼠喊：水很深，千万别下去！', motion: 'hold', mood: 'tense'},
  {id: 5, title: '犹豫', start: 20, end: 25, voiceover: '一个说浅，一个说深，小马更拿不准了。', caption: '一个说浅，一个说深……', motion: 'push', mood: 'curious'},
  {id: 6, title: '试水', start: 25, end: 32, voiceover: '它想了想，决定先试一试。', caption: '小马决定先试一试', motion: 'hold', mood: 'hopeful'},
  {id: 7, title: '过河', start: 32, end: 37, voiceover: '原来河水没有想象中那么深，小马顺利过了河。', caption: '小马顺利过了河', motion: 'pan', mood: 'hopeful'},
  {id: 8, title: '收束', start: 37, end: 42, voiceover: '遇到不知道的事，听别人说，也要动脑筋、亲自判断。', caption: '听取意见，也要亲自判断', motion: 'hold', mood: 'warm'},
];

export const totalSeconds = shots[shots.length - 1].end;
export const fps = 30;
