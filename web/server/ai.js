const SIGNS = ['Aries','Tauro','Géminis','Cáncer','Leo','Virgo','Libra','Escorpio','Sagitario','Capricornio','Acuario','Piscis'];
const PLANETS = ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'];
const ASPECTS = ['Conjunción','Sextil','Cuadratura','Trígono','Oposición'];
const SYSTEM = `Eres la voz editorial de JeXodic. Escribe en español cálido, concreto y variado, sin fatalismo ni predicciones ciertas. La astrología y la numerología son herramientas simbólicas para reflexionar. No inventes posiciones, tránsitos, casas, aspectos ni cálculos: utiliza exclusivamente los datos recibidos y respeta las incertidumbres y la ausencia de hora. No des consejos médicos, financieros o legales ni afirmes conocer emociones o hechos de la vida del lector. Evita diagnósticos, estereotipos, promesas y atribuir citas a personas. Devuelve únicamente un objeto JSON válido con los campos solicitados, sin Markdown ni HTML.`;
const limits = new Map();
const pending = new Map();
const reply = (data, status=200) => Response.json(data, {status, headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const integer = (n, lo, hi) => Number.isInteger(n) && n >= lo && n <= hi;
const validSign = n => integer(n, 0, 11);
const invalid = () => { throw new Error('invalid'); };

export function normalizeInput(input, now=new Date()) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return invalid();
  const {kind, day} = input;
  const days = [-1,0,1].map(offset => new Date(now.getTime()+offset*86400000).toISOString().slice(0,10));
  if (!days.includes(day)) return invalid();
  if (kind === 'quote') return {kind,day};
  if (kind === 'daily' && validSign(input.sign)) return {kind,day,sign:input.sign};
  if (kind === 'numerology' && [1,2,3,4,5,6,7,8,9,11,22,33].includes(input.number)) return {kind,day,number:input.number};
  if (kind === 'compatibility' && validSign(input.first) && validSign(input.second) && ['Pareja','Amistad','Trabajo'].includes(input.relationship)) {
    return {kind,day,first:input.first,second:input.second,relationship:input.relationship};
  }
  if (kind !== 'natal') return invalid();
  const c = input.chart;
  if (!c || typeof c.unknown !== 'boolean' || !(c.asc === null || validSign(c.asc)) || (c.unknown && c.asc !== null)) return invalid();
  if (!Array.isArray(c.planets) || c.planets.length !== 10 || !Array.isArray(c.aspects) || c.aspects.length > 45) return invalid();
  const planets = c.planets.map((p,i) => {
    if (!p || p.id !== PLANETS[i] || !validSign(p.sign) || !Number.isFinite(p.degree) || p.degree < 0 || p.degree >= 30 || typeof p.uncertain !== 'boolean') return invalid();
    if (!(p.house === null || integer(p.house,1,12)) || (c.unknown && p.house !== null)) return invalid();
    return {id:p.id,sign:p.sign,degree:p.degree,house:p.house,uncertain:p.uncertain};
  });
  const aspects = c.aspects.map(a => {
    if (!a || !PLANETS.includes(a.first) || !PLANETS.includes(a.second) || a.first === a.second || !ASPECTS.includes(a.name) || !Number.isFinite(a.orb) || a.orb < 0 || a.orb > 6) return invalid();
    return {first:a.first,second:a.second,name:a.name,orb:Math.round(a.orb*100)/100};
  });
  return {kind,day,chart:{unknown:c.unknown,asc:c.asc,planets,aspects}};
}

export function promptFor(input) {
  const legend = `Índices de signos: ${SIGNS.map((s,i)=>`${i}=${s}`).join(', ')}.`;
  if (input.kind === 'quote') return `Crea una frase original de reflexión para el día ${input.day}, entre 8 y 24 palabras, máximo 180 caracteres. Varía el tema según el día: descanso, propósito, vínculos, creatividad o autoconocimiento. No uses signos ni predicciones. JSON: {"quote":"..."}.`;
  if (input.kind === 'daily') return `${legend} Redacta una lectura general simbólica para ${SIGNS[input.sign]}, fecha ${input.day}, sin tránsitos ni datos personales. Cada texto de 1 o 2 oraciones, máximo 400 caracteres. La reflexión debe ser una pregunta breve. JSON: {"intro":"...","love":"...","work":"...","wellbeing":"...","reflection":"..."}.`;
  const task = input.kind === 'natal'
    ? 'Amplía la interpretación de esta carta natal, integrando las posiciones calculadas. No es una lectura del cielo actual. Si la hora es desconocida explica la limitación sin atribuir ascendente ni casas. Los aspectos son orientativos cuando falta la hora.'
    : input.kind === 'numerology'
      ? 'Amplía la interpretación simbólica de este número de camino de vida ya calculado; no recalcules ni asumas una fecha de nacimiento.'
      : 'Amplía la lectura de afinidades de estos dos signos solares para el vínculo indicado, sin porcentajes ni afirmar compatibilidad real ni hacer sinastría.';
  return `${legend} ${task} Devuelve JSON con un título de hasta 80 caracteres, 2 a 4 párrafos de hasta 600 caracteres cada uno y una pregunta final de hasta 200 caracteres: {"title":"...","paragraphs":["...","..."],"reflection":"..."}. Datos: ${JSON.stringify(input)}.`;
}

export function validateOutput(kind, value) {
  const text = (v,max) => typeof v === 'string' && v.trim().length > 0 && v.trim().length <= max;
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('output');
  if (kind === 'quote') {
    if (!text(value.quote,180)) throw new Error('output');
    return {quote:value.quote.trim()};
  }
  if (kind === 'daily') {
    const keys = ['intro','love','work','wellbeing','reflection'];
    if (!keys.every(k=>text(value[k],400))) throw new Error('output');
    return Object.fromEntries(keys.map(k=>[k,value[k].trim()]));
  }
  if (!text(value.title,80) || !text(value.reflection,200) || !Array.isArray(value.paragraphs) || value.paragraphs.length < 2 || value.paragraphs.length > 4 || !value.paragraphs.every(p=>text(p,600))) throw new Error('output');
  return {title:value.title.trim(),paragraphs:value.paragraphs.map(p=>p.trim()),reflection:value.reflection.trim()};
}

export async function generateContent(input, env, fetcher=fetch) {
  const endpoint = new URL(env.AZURE_OPENAI_ENDPOINT);
  if (endpoint.protocol !== 'https:' || !/\.(?:services\.ai\.azure\.com|openai\.azure\.com)$/.test(endpoint.hostname) || endpoint.pathname !== '/openai/v1/responses' || endpoint.search || endpoint.username || endpoint.password) throw new Error('config');
  const response = await fetcher(endpoint.href, {
    method:'POST',
    headers:{'Content-Type':'application/json','api-key':env.AZURE_OPENAI_API_KEY},
    body:JSON.stringify({model:env.AZURE_OPENAI_DEPLOYMENT,instructions:SYSTEM,input:promptFor(input),store:false,max_output_tokens:1300,text:{format:{type:'json_object'}}}),
    signal:AbortSignal.timeout(25000),
  });
  if (!response.ok) throw new Error('provider');
  const data = await response.json();
  if (data.status !== 'completed') throw new Error('output');
  const text = (data.output||[]).filter(item=>item.type==='message').flatMap(item=>item.content||[]).filter(item=>item.type==='output_text').map(item=>item.text).join('');
  return validateOutput(input.kind,JSON.parse(text));
}

export async function handleAI(request, env, dependencies={}) {
  const path = new URL(request.url).pathname;
  const configured = !!(env.AZURE_OPENAI_API_KEY && env.AZURE_OPENAI_ENDPOINT && env.AZURE_OPENAI_DEPLOYMENT);
  if (path === '/api/ai/status' && request.method === 'GET') return reply({available:configured});
  if (path !== '/api/ai/generate') return reply({error:'Ruta no encontrada.'},404);
  if (request.method !== 'POST') return reply({error:'Método no permitido.'},405);
  // Sites supplies this identity after sign-in. Never trust a client-supplied ID.
  const identity = dependencies.local ? 'local-preview' : request.headers.get('oai-authenticated-user-id');
  if (!identity) return reply({error:'Inicia sesión para generar contenido.'},401);
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return reply({error:'Solicitud no permitida.'},403);
  if (!configured) return reply({error:'La inspiración con IA todavía no está disponible.'},503);
  if (!request.headers.get('content-type')?.startsWith('application/json')) return reply({error:'Formato no válido.'},415);
  let input;
  try {
    const body = await request.text();
    if (body.length > 12000) return reply({error:'Solicitud demasiado grande.'},413);
    input = normalizeInput(JSON.parse(body));
  } catch { return reply({error:'Los datos de la lectura no son válidos.'},400); }
  const cache = dependencies.cache ?? globalThis.caches?.default;
  const fingerprint = JSON.stringify({version:1,model:env.AZURE_OPENAI_DEPLOYMENT,...input});
  const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(fingerprint)))].map(n=>n.toString(16).padStart(2,'0')).join('');
  const key = new Request(`${new URL(request.url).origin}/__ai-cache/${hash}`);
  try {
    const cached = await cache?.match(key);
    if (cached) return reply(await cached.json());
  } catch { /* Cache failures must not hide the editorial fallback. */ }
  const now = Date.now();
  for (const [id,limit] of limits) if (limit.until < now) limits.delete(id);
  const limit = limits.get(identity) ?? {count:0,until:now+60000};
  if (limit.count >= 6) return reply({error:'Haz una pausa y vuelve a intentarlo en un minuto.'},429);
  limit.count++; limits.set(identity,limit);
  try {
    if (!pending.has(hash)) {
      const task = (async()=>{
        const content = await generateContent(input,env,dependencies.fetcher);
        const result = {kind:input.kind,day:input.day,source:'ai',content};
        try { await cache?.put(key,Response.json(result,{headers:{'Cache-Control':'public, max-age=86400'}})); } catch { /* Best effort cache. */ }
        return result;
      })();
      pending.set(hash,task);
      task.finally(()=>pending.delete(hash)).catch(()=>{});
    }
    return reply(await pending.get(hash));
  } catch { return reply({error:'No pudimos conectar con la inspiración de hoy. Puedes seguir con la lectura editorial.'},502); }
}
