#!/usr/bin/env node
// Builds a video from source-grounded story material and approved still artwork.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2);
const arg=(name)=>{const i=args.indexOf(name);return i<0?undefined:args[i+1];};
const has=(name)=>args.includes(name);
const acts=['开始','发展','高潮','结尾'];
const known={'小马过河':'xiaoma-guohe','三只小猪':'three-little-pigs','田忌赛马':'tianji-saima'};
const safeSlug=(value)=>value.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||`story-${Date.now()}`;
const hanCount=(text)=>(String(text).match(/\p{Script=Han}/gu)??[]).length;
const sceneText=(block)=>block
  .split(/\r?\n/).map(line=>line.trim()).filter(Boolean)
  .filter(line=>!/^#{1,6}\s/.test(line)&&!/^\[?场景(?:\s*\d+)?\]?[:：]?$/.test(line))
  .map(line=>line.replace(/^[-*]\s+/,'').replace(/^>\s*/,''))
  .join('\n').trim();
const sectionsFrom=(markdown)=>{
  const matches=[...markdown.matchAll(/^##\s*(开始|发展|高潮|结尾)\s*$/gm)];
  if(matches.length){
    const ordered=matches.map(m=>acts.indexOf(m[1]));
    if(ordered.some((value,index)=>index>0&&value<ordered[index-1]))throw new Error('故事分节顺序需与原故事叙述顺序一致；不要求固定四幕。');
    return matches.map((match,index)=>{
      const from=match.index+match[0].length;
      const to=index+1<matches.length?matches[index+1].index:markdown.length;
      const content=markdown.slice(from,to).trim();
      const blocks=content.split(/\n\s*\n/).map(sceneText).filter(Boolean);
      return {name:match[1],text:content,scenes:blocks};
    });
  }
  const withoutMetadata=markdown.replace(/^##\s*(?:角色|原故事角色(?:（可选）)?|原故事来源\s*\/\s*版本|表现要求(?:（可选）)?)\s*\r?\n[\s\S]*?(?=^##\s|$(?![\s\S]))/gm,'');
  const withoutTitle=withoutMetadata.replace(/^#\s+.+\r?\n?/m,'');
  const blocks=withoutTitle.split(/\n\s*\n/).map(sceneText).filter(Boolean);
  if(!blocks.length){
    const plain=sceneText(withoutTitle);
    if(plain)blocks.push(plain);
  }
  if(!blocks.length)throw new Error('输入中没有可用于分镜的故事内容。请提供原故事梗概或正文，并注明来源/版本。');
  return [{name:'故事',text:withoutTitle.trim(),scenes:blocks}];
};
const roleDescriptionsFrom=(markdown)=>{
  const roleHeading=/^##\s*(?:角色|原故事角色(?:（可选）)?)\s*\r?\n/m.exec(markdown);
  if(!roleHeading)return [];
  const from=roleHeading.index+roleHeading[0].length;
  const next=markdown.slice(from).search(/^##\s+/m);
  const roleText=markdown.slice(from,next<0?undefined:from+next);
  const castMatches=[...roleText.matchAll(/^###\s+(.+)\s*$/gm)];
  return castMatches.map((match,index)=>{
    const bodyStart=match.index+match[0].length;
    const bodyEnd=index+1<castMatches.length?castMatches[index+1].index:roleText.length;
    return {id:`character-${String(index+1).padStart(2,'0')}`,name:match[1].trim(),description:roleText.slice(bodyStart,bodyEnd).trim()};
  });
};
/*
Story fidelity is editorially checked against the cited source. Automation may reorganize scenes and
visual presentation, but must never create plot events, modern jokes, or additional characters.
*/
const checkActSceneCounts=(sections)=>{
  const scenes=sections.flatMap(section=>section.scenes.map(text=>({act:section.name,text})));
  const total=hanCount(scenes.map(s=>s.text).join(''));
  return {scenes,total};
};

if(has('--prepare')){
  const title=arg('--title');
  const input=arg('--input');
  if(!title||!input)throw new Error('需要故事标题和故事材料文件（梗概或正文均可）：npm run story:prepare -- --title "故事名" --input /path/story.md');
  const markdown=fs.readFileSync(path.resolve(input),'utf8');
  const sections=sectionsFrom(markdown);
  const {scenes,total}=checkActSceneCounts(sections);
  const storyId=arg('--id')??known[title]??safeSlug(title);
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(storyId))throw new Error(`Invalid story id: ${storyId}`);
  const projectRel=`content/stories/${storyId}`;
  const project=path.join(ROOT,projectRel);
  for(const dir of ['brief','assets/characters','assets/scenes','edit','exports/previews'])fs.mkdirSync(path.join(project,dir),{recursive:true});
  const characters=roleDescriptionsFrom(markdown);
  const voiceBase=path.join(ROOT,'public','assets','episodes',storyId,'voice');
  let voiceVersion=1;
  while(fs.existsSync(path.join(voiceBase,`v${String(voiceVersion).padStart(3,'0')}`)))voiceVersion++;
  const voicePrefix=`assets/episodes/${storyId}/voice/v${String(voiceVersion).padStart(3,'0')}`;
  const prepared=scenes.map((scene,index)=>{
    const n=String(index+1).padStart(2,'0');
    return {shot_id:`${storyId}-s${String(index+1).padStart(3,'0')}`,order:index+1,act:scene.act,narration:scene.text,caption:scene.text,scene_image:`assets/episodes/${storyId}/scenes/scene-${n}.png`,character_images:characters.filter(c=>scene.text.includes(c.name)).map(c=>`assets/episodes/${storyId}/characters/${c.id}.png`),voice:`${voicePrefix}/scene-${n}.wav`};
  });
  const spec={schema_version:3,story_id:storyId,title,source_story:{path:`${projectRel}/brief/source-story.md`,han_characters:total,source_type:'user_provided_story_material'},voice_persona:'成熟、沉稳、有智慧感的故事讲述者',speaker:'Uncle_Fu',voice_instruction:'以成熟睿智、沉稳从容的讲述者口吻讲故事，语速舒缓自然，吐字清晰；不过度戏剧化，不卖萌，不加入原文没有的内容。',production_constraints:{source_fidelity:true,story_adaptation:'source_faithful',plot_invention:false,modern_jokes:false,new_characters:false,gameplay_footage:false,visual_sources:['character_images','scene_images'],video_tools:['Remotion','FFmpeg'],target_minutes:[3,5]},acts:sections.map(s=>({name:s.name,scene_count:s.scenes.length})),characters,scenes:prepared};
  fs.copyFileSync(path.resolve(input),path.join(project,'brief','source-story.md'));
  fs.writeFileSync(path.join(project,'brief','script.json'),JSON.stringify(spec,null,2)+'\n');
  const storyboard=`# 《${title}》故事分镜\n\n分镜依据输入故事材料整理，共 ${total} 个汉字，拆为 ${scenes.length} 场。允许调整呈现顺序、镜头和节奏；不得添加来源中没有的剧情、现代笑点或新角色。\n\n${sections.map(section=>`## ${section.name}\n\n${section.scenes.map((text,i)=>`${i+1}. ${text}`).join('\n\n')}`).join('\n\n')}\n`;
  fs.writeFileSync(path.join(project,'brief','storyboard.md'),storyboard);
  fs.writeFileSync(path.join(project,'edit','shot-list.json'),JSON.stringify({schema_version:2,story_id:storyId,title,status:'artwork_required',shots:prepared.map((scene,index)=>({shot_id:scene.shot_id,order:index+1,act:scene.act,narration:scene.narration,scene_image:scene.scene_image,character_images:scene.character_images,voice:scene.voice}))},null,2)+'\n');
  const characterPrompts=characters.map(c=>`### ${c.name}\n\n只按原故事已有角色设定生成透明背景角色立绘，不新增人物或设定。输出路径：\`public/assets/episodes/${storyId}/characters/${c.id}.png\`\n\n原故事中的角色依据：\n${c.description||`原故事角色：${c.name}`}\n`).join('\n');
  const scenePrompts=prepared.map((scene,index)=>`### 场景 ${index+1}（${scene.act}）\n\n保持本故事角色外观一致，生成 16:9、1920×1080 场景插画，不添加字幕/文字。输出路径：\`public/${scene.scene_image}\`\n关联角色：${scene.character_images.map(asset=>path.basename(asset,'.png')).join('、')||'按本幕角色设定'}\n\n画面依据的原文（不得扩写情节）：\n${scene.narration}\n`).join('\n');
  fs.writeFileSync(path.join(project,'assets','asset-prompts.md'),`# 《${title}》静态美术提示\n\n先按原故事已有角色生成透明立绘，再生成场景图；同一角色保持一致。不得增加原故事没有的剧情、现代笑点或新角色。视频只使用静态角色图和场景图做 Remotion 动效。\n\n## 角色\n\n${characterPrompts||'请先从来源故事中识别已有角色并确认角色清单；不得虚构新角色。'}\n## 场景\n\n${scenePrompts}`);
  fs.writeFileSync(path.join(project,'README.md'),`# 《${title}》视频项目\n\n- 当前状态：等待角色图和场景图\n- 故事材料：\`brief/source-story.md\`\n- 分镜：\`brief/storyboard.md\`\n- 结构化源稿：\`brief/script.json\`\n- 图像生成提示：\`assets/asset-prompts.md\`\n- 镜头清单：\`edit/shot-list.json\`\n\n剧情必须忠实于来源；不得新增剧情、现代笑点或新角色。视频只使用故事角色图、场景图、本地配音、Remotion 和 FFmpeg；不使用实机游戏录屏或视频生成模型。\n\n美术完成后运行：\`npm run story:create -- --story-id ${storyId}\`\n`);
  console.log(`故事材料已整理：${total} 字符，${scenes.length} 场。已建立 ${projectRel}；确认故事来源和原有角色后补充美术。`);
  process.exit(0);
}

if(has('--create')){
  const storyId=arg('--story-id');
  if(!storyId)throw new Error('需要 --story-id <id>');
  const projectRel=`content/stories/${storyId}`;
  const project=path.join(ROOT,projectRel);
  const scriptPath=path.join(project,'brief','script.json');
  if(!fs.existsSync(scriptPath))throw new Error(`找不到已准备的故事项目：${scriptPath}`);
  const spec=JSON.parse(fs.readFileSync(scriptPath,'utf8'));
  const policy=spec.production_constraints??{};
  if(policy.source_fidelity!==true||policy.plot_invention!==false||policy.modern_jokes!==false||policy.new_characters!==false||policy.gameplay_footage!==false)throw new Error('项目配置不符合“忠实来源、不原创剧情/现代笑点/新角色、静态角色/场景图”约束。');
  const missing=spec.scenes.flatMap(scene=>[scene.scene_image,...scene.character_images].filter(Boolean)).filter(asset=>!fs.existsSync(path.join(ROOT,'public',asset)));
  if(missing.length)throw new Error(`场景/角色图未齐，先按 assets/asset-prompts.md 生成并放入 public/：\n${[...new Set(missing)].join('\n')}`);
  const py=process.env.QWEN_PYTHON??'/data/code/tools/data/workspace/ma-guo-he-story/.venv-qwen/bin/python';
  const voice=spawnSync(py,[path.join(ROOT,'scripts/generate_story_voice.py'),path.join(projectRel,'brief/script.json')],{cwd:ROOT,stdio:'inherit'});
  if(voice.error)throw voice.error;
  if(voice.status!==0)throw new Error(`本地配音失败 (exit ${voice.status})`);
  const hydrated=JSON.parse(fs.readFileSync(scriptPath,'utf8'));
  const props={title:hydrated.title,style:'用户原故事插画',music:'assets/free/audio/cg-intro.ogg',scenes:hydrated.scenes.map(scene=>({title:scene.act,caption:scene.narration,narration:scene.narration,visual:scene.scene_image,characters:scene.character_images,voice:scene.voice,durationSeconds:scene.durationSeconds}))};
  const propsPath=path.join(project,'edit','render-props.json');
  fs.writeFileSync(propsPath,JSON.stringify(props,null,2)+'\n');
  let version=1;
  while(fs.existsSync(path.join(project,'exports','previews',`${storyId}-review-v${String(version).padStart(3,'0')}.mp4`)))version++;
  const outputRel=`${projectRel}/exports/previews/${storyId}-review-v${String(version).padStart(3,'0')}.mp4`;
  const remotion=spawnSync(path.join(ROOT,'node_modules/.bin/remotion'),['render','src/index.ts','StoryDraft',outputRel,'--props',propsPath,'--codec','h264','--crf','20','--audio-codec','aac','--concurrency','4'],{cwd:ROOT,stdio:'inherit'});
  if(remotion.error)throw remotion.error;
  if(remotion.status!==0)throw new Error(`Remotion 渲染失败 (exit ${remotion.status})`);
  const remotionOutput=path.join(ROOT,outputRel);
  const finalRel=outputRel.replace('.mp4','-ffmpeg.mp4');
  const mux=spawnSync('ffmpeg',['-hide_banner','-y','-i',remotionOutput,'-c','copy','-movflags','+faststart',path.join(ROOT,finalRel)],{cwd:ROOT,stdio:'inherit'});
  if(mux.error)throw mux.error;
  if(mux.status!==0)throw new Error(`FFmpeg remux 失败 (exit ${mux.status})`);
  const probe=spawnSync('ffprobe',['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',path.join(ROOT,finalRel)],{encoding:'utf8'});
  if(probe.status!==0)throw new Error('FFmpeg 输出无法读取');
  const duration=Number(probe.stdout.trim());
  const manifest={schema_version:1,story_id:storyId,title:hydrated.title,status:'review',output:finalRel,duration_seconds:duration,video:{width:1920,height:1080,fps:30},sources:{story:hydrated.source_story.path,images:hydrated.scenes.flatMap(scene=>[scene.scene_image,...scene.character_images])},tools:['local Qwen3-TTS','Remotion','FFmpeg']};
  fs.writeFileSync(path.join(project,'edit','assembly-report.json'),JSON.stringify(manifest,null,2)+'\n');
  console.log(`审核视频已生成：${finalRel}（${duration.toFixed(2)} 秒）`);
  process.exit(0);
}

console.log('故事材料准备：npm run story:prepare -- --title "故事名" --input story-source.md\n角色/场景图齐全后生成视频：npm run story:create -- --story-id <id>');
process.exit(2);
