import {build as viteBuild} from 'vite';
import {build as bundle} from 'esbuild';
import {readdir,readFile,mkdir,writeFile,rm} from 'node:fs/promises';

await rm('dist/azure',{recursive:true,force:true});
await viteBuild({build:{outDir:'dist/azure-client'}});
const assets={};
const types={html:'text/html; charset=utf-8',js:'text/javascript; charset=utf-8',css:'text/css; charset=utf-8',svg:'image/svg+xml',png:'image/png',ico:'image/x-icon'};
async function collect(directory,prefix=''){
  for(const entry of await readdir(directory,{withFileTypes:true})){
    const filename=`${directory}/${entry.name}`,path=`${prefix}/${entry.name}`;
    if(entry.isDirectory())await collect(filename,path);
    else assets[path]={base64:(await readFile(filename)).toString('base64'),type:types[entry.name.split('.').pop()]||'application/octet-stream'};
  }
}
await collect('dist/azure-client');
await mkdir('dist/azure',{recursive:true});
await bundle({entryPoints:['server/app-service.js'],outfile:'dist/azure/server.mjs',bundle:true,format:'esm',platform:'node',target:'node24',minify:true,plugins:[{
  name:'public-assets',setup(build){
    build.onResolve({filter:/^jexodic:assets$/},()=>({path:'assets',namespace:'embedded'}));
    build.onLoad({filter:/.*/,namespace:'embedded'},()=>({loader:'js',contents:`const assets=${JSON.stringify(assets)};for(const asset of Object.values(assets)){asset.body=Buffer.from(asset.base64,'base64');delete asset.base64}export default assets;`}));
  },
}]});
await writeFile('dist/azure/package.json',JSON.stringify({name:'jexodic',private:true,type:'module',engines:{node:'24.x'},scripts:{start:'node server.mjs'}},null,2)+'\n');
console.log('Azure package ready: dist/azure (no dependencies or secrets).');
