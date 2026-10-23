import assets from 'jexodic:assets';
import {createNodeServer} from './node.js';

const server=createNodeServer({assets});
server.listen(Number(process.env.PORT||8080),'0.0.0.0',()=>console.log('JeXodic HTTP server ready.'));
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>{server.close(()=>process.exit(0));setTimeout(()=>process.exit(1),10000).unref();});
