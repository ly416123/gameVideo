import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {extname,resolve,sep} from 'node:path';

const root=resolve(import.meta.dirname,'..');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.wav':'audio/wav','.mp3':'audio/mpeg','.ogg':'audio/ogg'};
const port=Number(process.env.PORT)||4173;
createServer(async(req,res)=>{
  try{
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if(pathname==='/'){res.writeHead(302,{Location:'/game/index.html'}).end();return;}
    const path=resolve(root,'.'+pathname);
    if(path!==root&&!path.startsWith(root+sep)){res.writeHead(403).end();return;}
    const body=await readFile(path);
    res.writeHead(200,{'Content-Type':mime[extname(path)]||'application/octet-stream'}).end(body);
  }catch{res.writeHead(404).end('Not found');}
}).listen(port,()=>console.log(`游戏入口：http://localhost:${port}/`));
