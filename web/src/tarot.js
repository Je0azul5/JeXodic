import {tarotById,tarotSpreads,drawTarot} from './tarot-deck.js';
import {tarotArtwork} from './tarot-art.js';
import {requestInspiration} from './ai-client.js';
import {localDay} from './calculations.js';

const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fresh=()=>({question:'',spread:'three',draw:[],revealed:[],reading:null,busy:false,error:''});
let session=fresh(),generation=0;
export function clearTarot(){generation++;session=fresh();}
const back=()=>'<span class="tarot-back-frame"><span class="tarot-back-star">✧</span><span class="tarot-back-moon">☾</span><span class="tarot-back-brand">JEXODIC</span></span>';

function cardsHTML(){
  if(!session.draw.length)return `<div class="tarot-empty"><div class="tarot-deck" aria-hidden="true">${[0,1,2].map(()=>`<div>${back()}</div>`).join('')}</div><h2>Una pregunta.<br><em>Otra forma de mirar.</em></h2><p>Haz una pausa, piensa en lo que te importa y lanza las cartas.</p><span class="tarot-table-note">78 CARTAS · UN ESPACIO PARA REFLEXIONAR</span></div>`;
  return `<div class="tarot-spread ${session.spread}" role="list">${session.draw.map((draw,i)=>{
    const card=tarotById.get(draw.id),revealed=session.revealed.includes(i),position=tarotSpreads[session.spread].positions[i];
    return `<div class="tarot-slot" role="listitem"><p class="tarot-position"><span>0${i+1}</span>${position}</p>${revealed?`<article class="tarot-face"><span class="tarot-numeral">${card.numeral}</span><div class="${draw.reversed?'tarot-inverted':''}">${tarotArtwork(card)}</div><h3>${card.name}</h3><span class="tarot-arcana">${card.arcana}</span></article>`:`<button type="button" class="tarot-card-back" data-reveal="${i}" aria-label="Revelar carta ${i+1}: ${position}">${back()}<span class="tarot-reveal-hint">Toca para revelar</span></button>`}<div class="tarot-card-caption">${revealed?`<span class="tarot-orientation">${draw.reversed?'↻ Invertida':'↑ Al derecho'}</span><p>${draw.reversed?card.reversed:card.upright}</p>`:'<p>Una carta por descubrir.</p>'}</div></div>`;
  }).join('')}</div>`;
}

function readingHTML(){
  const r=session.reading;
  if(!r)return '';
  return `<section class="card tarot-reading" tabindex="-1" id="tarot-reading"><span class="eyebrow">✧ TU TIRADA, EN PALABRAS</span><h2>${esc(r.title)}</h2><p class="tarot-question-echo">“${esc(session.question)}”</p><div class="tarot-answer">${r.answer.split(/\n+/).filter(Boolean).map(p=>`<p>${esc(p)}</p>`).join('')}</div><div class="tarot-card-readings">${r.cards.map((item,i)=>`<div><span class="eyebrow">${tarotSpreads[session.spread].positions[i]}</span><h3>${tarotById.get(item.id).name}</h3><p>${esc(item.interpretation)}</p></div>`).join('')}</div><div class="reflection"><b>Una pregunta para llevar contigo</b><p>${esc(r.reflection)}</p></div><p class="fine">Interpretación generada con IA · Azure OpenAI. Las cartas ofrecen símbolos para explorar tu pregunta; no determinan hechos ni decisiones.</p></section>`;
}

export function tarotView(available){
  const drawn=session.draw.length>0,all=drawn&&session.revealed.length===session.draw.length;
  return `<div class="page-heading"><p class="eyebrow">SÍMBOLOS QUE ABREN CONVERSACIONES</p><h1>Tu pregunta, las cartas.</h1><p class="muted">Un momento para escuchar lo que una nueva perspectiva puede despertar en ti.</p></div><div class="tarot-layout"><section class="card tarot-intention"><span class="eyebrow">01 · PON UNA INTENCIÓN</span><h2>¿Qué quieres explorar?</h2><form id="tarot-form"><label for="tarot-question">Tu pregunta</label><textarea id="tarot-question" rows="4" minlength="5" maxlength="500" required placeholder="¿Qué puedo tener en cuenta para dar mi siguiente paso?" ${drawn?'readonly':''} aria-describedby="tarot-privacy tarot-counter">${esc(session.question)}</textarea><div class="tarot-question-meta"><span>Una pregunta abierta deja espacio a más posibilidades.</span><span id="tarot-counter">${session.question.length}/500</span></div><fieldset class="tarot-spread-picker" ${drawn?'disabled':''}><legend>Elige tu tirada</legend>${Object.entries(tarotSpreads).map(([id,s])=>`<label><input type="radio" name="spread" value="${id}" ${session.spread===id?'checked':''}><span><b>${s.name}</b><small>${s.description}</small></span></label>`).join('')}</fieldset>${drawn?`<button type="button" id="tarot-reset" ${session.busy?'disabled':''}>↻ Nueva tirada</button>`:'<button class="gold-button" type="submit">✧ Barajar y lanzar cartas</button>'}<p class="fine" id="tarot-privacy">Al pedir la interpretación enviaremos tu pregunta y las cartas a Azure OpenAI. Evita incluir datos personales. Tu consulta no se guarda en el historial de JeXodic.</p></form><div class="tarot-note"><span>☾</span><p>Las cartas son una invitación a reflexionar. Tú eliges qué resuena contigo y qué camino tomar.</p></div></section><section class="tarot-table" aria-label="Mesa de tarot"><div class="tarot-table-heading"><span class="eyebrow">02 · DEJA QUE APAREZCAN LOS SÍMBOLOS</span><span aria-hidden="true">✦</span></div>${cardsHTML()}${drawn?`<div class="tarot-table-actions">${!all?'<button type="button" id="tarot-reveal-all">Revelar todas las cartas ↗</button>':session.reading?'':`<button type="button" class="gold-button" id="tarot-interpret" ${session.busy||available!==true?'disabled':''}>${session.busy?'✧ Interpretando tu tirada…':'✧ Responder mi pregunta con IA'}</button>`}<p id="tarot-status" role="status" aria-live="polite">${esc(session.error)||(session.busy?'Estamos relacionando tu pregunta con las cartas que salieron.':!all?'Revela tus cartas antes de pedir la interpretación.':session.reading?'Puedes iniciar otra tirada cuando quieras.':available===false?'La IA no está disponible ahora. Puedes explorar los significados de tus cartas.':available===null?'Comprobando la disponibilidad de la IA…':'El modelo interpretará estas cartas en relación con tu pregunta.')}</p></div>`:''}</section></div>${readingHTML()}`;
}

export function bindTarot({refresh,available}){
  const form=document.querySelector('#tarot-form');
  if(!form)return;
  const question=document.querySelector('#tarot-question');
  question.oninput=()=>{session.question=question.value;document.querySelector('#tarot-counter').textContent=`${question.value.length}/500`;question.setCustomValidity('');};
  form.querySelectorAll('[name="spread"]').forEach(input=>input.onchange=()=>{session.spread=input.value;});
  form.onsubmit=e=>{
    e.preventDefault();if(session.draw.length||session.busy)return;
    session.question=question.value.trim();
    if(session.question.length<5){question.setCustomValidity('Escribe una pregunta de al menos cinco caracteres.');question.reportValidity();return;}
    try{session.draw=drawTarot(session.spread);session.revealed=[];session.error='';refresh();}
    catch{session.error='No se pudo barajar. Vuelve a intentarlo.';question.setCustomValidity(session.error);question.reportValidity();}
  };
  document.querySelector('#tarot-reset')?.addEventListener('click',()=>{if(session.busy)return;clearTarot();refresh();document.querySelector('#tarot-question')?.focus();});
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
