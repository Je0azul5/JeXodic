import {tarotHelp,bindTarotHelp} from './tarot-help.js';
import {tarotById,tarotSpreads,shuffleTarot,cutTarot,dealTarot} from './tarot-deck.js';
import {tarotArtwork} from './tarot-art.js';
import {requestInspiration} from './ai-client.js';
import {localDay} from './calculations.js';

const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fresh=()=>({question:'',spread:'three',deck:[],phase:'idle',chosenPile:null,draw:[],revealed:[],reading:null,busy:false,error:''});
let session=fresh(),generation=0;
export function clearTarot(){generation++;session=fresh();}
const back=()=>'<span class="tarot-back-frame"><span class="tarot-back-star">✧</span><span class="tarot-back-moon">☾</span><span class="tarot-back-brand">JEXODIC</span></span>';

const ritualBusy=()=>['shuffling','cutting','gathering','dealing'].includes(session.phase);
const ritualLabels={idle:'Empieza por barajar el mazo.',shuffling:'Barajando las 78 cartas…',shuffled:'El mazo está barajado. Ahora pártelo en tres.',cutting:'Separando el mazo en tres montones…',choose:'Elige el montón que quieres colocar arriba.',gathering:'Reuniendo los montones en el orden elegido…',ready:'El mazo está listo. Lanza tus cartas.',dealing:'Colocando tus cartas sobre la mesa…'};
const ritualDelay=ms=>new Promise(resolve=>setTimeout(resolve,document.documentElement.classList.contains('reduce-motion')||window.matchMedia('(prefers-reduced-motion: reduce)').matches?30:ms));
function ritualHTML(){
  const piles=['cutting','choose','gathering'].includes(session.phase),shuffling=session.phase==='shuffling';
  return `<div class="tarot-empty tarot-ritual phase-${session.phase}">${piles?`<div class="tarot-cut-piles" aria-label="Tres montones de 26 cartas">${[0,1,2].map(i=>`<div class="tarot-pile ${session.chosenPile===i?'is-chosen':''}" style="--pile:${i}"><button type="button" data-pile="${i}" ${session.phase!=='choose'?'disabled':''} aria-label="Elegir montón ${i+1} para colocarlo arriba">${back()}</button><span>Montón ${i+1}<small>26 cartas</small></span></div>`).join('')}</div>`:`<div class="tarot-deck ${shuffling?'tarot-shuffling':''}" aria-hidden="true">${Array.from({length:shuffling?6:3},(_,i)=>`<div style="--card:${i}">${back()}</div>`).join('')}</div>`}<h2>${session.phase==='idle'?'Una pregunta.<br><em>Otra forma de mirar.</em>':session.phase==='choose'?'Tres montones.<br><em>Elige por dónde empezar.</em>':session.phase==='ready'?'Tu mazo, a tu ritmo.<br><em>Es momento de lanzar.</em>':'Un momento para conectar.'}</h2><p role="status" aria-live="polite">${esc(session.error)||ritualLabels[session.phase]||''}</p><span class="tarot-table-note">78 CARTAS · BARAJA, CORTA Y LANZA</span></div>`;
}
function ritualControls(){
  const actions={idle:['Barajar cartas','submit',''],shuffled:['Partir el mazo en 3','button','tarot-cut'],ready:[`Lanzar ${session.spread==='one'?'1 carta':'3 cartas'}`,'submit','']};
  const action=actions[session.phase];
  return `${action?`<button class="gold-button" type="${action[1]}" ${action[2]?`id="${action[2]}"`:''}>✧ ${action[0]}</button>`:ritualBusy()?`<button type="button" disabled>${ritualLabels[session.phase]}</button>`:'<p class="fine">Elige uno de los tres montones en la mesa para continuar.</p>'}${['shuffled','ready'].includes(session.phase)?'<button type="button" class="tarot-reshuffle" id="tarot-reshuffle">↻ Volver a barajar</button>':''}`;
}

function cardsHTML(){
  if(!session.draw.length)return ritualHTML();
  return `<div class="tarot-spread ${session.spread} ${session.revealed.length===0?'tarot-dealt':''}" role="list">${session.draw.map((draw,i)=>{
    const card=tarotById.get(draw.id),revealed=session.revealed.includes(i),position=tarotSpreads[session.spread].positions[i];
    return `<div class="tarot-slot" role="listitem"><p class="tarot-position"><span>0${i+1}</span>${position}</p>${revealed?`<article class="tarot-face"><span class="tarot-numeral">${card.numeral}</span><div class="${draw.reversed?'tarot-inverted':''}">${tarotArtwork(card)}</div><h3>${card.name}</h3><span class="tarot-arcana-row"><span class="tarot-arcana">${card.arcana}</span>${tarotHelp(card.arcana==='Arcano mayor'?'major':'minor',`arcana-help-${i}`)}</span></article>`:`<button type="button" class="tarot-card-back" data-reveal="${i}" aria-label="Revelar carta ${i+1}: ${position}">${back()}<span class="tarot-reveal-hint">Toca para revelar</span></button>`}<div class="tarot-card-caption">${revealed?`<span class="tarot-orientation">${draw.reversed?'↻ Invertida':'↑ Al derecho'}</span><p>${draw.reversed?card.reversed:card.upright}</p>`:'<p>Una carta por descubrir.</p>'}</div></div>`;
  }).join('')}</div>`;
}

function readingHTML(){
  const r=session.reading;
  if(!r)return '';
  return `<section class="card tarot-reading" tabindex="-1" id="tarot-reading"><span class="eyebrow">✧ TU TIRADA, EN PALABRAS</span><h2>${esc(r.title)}</h2><p class="tarot-question-echo">“${esc(session.question)}”</p><div class="tarot-answer">${r.answer.split(/\n+/).filter(Boolean).map(p=>`<p>${esc(p)}</p>`).join('')}</div><div class="tarot-card-readings">${r.cards.map((item,i)=>`<div><span class="eyebrow">${tarotSpreads[session.spread].positions[i]}</span><h3>${tarotById.get(item.id).name}</h3><p>${esc(item.interpretation)}</p></div>`).join('')}</div><div class="reflection"><b>Una pregunta para llevar contigo</b><p>${esc(r.reflection)}</p></div><p class="fine">Interpretación generada con IA · Azure OpenAI. Las cartas ofrecen símbolos para explorar tu pregunta; no determinan hechos ni decisiones.</p></section>`;
}

export function tarotView(available){
  const started=session.phase!=='idle',drawn=session.draw.length>0,all=drawn&&session.revealed.length===session.draw.length;
  return `<div class="page-heading"><p class="eyebrow">SÍMBOLOS QUE ABREN CONVERSACIONES</p><h1>Tu pregunta, las cartas.</h1><p class="muted">Un momento para escuchar lo que una nueva perspectiva puede despertar en ti.</p></div><div class="tarot-layout"><section class="card tarot-intention"><span class="eyebrow">01 · PON UNA INTENCIÓN</span><h2>¿Qué quieres explorar?</h2><form id="tarot-form"><label for="tarot-question">Tu pregunta</label><textarea id="tarot-question" rows="4" minlength="5" maxlength="500" required placeholder="¿Qué puedo tener en cuenta para dar mi siguiente paso?" ${started?'readonly':''} aria-describedby="tarot-privacy tarot-counter">${esc(session.question)}</textarea><div class="tarot-question-meta"><span>Una pregunta abierta deja espacio a más posibilidades.</span><span id="tarot-counter">${session.question.length}/500</span></div><fieldset class="tarot-spread-picker"><legend>Elige tu tirada</legend>${Object.entries(tarotSpreads).map(([id,s])=>`<div class="tarot-choice"><label><input type="radio" name="spread" value="${id}" ${session.spread===id?'checked':''} ${started?'disabled':''}><span><b>${s.name}</b><small>${s.description}</small></span></label>${tarotHelp(id,`spread-help-${id}`)}</div>`).join('')}</fieldset>${!drawn?ritualControls():''}${started?`<button type="button" id="tarot-reset" class="tarot-new" ${session.busy||ritualBusy()?'disabled':''}>↻ Nueva tirada</button>`:''}<p class="fine" id="tarot-privacy">Al pedir la interpretación enviaremos tu pregunta y las cartas a Azure OpenAI. Evita incluir datos personales. Tu consulta no se guarda en el historial de JeXodic.</p></form><div class="tarot-note"><span>☾</span><p>Las cartas son una invitación a reflexionar. Tú eliges qué resuena contigo y qué camino tomar.</p></div></section><section class="tarot-table" aria-label="Mesa de tarot"><div class="tarot-table-heading"><span class="eyebrow">02 · DEJA QUE APAREZCAN LOS SÍMBOLOS</span><span aria-hidden="true">✦</span></div><div class="tarot-deck-guide"><span>22 arcanos mayores ${tarotHelp('major','deck-major-help')}</span><span>56 arcanos menores ${tarotHelp('minor','deck-minor-help')}</span></div>${cardsHTML()}${drawn?`<div class="tarot-table-actions">${!all?'<button type="button" id="tarot-reveal-all">Revelar todas las cartas ↗</button>':session.reading?'':`<button type="button" class="gold-button" id="tarot-interpret" ${session.busy||available!==true?'disabled':''}>${session.busy?'✧ Interpretando tu tirada…':'✧ Responder mi pregunta con IA'}</button>`}<p id="tarot-status" role="status" aria-live="polite">${esc(session.error)||(session.busy?'Estamos relacionando tu pregunta con las cartas que salieron.':!all?'Revela tus cartas antes de pedir la interpretación.':session.reading?'Puedes iniciar otra tirada cuando quieras.':available===false?'La IA no está disponible ahora. Puedes explorar los significados de tus cartas.':available===null?'Comprobando la disponibilidad de la IA…':'El modelo interpretará estas cartas en relación con tu pregunta.')}</p></div>`:''}</section></div>${readingHTML()}`;
}

export function bindTarot({refresh,available}){
  const form=document.querySelector('#tarot-form');
  if(!form)return;
  bindTarotHelp();
  const question=document.querySelector('#tarot-question');
  question.oninput=()=>{session.question=question.value;document.querySelector('#tarot-counter').textContent=`${question.value.length}/500`;question.setCustomValidity('');};
  form.querySelectorAll('[name="spread"]').forEach(input=>input.onchange=()=>{session.spread=input.value;});
  async function shuffle(){
    if(ritualBusy()||session.busy||session.draw.length)return;
    const epoch=generation;
    try{
      session.deck=shuffleTarot();session.chosenPile=null;session.phase='shuffling';session.error='';refresh();
      await ritualDelay(1600);if(epoch!==generation)return;
      session.phase='shuffled';refresh();document.querySelector('#tarot-cut')?.focus({preventScroll:true});
    }catch{session.phase='idle';session.error='No se pudo barajar. Vuelve a intentarlo.';refresh();}
  }
  form.onsubmit=async e=>{
    e.preventDefault();if(session.draw.length||session.busy||ritualBusy())return;
    if(session.phase==='idle'){
      session.question=question.value.trim();
      if(session.question.length<5){question.setCustomValidity('Escribe una pregunta de al menos cinco caracteres.');question.reportValidity();return;}
      await shuffle();
    }else if(session.phase==='ready'){
      const epoch=generation;session.phase='dealing';refresh();await ritualDelay(650);if(epoch!==generation)return;
      session.draw=dealTarot(session.deck,session.spread);session.revealed=[];session.phase='drawn';refresh();document.querySelector('[data-reveal]')?.focus({preventScroll:true});
    }
  };
  document.querySelector('#tarot-cut')?.addEventListener('click',async()=>{
    if(session.phase!=='shuffled')return;const epoch=generation;session.phase='cutting';refresh();await ritualDelay(650);if(epoch!==generation)return;
    session.phase='choose';refresh();document.querySelector('[data-pile]')?.focus({preventScroll:true});
  });
  document.querySelectorAll('[data-pile]').forEach(button=>button.onclick=async()=>{
    if(session.phase!=='choose')return;
    const epoch=generation;session.chosenPile=Number(button.dataset.pile);session.deck=cutTarot(session.deck,session.chosenPile);session.phase='gathering';refresh();await ritualDelay(750);if(epoch!==generation)return;
    session.phase='ready';refresh();document.querySelector('#tarot-form button[type="submit"]')?.focus({preventScroll:true});
  });
  document.querySelector('#tarot-reshuffle')?.addEventListener('click',shuffle);
  document.querySelector('#tarot-reset')?.addEventListener('click',()=>{if(session.busy||ritualBusy())return;clearTarot();refresh();document.querySelector('#tarot-question')?.focus();});
  document.querySelectorAll('[data-reveal]').forEach(button=>button.onclick=()=>{
    const index=Number(button.dataset.reveal);if(!session.revealed.includes(index))session.revealed.push(index);refresh();
    (document.querySelector('[data-reveal]')||document.querySelector('#tarot-interpret'))?.focus({preventScroll:true});
  });
  document.querySelector('#tarot-reveal-all')?.addEventListener('click',()=>{session.revealed=session.draw.map((_,i)=>i);refresh();document.querySelector('#tarot-interpret')?.focus({preventScroll:true});});
  document.querySelector('#tarot-interpret')?.addEventListener('click',async()=>{
    if(session.busy||available!==true||session.revealed.length!==session.draw.length)return;
    const epoch=generation,payload={kind:'tarot',day:localDay(),question:session.question,spread:session.spread,cards:session.draw};
    session.busy=true;session.error='';refresh();
    try{const content=await requestInspiration(payload);if(epoch!==generation)return;session.reading=content;}
    catch(error){if(epoch!==generation)return;session.error=error.message;}
    finally{if(epoch===generation){session.busy=false;refresh();if(session.reading)document.querySelector('#tarot-reading')?.focus({preventScroll:true});}}
  });
}
