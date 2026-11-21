import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

function makeGame(){
  const overlay={className:'',innerHTML:'',querySelector:()=>({onclick:null})};
  const canvas={getContext:()=>({})};
  const status={textContent:''};
  const document={querySelector:selector=>selector==='#game'?canvas:selector==='#overlay'?overlay:status,addEventListener:()=>{}};
  class FakeAudio{constructor(src){this.src=src;this.paused=true;this.currentTime=0;this.volume=1}play(){this.paused=false;return Promise.resolve()}pause(){this.paused=true}}
  const stored=new Map();const localStorage={getItem:key=>stored.get(key)??null,setItem:(key,value)=>stored.set(key,value)};
  const context=vm.createContext({document,Image:class{},Audio:FakeAudio,localStorage,requestAnimationFrame:()=>{},setTimeout:()=>{},Math,AudioContext:class{},window:{addEventListener:()=>{}},console});
  vm.runInContext(readFileSync(new URL('./main.js',import.meta.url),'utf8'),context);
  vm.runInContext('start()',context);
  return context;
}

test('U 抓住后保持控制，第二次按 U 才投掷',()=>{
  const c=makeGame();
  vm.runInContext('game.enemies=[entity("mouse",game.p.x+45,game.p.y+8)];attack("grab");update(.4)',c);
  assert.equal(vm.runInContext('game.p.grab===game.enemies[0]',c),true);
  vm.runInContext('throwGrab()',c);
  assert.equal(vm.runInContext('game.p.grab',c),null);
  assert.ok(vm.runInContext('game.enemies[0].hp',c)<28);
});

test('关卡有鸡腿、汉堡、可打碎物和可拾取武器',()=>{
  const c=makeGame();
  assert.equal(vm.runInContext('game.drops.some(d=>d.type==="drumstick")',c),true);
  assert.equal(vm.runInContext('game.props.some(p=>p.loot==="burger")',c),true);
  assert.equal(vm.runInContext('game.props.some(p=>p.type==="crate")',c),true);
  assert.equal(vm.runInContext('game.props.some(p=>p.type==="rock")',c),true);
  assert.equal(vm.runInContext('game.props.some(p=>p.loot==="pipe"||p.loot==="stick")',c),true);
});

test('打碎箱子掉落汉堡，拾取后恢复体力',()=>{
  const c=makeGame();
  vm.runInContext('game.p.x=280;game.p.y=430;game.p.hp=60;hit(0,30,80,25)',c);
  assert.equal(vm.runInContext('game.drops.some(d=>d.type==="burger")',c),true);
  vm.runInContext('game.p.x=325;pickup()',c);
  assert.ok(vm.runInContext('game.p.hp',c)>60);
});

test('打碎石头取得铁管，攻击消耗耐久',()=>{
  const c=makeGame();
  vm.runInContext('game.p.x=785;game.p.y=405;game.p.face=1;hit(0,35,80,25)',c);
  assert.equal(vm.runInContext('game.drops.some(d=>d.type==="pipe")',c),true);
  vm.runInContext('game.p.x=830;pickup()',c);
  assert.equal(vm.runInContext('game.p.weapon.type',c),'pipe');
  vm.runInContext('game.p.attack=0;attack()',c);
  assert.ok(vm.runInContext('game.p.weapon.uses',c)<12);
});

test('小马移动时行走帧以可读的步频切换',()=>{
  const c=makeGame();
  vm.runInContext('keys.add("KeyD");update(.1)',c);
  assert.ok(vm.runInContext('game.p.walk',c)<=.61);
  assert.equal(vm.runInContext('ponyPose(game.p,true).col',c),1);
});

test('拾取武器后使用挥击姿势，最后一次挥击仍显示武器',()=>{
  const c=makeGame();
  vm.runInContext('game.p.weapon={type:"pipe",uses:1};attack()',c);
  assert.equal(vm.runInContext('game.p.attackType',c),'weapon');
  assert.equal(vm.runInContext('game.p.weapon',c),null);
  assert.equal(vm.runInContext('ponyPose(game.p,true).col',c),2);
  assert.equal(vm.runInContext('ponyPose(game.p,true).weapon',c),'pipe');
});

test('持武器跳跃和冲刺攻击也使用武器姿势',()=>{
  for(const kind of ['jump','dash']){
    const c=makeGame();
    vm.runInContext(`game.p.weapon={type:"stick",uses:2};attack("${kind}")`,c);
    assert.equal(vm.runInContext('ponyPose(game.p,false).col',c),2);
    assert.equal(vm.runInContext('ponyPose(game.p,false).weapon',c),'stick');
  }
});


test('序章后进入游戏时开始循环背景音乐',()=>{
  const c=makeGame();
  assert.equal(vm.runInContext('bgm.loop',c),true);
  assert.equal(vm.runInContext('bgm.paused',c),false);
  assert.ok(vm.runInContext('bgm.src',c).includes('battle.ogg'));
});

test('松鼠登场前和战败后均播放逐句对话 CG',()=>{
  const c=makeGame();
  vm.runInContext('spawnWave();spawnWave();spawnWave();spawnWave()',c);
  assert.equal(vm.runInContext('mode',c),'dialogue');
  assert.equal(vm.runInContext('dialogueKind',c),'before');
  assert.equal(vm.runInContext('game.enemies[0].type',c),'boss');
  assert.ok(vm.runInContext('overlay.innerHTML',c).includes('squirrel-dialogue-before-v1.png'));
  assert.equal(vm.runInContext('squirrelVoice.paused',c),false);
  vm.runInContext('advanceDialogue()',c);
  assert.equal(vm.runInContext('horseVoice.paused',c),false);
  vm.runInContext('while(mode==="dialogue")advanceDialogue();win()',c);
  assert.equal(vm.runInContext('mode',c),'dialogue');
  assert.equal(vm.runInContext('dialogueKind',c),'after');
  assert.ok(vm.runInContext('overlay.innerHTML',c).includes('squirrel-dialogue-after-v1.png'));
  vm.runInContext('while(mode==="dialogue")advanceDialogue()',c);
  assert.equal(vm.runInContext('mode',c),'win');
  assert.ok(vm.runInContext('overlay.innerHTML',c).includes('第一关通关'));
});

test('武器绘制裁掉图集右侧和底部的黑色分隔线',()=>{
  const c=makeGame();
  assert.equal(JSON.stringify(vm.runInContext('weaponCell("stick")',c)),JSON.stringify({x:0,y:0,w:16,h:16}));
  assert.equal(JSON.stringify(vm.runInContext('weaponCell("pipe")',c)),JSON.stringify({x:85,y:0,w:16,h:16}));
});

test('满体力仍可吃掉鸡腿和汉堡，但体力不变',()=>{
  for(const type of ['drumstick','burger']){
    const c=makeGame();
    vm.runInContext(`game.p.hp=game.p.maxHp;game.drops=[{x:game.p.x,y:game.p.y,type:"${type}"}];pickup()`,c);
    assert.equal(vm.runInContext('game.drops.length',c),0);
    assert.equal(vm.runInContext('game.p.hp',c),120);
    assert.ok(vm.runInContext('game.notice',c).includes('体力已满'));
  }
});

test('两套普通敌兵素材按各自原始朝向面对小马',()=>{
  const c=makeGame();
  assert.equal(vm.runInContext('spriteFacing({type:"mouse",face:-1})',c),1);
  assert.equal(vm.runInContext('spriteFacing({type:"mouse",face:1})',c),-1);
  assert.equal(vm.runInContext('spriteFacing({type:"frog",face:-1})',c),-1);
  assert.equal(vm.runInContext('spriteFacing({type:"frog",face:1})',c),1);
});


test('背景音乐和音效独立调节并保存设置',()=>{
  const c=makeGame();
  vm.runInContext('setAudioLevel("music",.5);setAudioLevel("effects",.25)',c);
  assert.equal(vm.runInContext('bgm.volume',c),.225);
  assert.equal(vm.runInContext('horseVoice.volume',c),.1625);
  assert.equal(vm.runInContext('squirrelVoice.volume',c),.175);
  assert.equal(vm.runInContext('effectGain(.08)',c),.02);
  assert.equal(vm.runInContext('JSON.parse(localStorage.getItem("xiaoma.audio.v1")).music',c),.5);
  vm.runInContext('setAudioLevel("effects",0)',c);
  assert.equal(vm.runInContext('effectGain(.08)',c),0);
});

test('对话期间音乐降低音量，恢复战斗后回到设定音量',()=>{
  const c=makeGame();
  vm.runInContext('setAudioLevel("music",.5);showDialogue("before")',c);
  assert.ok(vm.runInContext('bgm.volume',c)<.225);
  vm.runInContext('while(mode==="dialogue")advanceDialogue()',c);
  assert.equal(vm.runInContext('bgm.volume',c),.225);
});
