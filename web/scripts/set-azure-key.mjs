import {spawn} from 'node:child_process';

// Key is accepted on stdin and forwarded through a pipe, never CLI arguments.
const [subscription,group,app]=process.argv.slice(2);
if(!subscription||!group||!app)throw Error('Usage: node scripts/set-azure-key.mjs <subscription> <group> <app>');
if(process.stdin.isTTY)process.stdin.setRawMode(true);
process.stdin.resume();
console.log('Ready for private JSON on stdin (input is hidden).');
let input='',handled=false;
process.stdin.on('data',chunk=>{
  if(handled)return;
  input+=chunk.toString();
  if(!input.includes('\n'))return;
  handled=true;process.stdin.pause();
  if(process.stdin.isTTY)process.stdin.setRawMode(false);
  let key;
  try{key=JSON.parse(input.trim()).key;}catch{console.error('Invalid private input.');process.exit(1);}
  input='';
  if(typeof key!=='string'||!key.trim()){console.error('API key is required.');process.exit(1);}
  const child=spawn('az',['webapp','config','appsettings','set','--subscription',subscription,'--resource-group',group,'--name',app,'--settings','@/dev/stdin','--output','none'],{stdio:['pipe','ignore','pipe']});
  child.stderr.resume(); // Azure errors can contain config; never echo them here.
  child.stdin.on('error',()=>{});
  child.stdin.end(JSON.stringify({AZURE_OPENAI_API_KEY:key.trim()}));key='';
  child.on('error',()=>{console.error('Could not start Azure CLI.');process.exit(1);});
  child.on('close',code=>{console.log(code===0?'Azure OpenAI key configured in App Service.':`Azure setting update failed (exit ${code}); no secret was printed.`);process.exit(code===0?0:1);});
});
