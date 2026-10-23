const explanations={
  major:['Arcano mayor','Los 22 arcanos mayores representan grandes temas simbólicos: cambios, decisiones, aprendizajes y etapas personales. Invitan a mirar el contexto amplio de tu pregunta.'],
  minor:['Arcano menor','Los 56 arcanos menores exploran experiencias cotidianas. Bastos: iniciativa y creatividad; Copas: vínculos y emociones; Espadas: ideas y decisiones; Oros: recursos y hábitos.'],
  one:['Tirada de una carta','Una sola carta aporta una perspectiva enfocada sobre tu pregunta. Es útil para hacer una pausa, explorar un tema concreto o llevarte una idea para reflexionar.'],
  three:['Tirada de tres cartas','Tres cartas ponen en diálogo tu situación, lo que puedes explorar y un siguiente paso. Ofrecen más matices sobre la misma pregunta; no son tres preguntas ni una predicción del futuro.'],
};
export function tarotHelp(kind,id){
  const [title,text]=explanations[kind];
  return `<span class="tarot-help"><button type="button" class="tarot-help-trigger" aria-label="Qué significa: ${title}" aria-describedby="${id}" aria-expanded="false" popovertarget="${id}">?</button><span class="tarot-tooltip" id="${id}" role="tooltip" popover="auto"><strong>${title}</strong><span>${text}</span></span></span>`;
}

export function bindTarotHelp(){
  document.querySelectorAll('.tarot-help').forEach(container=>{
    const button=container.querySelector('button'),tip=container.querySelector('[role="tooltip"]');
    let pinned=false,closeTimer;
    const open=()=>{
      clearTimeout(closeTimer);
      if(!tip.matches(':popover-open'))tip.showPopover();
      const r=button.getBoundingClientRect(),width=tip.getBoundingClientRect().width;
      const left=Math.max(12,Math.min(r.left+r.width/2-width/2,window.innerWidth-width-12));
      const height=tip.getBoundingClientRect().height;
      tip.style.left=`${left}px`;
      tip.style.top=`${r.bottom+height+12<window.innerHeight?r.bottom+9:Math.max(12,r.top-height-9)}px`;
      button.setAttribute('aria-expanded','true');
    };
    const close=()=>{if(tip.isConnected&&tip.matches(':popover-open'))tip.hidePopover();button.setAttribute('aria-expanded','false');};
    button.onpointerenter=e=>{if(e.pointerType!=='touch')open();};
    button.onpointerleave=()=>{if(!pinned&&document.activeElement!==button)closeTimer=setTimeout(close,160);};
    button.onfocus=open;
    button.onblur=()=>{pinned=false;close();};
    button.onclick=e=>{e.preventDefault();pinned=!pinned;if(pinned)open();else close();};
    tip.onpointerenter=()=>clearTimeout(closeTimer);
    tip.onpointerleave=()=>{if(!pinned&&document.activeElement!==button)close();};
    tip.addEventListener('toggle',()=>{if(!tip.matches(':popover-open')){pinned=false;button.setAttribute('aria-expanded','false');}});
  });
}
