import {defineConfig,loadEnv} from 'vite';
import {handleAI} from './server/ai.js';

export default defineConfig(({mode})=>({
  // No envPrefix override: Azure secrets must never enter the client bundle.
  plugins:[{
    name:'local-ai-server',
    configureServer(server) {
      server.middlewares.use('/api/ai',async(req,res)=>{
        try {
          let body='';
          for await (const chunk of req) { body+=chunk; if(body.length>12000){res.writeHead(413).end();return;} }
          const request=new Request(`http://${req.headers.host}/api/ai${req.url}`,{method:req.method,headers:req.headers,...(body?{body}:{})});
          const env=loadEnv(mode,process.cwd(),'AZURE_OPENAI_');
          const response=await handleAI(request,env,{local:true});
          res.writeHead(response.status,Object.fromEntries(response.headers));
          res.end(await response.text());
        } catch {res.writeHead(500,{'Content-Type':'application/json'}).end(JSON.stringify({error:'No se pudo atender la solicitud.'}));}
      });
    },
  }],
}));
