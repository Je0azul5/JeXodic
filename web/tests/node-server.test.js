import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {createNodeServer,MemoryCache,generationBudget} from '../server/node.js';

const env={PUBLIC_ORIGIN:'https://jexodic.test',NODE_ENV:'production',WEBSITE_INSTANCE_ID:'test-instance',AZURE_OPENAI_ENDPOINT:'https://sonnetia.services.ai.azure.com/openai/v1/responses',AZURE_OPENAI_DEPLOYMENT:'gpt-4o',AZURE_OPENAI_API_KEY:'test-key',AI_DAILY_LIMIT:'10'};
const assets={'/index.html':{body:'<html>JeXodic</html>',type:'text/html'},'/assets/app.js':{body:'console.log("ready")',type:'text/javascript'}};
const quote=()=>({kind:'quote',day:new Date().toISOString().slice(0,10)});
const azure=()=>Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({quote:'Cuida el pequeño paso que puedes dar hoy.'})}]}]});
async function running(t,options={}){
  const server=createNodeServer({assets,env,fetcher:async()=>azure(),...options});
  server.listen(0,'127.0.0.1');await once(server,'listening');
  t.after(()=>{server.closeAllConnections();return new Promise(resolve=>server.close(resolve));});
  return `http://127.0.0.1:${server.address().port}`;
}
const post=(url,payload,headers={})=>fetch(url+'/api/ai/generate',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://jexodic.test',...headers},body:JSON.stringify(payload)});

test('Azure server serves public pages and health, never source or local secrets',async t=>{
  const url=await running(t);
  assert.equal((await fetch(url+'/')).status,200);
  assert.deepEqual(await(await fetch(url+'/healthz')).json(),{status:'ok'});
  const asset=await fetch(url+'/assets/app.js');assert.equal(asset.status,200);assert.ok(asset.headers.get('cache-control').includes('immutable'));
  assert.equal((await fetch(url+'/.env.local')).status,404);assert.equal((await fetch(url+'/server/ai.js')).status,404);
  assert.equal((await fetch(url+'/',{method:'HEAD'})).headers.get('x-frame-options'),'DENY');
});
test('public API works without Sites login and caches repeated daily content',async t=>{
  let calls=0;const url=await running(t,{fetcher:async()=>{calls++;return azure();}});
  const first=await post(url,quote());assert.equal(first.status,200);assert.equal((await first.json()).source,'ai');
  assert.equal((await post(url,quote())).status,200);assert.equal(calls,1);
  assert.equal((await post(url,quote(),{Origin:'https://external.test'})).status,403);
});
test('global generation budget blocks fresh provider calls but permits cached content',async t=>{
  const url=await running(t,{env:{...env,AI_DAILY_LIMIT:'1'}});
  assert.equal((await post(url,quote())).status,200);
  assert.equal((await post(url,{kind:'daily',day:quote().day,sign:4})).status,429);
  assert.equal((await post(url,quote())).status,200);
});
test('untrusted Sites IDs and prepended proxy addresses cannot bypass visitor limits',async t=>{
  const url=await running(t);
  for(let i=0;i<7;i++){
    const result=await post(url,{kind:'daily',day:quote().day,sign:i},{'oai-authenticated-user-id':`fake-${i}`,'x-forwarded-for':`198.51.100.${i}, 203.0.113.7`});
    assert.equal(result.status,i===6?429:502); // fixture is a quote, rejected for daily
  }
});
test('memory cache is bounded and generation budget resets on UTC day boundaries',async()=>{
  const cache=new MemoryCache(1),a=new Request('https://cache.test/a'),b=new Request('https://cache.test/b');
  await cache.put(a,Response.json({a:1}));await cache.put(b,Response.json({b:1}));
  assert.equal(await cache.match(a),undefined);assert.deepEqual(await(await cache.match(b)).json(),{b:1});
  let day='2026-10-23';const allow=generationBudget(1,()=>new Date(day+'T12:00:00Z'));
  assert.equal(allow(),true);assert.equal(allow(),false);day='2026-10-24';assert.equal(allow(),true);
});
