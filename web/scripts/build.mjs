import {build as viteBuild} from 'vite';
import {build as bundle} from 'esbuild';
import {readdir,readFile,mkdir,writeFile,rm} from 'node:fs/promises';

// Build the existing client, then embed only its public output in the Worker.
await rm('dist',{recursive:true,force:true});
await viteBuild({build:{outDir:'dist/client'}});
const assets = {};
const types = {html:'text/html; charset=utf-8',js:'text/javascript; charset=utf-8',css:'text/css; charset=utf-8',svg:'image/svg+xml',png:'image/png',ico:'image/x-icon'};
async function collect(directory, prefix='') {
  for (const entry of await readdir(directory,{withFileTypes:true})) {
    const filename = `${directory}/${entry.name}`, path = `${prefix}/${entry.name}`;
    if (entry.isDirectory()) await collect(filename,path);
    else {
      const bytes = await readFile(filename);
      assets[path] = {base64:bytes.toString('base64'),type:types[entry.name.split('.').pop()]||'application/octet-stream'};
    }
  }
}
await collect('dist/client');
await mkdir('dist/server',{recursive:true});
await bundle({entryPoints:['server/worker.js'],outfile:'dist/server/index.js',bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true,plugins:[{
  name:'public-assets',
  setup(build) {
    build.onResolve({filter:/^jexodic:assets$/},()=>({path:'assets',namespace:'embedded'}));
    build.onLoad({filter:/.*/,namespace:'embedded'},()=>({loader:'js',contents:`const assets=${JSON.stringify(assets)};for(const asset of Object.values(assets)){asset.body=Uint8Array.from(atob(asset.base64),c=>c.charCodeAt(0));delete asset.base64}export default assets;`}));
  },
}]});
await mkdir('dist/.openai',{recursive:true});
await writeFile('dist/.openai/hosting.json',await readFile('.openai/hosting.json'));
console.log('Worker y cliente preparados. Los secretos se leen solo en ejecución.');
