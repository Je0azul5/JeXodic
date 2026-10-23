import {spawnSync} from 'node:child_process';
import {rm} from 'node:fs/promises';

await rm('dist/jexodic-azure.zip',{force:true});
const result=spawnSync('zip',['-q','../jexodic-azure.zip','package.json','server.mjs'],{cwd:'dist/azure',stdio:'inherit'});
if(result.status!==0)throw Error('No se pudo generar el ZIP de Azure; comprueba que zip esté instalado.');
console.log('dist/jexodic-azure.zip');
