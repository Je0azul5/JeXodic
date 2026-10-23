import assert from 'node:assert/strict';

const origin=new URL(process.argv[2]||'https://jexodic.azurewebsites.net').origin;
const get=path=>fetch(origin+path,{signal:AbortSignal.timeout(45000)});
const health=await get('/healthz');assert.equal(health.status,200);assert.deepEqual(await health.json(),{status:'ok'});console.log('Health: OK');
const root=await get('/');assert.equal(root.status,200);assert.ok((await root.text()).includes('JeXodic'));console.log('Website: OK');
const status=await get('/api/ai/status');assert.deepEqual(await status.json(),{available:true});console.log('AI configured: OK');
for(const path of ['/.env.local','/server/ai.js'])assert.equal((await get(path)).status,404);
console.log('Private files: 404');
const day=new Date().toISOString().slice(0,10);
const generate=(payload,requestOrigin=origin)=>fetch(origin+'/api/ai/generate',{method:'POST',headers:{'Content-Type':'application/json',Origin:requestOrigin},body:JSON.stringify(payload),signal:AbortSignal.timeout(45000)});
const blocked=await generate({kind:'quote',day},'https://external.invalid');assert.equal(blocked.status,403);console.log('Cross-origin generation: blocked');
const quote=await generate({kind:'quote',day});assert.equal(quote.status,200);const q=await quote.json();assert.equal(q.source,'ai');assert.ok(q.content.quote.length>0);console.log('Live anonymous Azure quote: OK');
const cards=[{id:'major-0',reversed:false},{id:'cups-3',reversed:true},{id:'swords-14',reversed:false}];
const tarot=await generate({kind:'tarot',day,spread:'three',question:'¿Qué puedo explorar para avanzar en un proyecto creativo?',cards});assert.equal(tarot.status,200);const t=await tarot.json();assert.equal(t.source,'ai');assert.deepEqual(t.content.cards.map(c=>c.id),cards.map(c=>c.id));assert.ok(t.content.answer.length>0);console.log('Live anonymous tarot: OK');
