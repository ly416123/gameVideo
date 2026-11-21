import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, Sequence, useCurrentFrame, useVideoConfig, staticFile} from 'remotion';
import {shots, fps, type Shot} from './story';

const paper = '#f5ebd4';
const asset = (name: string) => staticFile(`assets/${name}`);
const layerAsset = (name: string) => staticFile(`assets/layers/riverbank-v1/${name}`);
const farmLayerAsset = (name: string) => staticFile(`assets/layers/farmhouse-v1/${name}`);
const voiceDurations = [3.75, 4.7, 3.72, 4.72, 4.1, 2.8, 4.82, 5.0];

const Caption: React.FC<{text: string}> = ({text}) => (
  <div style={{position:'absolute',left:110,right:110,bottom:74,textAlign:'center',fontFamily:'sans-serif',fontSize:52,fontWeight:700,color:'#fff9e9',textShadow:'0 3px 8px #392c1db3, 0 1px 2px #30271f',letterSpacing:2}}>{text}</div>
);

const Water: React.FC<{frame: number; splash?: boolean}> = ({frame,splash=false}) => {
  const rings = [0,1,2].map((i) => {
    const phase = ((frame + i*18) % 72) / 72;
    return <div key={i} style={{position:'absolute',left:`${39+i*4}%`,top:`${58+i*1.5}%`,width:40+phase*220,height:12+phase*42,border:`${Math.max(1,3-phase*2)}px solid rgba(239,248,222,${0.42*(1-phase)})`,borderRadius:'50%',transform:'translate(-50%,-50%)'}}/>;
  });
  return <div style={{position:'absolute',inset:0,pointerEvents:'none'}}>{rings}{splash && <><i style={{position:'absolute',left:'52%',top:'63%',width:12,height:24,background:'#f7f1da',borderRadius:20,transform:`rotate(${Math.sin(frame/4)*15}deg)`}}/><i style={{position:'absolute',left:'54%',top:'64%',width:9,height:18,background:'#fff8dc',borderRadius:20,transform:`rotate(${-18+Math.cos(frame/5)*9}deg)`}}/></>}</div>;
};

const RiverBankLayers: React.FC<{shot: Shot; drift: number; scale: number}> = ({shot,drift,scale}) => {
  const {width} = useVideoConfig();
  const layerStyle = (parallax: number): React.CSSProperties => {
    const offset = drift*parallax;
    const horizontalBleed = Math.max(scale,1+(Math.abs(offset)*2)/width+0.01);
    return {
      position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'fill',
      transform:`translateX(${offset}px) scaleX(${horizontalBleed}) scaleY(${scale})`,
    };
  };
  return <AbsoluteFill style={{overflow:'hidden'}}>
    <Img src={layerAsset('sky-clouds.png')} style={layerStyle(0.08)}/>
    <Img src={layerAsset('sun.png')} style={{position:'absolute',left:'66%',top:'-11%',width:'50%',height:'50%',objectFit:'contain',transform:`translateX(${drift*0.1}px)`}}/>
    <Img src={layerAsset('mountains.png')} style={{...layerStyle(0.2),top:'-10%'}}/>
    <Img src={layerAsset('far-bank-trees.png')} style={layerStyle(0.45)}/>
    <Img src={layerAsset('river.png')} style={{...layerStyle(0.7),top:'15%',height:'68%'}}/>
    <Img src={layerAsset('willow-tree.png')} style={{position:'absolute',left:'44%',bottom:'-2%',width:'62%',height:'96%',objectFit:'contain',transform:`translateX(${drift}px) scaleX(${Math.max(scale,1+(Math.abs(drift)*2)/width+0.01)}) scaleY(${scale})`}}/>
    <Img src={layerAsset('near-bank-grass.png')} style={{...layerStyle(0.7),top:'-4%',height:'104%'}}/>
  </AbsoluteFill>;
};

const FarmhouseLayers: React.FC<{scale: number}> = ({scale}) => {
  const layerStyle: React.CSSProperties = {position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'fill'};
  return <AbsoluteFill style={{overflow:'hidden',transform:`scale(${scale})`}}>
    <Img src={layerAsset('sky-clouds.png')} style={layerStyle}/>
    <Img src={layerAsset('sun.png')} style={{position:'absolute',left:'70%',top:'-4%',width:'36%',height:'45%',objectFit:'contain'}}/>
    <Img src={layerAsset('mountains.png')} style={{...layerStyle,top:'-7%'}}/>
    <Img src={farmLayerAsset('ground-meadow.png')} style={{position:'absolute',left:0,top:'40%',width:'100%',height:'60%',objectFit:'fill'}}/>
    <Img src={farmLayerAsset('wheat-fence-v2.png')} style={layerStyle}/>
    <Img src={farmLayerAsset('house.png')} style={{position:'absolute',left:'-2%',top:'18%',width:'51%',height:'72%',objectFit:'contain'}}/>
    <Img src={farmLayerAsset('dirt-path.png')} style={layerStyle}/>
    <Img src={farmLayerAsset('foreground-meadow.png')} style={layerStyle}/>
    <Img src={farmLayerAsset('overhead-willow-v2.png')} style={{position:'absolute',left:'-12%',top:'-10%',width:'52%',height:'38%',objectFit:'contain'}}/>
  </AbsoluteFill>;
};

const ShotScene: React.FC<{shot: Shot}> = ({shot}) => {
  const frame = useCurrentFrame();
  const local = frame;
  const length = (shot.end-shot.start)*fps;
  const progress = local/length;
  const crossingProgress = interpolate(local,[0,length-15],[0,1],{extrapolateRight:'clamp'});
  const scale = shot.motion === 'push' ? interpolate(progress,[0,1],[1,1.09]) : shot.motion === 'pull' ? interpolate(progress,[0,1],[1.1,1]) : 1.04;
  const drift = shot.motion === 'pan' ? interpolate(progress,[0,1],[0,-95]) : shot.motion === 'push' ? interpolate(progress,[0,1],[0,-20]) : shot.id===8 ? -95 : 0;
  const river = shot.id !== 1;
  const walking = shot.id===1 || (shot.id===2 && local<135) || (shot.id===7 && local<length-15);
  const ponyLeft = shot.id === 7 ? interpolate(crossingProgress,[0,1],[34,22]) : shot.id===8 ? 22 : shot.id === 1 ? interpolate(progress,[0,1],[35,43]) : shot.id===2 ? interpolate(local,[0,135],[24,40],{extrapolateRight:'clamp'}) : shot.id===6 ? 34 : 28;
  const pop = interpolate(Math.min(local,12),[0,12],[0,1]);
  const ponyOpacity = shot.id===7 || shot.id===8 ? 1 : pop;
  const walkIndex = Math.floor(local / 6) % 4 + 1;
  const ponyImage = walking ? `pony-walk-cycle-${walkIndex}.png` : 'pony-walk.png';
  const ponyWidth = shot.id===7 ? `${interpolate(crossingProgress,[0,1],[22,18])}%` : shot.id===8 ? '18%' : '22%';
  const ponyHeight = shot.id===7 ? `${interpolate(crossingProgress,[0,1],[36,27])}%` : shot.id===8 ? '27%' : '36%';
  const ponyTop = shot.id===1 ? 48 : shot.id===6 ? 37 : shot.id===7 ? interpolate(crossingProgress,[0,1],[37,19]) : shot.id===8 ? 19 : 50;
  return <AbsoluteFill style={{backgroundColor:paper,overflow:'hidden'}}>
    {shot.id===1
      ? <FarmhouseLayers scale={scale}/>
      : <RiverBankLayers shot={shot} drift={drift} scale={scale}/>}
    {river && <Water frame={frame} splash={shot.id===6}/>}
    {shot.id===1 && <Img src={asset('mother-mare.png')} style={{position:'absolute',left:'4%',top:'30%',width:'36%',height:'50%',objectFit:'contain',filter:'drop-shadow(0 10px 8px #44362425)',opacity:pop}}/>}
    {shot.id===3 && <Img src={asset('old-ox-transparent.png')} style={{position:'absolute',left:'59%',top:'50%',width:'24%',height:'36%',objectFit:'contain',transform:'scaleX(-1)',filter:'drop-shadow(0 8px 7px #52452a22)',opacity:pop}}/>}
    {shot.id===4 && <Img src={asset('squirrel-transparent.png')} style={{position:'absolute',left:'73%',top:'40%',width:'18%',height:'35%',objectFit:'contain',filter:'drop-shadow(0 8px 7px #52452a22)',opacity:pop}}/>}
    <Img src={asset(ponyImage)} style={{position:'absolute',left:`${ponyLeft}%`,top:`${ponyTop}%`,width:ponyWidth,height:ponyHeight,objectFit:'contain',filter:'drop-shadow(0 14px 10px #44362433)',opacity:ponyOpacity}}/>
    <div style={{position:'absolute',left:40,top:34,padding:'12px 22px',borderRadius:30,background:'#fff7e5bb',color:'#62533a',fontSize:23,fontFamily:'sans-serif',letterSpacing:3}}>{String(shot.id).padStart(2,'0')}　{shot.title}</div>
    <Caption text={shot.caption}/>
  </AbsoluteFill>;
};

export const StoryFilm: React.FC = () => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const fadeIn = interpolate(frame,[0,18],[0,1],{extrapolateRight:'clamp'});
  const fadeOut = interpolate(frame,[durationInFrames-18,durationInFrames],[1,0],{extrapolateLeft:'clamp'});
  return <AbsoluteFill style={{opacity:Math.min(fadeIn,fadeOut),backgroundColor:paper}}>
    {shots.map((shot) => <Sequence key={shot.id} from={shot.start*fps} durationInFrames={(shot.end-shot.start)*fps}><ShotScene shot={shot}/></Sequence>)}
    <Audio src={staticFile('audio/river-ambience.wav')} volume={0.13}/>
    <Sequence from={25*fps} durationInFrames={7*fps}><Audio src={staticFile('audio/splash.wav')} volume={0.36}/></Sequence>
    {shots.map((shot) => <Sequence key={`vo-${shot.id}`} from={shot.start*fps + Math.floor(((shot.end-shot.start)*fps - voiceDurations[shot.id-1]*fps)/2)} durationInFrames={Math.ceil(voiceDurations[shot.id-1]*fps)}><Audio src={staticFile(`audio/voice-${shot.id}.wav`)} volume={0.94}/></Sequence>)}
    {frame>=(37*fps) && <div style={{position:'absolute',left:'50%',top:100,transform:'translateX(-50%)',padding:'9px 28px',borderRadius:28,background:'#fff5ddc9',textAlign:'center',fontSize:34,fontWeight:700,color:'#6d5734',fontFamily:'serif',textShadow:'0 1px #fff6da',whiteSpace:'nowrap'}}>遇事多观察，答案在脚下</div>}
  </AbsoluteFill>;
};
