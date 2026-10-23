import {createServer} from 'node:http';
import {createHmac,randomBytes} from 'node:crypto';
import {isIP} from 'node:net';
import {handleAI} from './ai.js';

export class MemoryCache {
  constructor(max=256){this.entries=new Map();this.max=max;}
  async match(request){
    const key=request.url,entry=this.entries.get(key);
    if(!entry)return undefined;
    if(entry.expires<=Date.now()){this.entries.delete(key);return undefined;}
    this.entries.delete(key);this.entries.set(key,entry);
    return new Response(entry.body,{headers:entry.headers});
  }
  async put(request,response){
    const body=await response.text();if(body.length>16000)return;
    const seconds=Number(response.headers.get('cache-control')?.match(/max-age=(\d+)/)?.[1]||600);
    this.entries.delete(request.url);
    this.entries.set(request.url,{body,headers:Object.fromEntries(response.headers),expires:Date.now()+Math.min(seconds,86400)*1000});
    while(this.entries.size>this.max)this.entries.delete(this.entries.keys().next().value);
  }
}

export function generationBudget(max=100,now=()=>new Date()){
  let day='',count=0;
  return ()=>{const today=now().toISOString().slice(0,10);if(day!==today){day=today;count=0;}if(count>=max)return false;count++;return true;};
}

function clientAddress(req,env){
  let address=req.socket.remoteAddress||'unknown';
  // Trust the last proxy-appended address only when hosted by App Service.
  if(env.WEBSITE_INSTANCE_ID){
    let forwarded=String(req.headers['x-forwarded-for']||'').split(',').at(-1).trim();
    if(/^\[.*\]:\d+$/.test(forwarded))forwarded=forwarded.slice(1,forwarded.lastIndexOf(']'));
    else if(/^\d+\.\d+\.\d+\.\d+:\d+$/.test(forwarded))forwarded=forwarded.split(':')[0];
    if(isIP(forwarded))address=forwarded;
  }
  return address;
}

export function createNodeServer({assets,env=process.env,fetcher,cache=new MemoryCache()}={}){
  const origin=env.PUBLIC_ORIGIN||`http://localhost:${env.PORT||8080}`;
  const parsedOrigin=new URL(origin);
  if(parsedOrigin.pathname!=='/'||parsedOrigin.search||parsedOrigin.hash||parsedOrigin.username||parsedOrigin.password)throw Error('PUBLIC_ORIGIN debe ser solo el origen de la aplicación.');
  if(env.NODE_ENV==='production'&&parsedOrigin.protocol!=='https:')throw Error('PUBLIC_ORIGIN debe usar HTTPS en producción.');
  const salt=randomBytes(32);
  const limit=Number(env.AI_DAILY_LIMIT||100);
  if(!Number.isInteger(limit)||limit<1||limit>100000)throw Error('AI_DAILY_LIMIT no válido.');
  const allowGeneration=generationBudget(limit);
  const server=createServer(async(req,res)=>{
    try{
      if(!req.url?.startsWith('/')||req.url.startsWith('//')){res.writeHead(400).end();return;}
      const url=new URL(req.url,parsedOrigin.origin);
      if(url.origin!==parsedOrigin.origin){res.writeHead(400).end();return;}
      let response;
      if(url.pathname==='/healthz'&&['GET','HEAD'].includes(req.method))response=Response.json({status:'ok'});
      else if(url.pathname.startsWith('/api/')){
        const chunks=[];let length=0;
        for await(const chunk of req){length+=chunk.length;if(length>12000){res.writeHead(413,{'Content-Type':'application/json','Cache-Control':'no-store'}).end(JSON.stringify({error:'Solicitud demasiado grande.'}));return;}chunks.push(chunk);}
        const body=Buffer.concat(chunks);
        const headers=new Headers();
        for(const [name,value]of Object.entries(req.headers))if(value!==undefined)headers.set(name,Array.isArray(value)?value.join(','):value);
        const request=new Request(url,{method:req.method,headers,...(body.length&&!['GET','HEAD'].includes(req.method)?{body}:{})});
        const identity='public-'+createHmac('sha256',salt).update(clientAddress(req,env)).digest('hex');
        response=await handleAI(request,env,{identity,cache,allowGeneration,fetcher});
      }else if(!['GET','HEAD'].includes(req.method))response=new Response('Método no permitido',{status:405});
      else{
        const asset=assets[url.pathname==='/'?'/index.html':url.pathname];
        response=asset?new Response(asset.body,{headers:{'Content-Type':asset.type,'Cache-Control':url.pathname.startsWith('/assets/')?'public, max-age=31536000, immutable':'no-cache'}}):new Response('No encontrado',{status:404});
      }
      response.headers.set('X-Content-Type-Options','nosniff');
      response.headers.set('Referrer-Policy','strict-origin-when-cross-origin');
      response.headers.set('X-Frame-Options','DENY');
      response.headers.set('Permissions-Policy','camera=(), microphone=(), geolocation=()');
      if(env.NODE_ENV==='production')response.headers.set('Strict-Transport-Security','max-age=31536000');
      res.writeHead(response.status,Object.fromEntries(response.headers));
      res.end(req.method==='HEAD'?undefined:Buffer.from(await response.arrayBuffer()));
    }catch{
      if(!res.headersSent)res.writeHead(500,{'Content-Type':'application/json','Cache-Control':'no-store'});
      res.end(JSON.stringify({error:'No se pudo atender la solicitud.'}));
    }
  });
  server.requestTimeout=35000;server.headersTimeout=10000;server.maxHeadersCount=50;
  return server;
}
