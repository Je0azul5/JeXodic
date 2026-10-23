import {handleAI} from './ai.js';
import assets from 'jexodic:assets';

export default {
  async fetch(request,env) {
    const path = new URL(request.url).pathname;
    if (path.startsWith('/api/')) return handleAI(request,env);
    if (!['GET','HEAD'].includes(request.method)) return new Response('Método no permitido',{status:405});
    const asset = assets[path === '/' ? '/index.html' : path];
    if (!asset) return new Response('No encontrado',{status:404});
    return new Response(request.method === 'HEAD' ? null : asset.body, {headers:{
      'Content-Type':asset.type,
      'Cache-Control':path.startsWith('/assets/')?'public, max-age=31536000, immutable':'no-cache',
      'X-Content-Type-Options':'nosniff',
      'Referrer-Policy':'strict-origin-when-cross-origin',
    }});
  },
};
