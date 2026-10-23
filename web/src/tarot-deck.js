// Original editorial cues and geometric artwork; no external card images.
const majors = [
  ['El Loco','0','star','Comenzar con curiosidad y apertura.','Revisar la impulsividad y dar un paso consciente.'],
  ['El Mago','I','wand','Reconocer tus recursos y convertir una idea en acción.','Ordenar tus intenciones antes de actuar.'],
  ['La Sacerdotisa','II','moon','Escuchar tu intuición y dejar espacio al silencio.','Distinguir tu voz de las expectativas ajenas.'],
  ['La Emperatriz','III','flower','Nutrir la creatividad y disfrutar lo que crece.','Reservar cuidado para ti y respetar tus límites.'],
  ['El Emperador','IV','crown','Construir una estructura que te sostenga.','Flexibilizar el control y revisar tus reglas.'],
  ['El Hierofante','V','key','Aprender de tus referentes y valores compartidos.','Preguntarte qué creencias todavía te representan.'],
  ['Los Enamorados','VI','heart','Elegir de acuerdo con tus valores y dialogar.','Observar desacuerdos y necesidades sin expresar.'],
  ['El Carro','VII','arrow','Avanzar con dirección y voluntad.','Revisar el rumbo antes de acelerar.'],
  ['La Fuerza','VIII','flower','Unir valentía, paciencia y amabilidad.','Reconocer el cansancio y pedir apoyo.'],
  ['El Ermitaño','IX','lantern','Buscar claridad en una pausa consciente.','Equilibrar la introspección y el contacto con otros.'],
  ['La Rueda de la Fortuna','X','wheel','Adaptarte a los cambios y observar los ciclos.','Reconocer qué puedes cambiar y qué necesita tiempo.'],
  ['La Justicia','XI','scales','Mirar los hechos y actuar con responsabilidad.','Revisar sesgos y buscar un trato más justo.'],
  ['El Colgado','XII','eye','Cambiar de perspectiva y permitir una pausa.','Observar dónde postergas una decisión.'],
  ['La Muerte','XIII','flower','Cerrar una etapa para dar lugar a lo nuevo; no anuncia muerte física.','Reconocer la resistencia a un cierre y acompañarla con cuidado.'],
  ['La Templanza','XIV','cup','Integrar diferencias y encontrar un ritmo sostenible.','Recuperar el equilibrio sin exigirte perfección.'],
  ['El Diablo','XV','chain','Observar apegos y hábitos que limitan tu libertad.','Reconocer opciones para aflojar una dependencia.'],
  ['La Torre','XVI','tower','Revisar estructuras y reconstruir desde lo que importa.','Atender a los cambios que vienes posponiendo.'],
  ['La Estrella','XVII','star','Cultivar esperanza y confianza de forma gradual.','Volver a pequeños gestos que renuevan tu ánimo.'],
  ['La Luna','XVIII','moon','Dar espacio a la incertidumbre sin convertirla en certeza.','Buscar información y poner palabras a una inquietud.'],
  ['El Sol','XIX','sun','Reconocer lo que aporta claridad y alegría.','Bajar la exigencia de sentirte bien todo el tiempo.'],
  ['El Juicio','XX','arrow','Escuchar un llamado al cambio y revisar aprendizajes.','Soltar la autocrítica que impide dar el siguiente paso.'],
  ['El Mundo','XXI','wheel','Reconocer un proceso que se integra o completa.','Identificar qué falta para cerrar una etapa.'],
];
const suits = [
  {id:'wands',name:'Bastos',motif:'wand',domain:'la creatividad, la iniciativa y la energía'},
  {id:'cups',name:'Copas',motif:'cup',domain:'los vínculos, el cuidado y la vida emocional'},
  {id:'swords',name:'Espadas',motif:'sword',domain:'las ideas, la comunicación y las decisiones'},
  {id:'pentacles',name:'Oros',motif:'pentacle',domain:'los recursos, los hábitos y la vida cotidiana'},
];
const ranks = [
  ['As','Una oportunidad para comenzar','Revisar qué necesita ese comienzo'],
  ['Dos','Encontrar un equilibrio o elegir entre caminos','Reconocer una decisión pendiente'],
  ['Tres','Construir con otros y dar forma a una idea','Revisar cómo colaboras y te expresas'],
  ['Cuatro','Crear estabilidad y una pausa que sostenga','Observar si la comodidad se volvió rigidez'],
  ['Cinco','Aprender de una diferencia o dificultad','Buscar una forma de reparar y pedir apoyo'],
  ['Seis','Compartir lo aprendido y reconocer el apoyo','Revisar el equilibrio entre dar y recibir'],
  ['Siete','Evaluar opciones con paciencia y criterio','Distinguir una posibilidad de una expectativa'],
  ['Ocho','Dedicar atención y práctica a un proceso','Revisar un esfuerzo que necesita otro ritmo'],
  ['Nueve','Reconocer tus recursos y cuidar tu autonomía','Dar espacio a tus necesidades y al descanso'],
  ['Diez','Observar lo que se completa y lo que cargas','Compartir responsabilidades y simplificar'],
  ['Sota','Aprender con curiosidad y probar algo pequeño','Aterrizar una idea y aceptar que estás aprendiendo'],
  ['Caballero','Avanzar con intención y movimiento','Equilibrar el impulso con la escucha'],
  ['Reina','Cultivar una relación madura y cuidadosa','Atender lo que das sin olvidarte de ti'],
  ['Rey','Actuar con criterio y responsabilidad','Revisar el control y escuchar otras perspectivas'],
];

export const tarotDeck = [
  ...majors.map(([name,numeral,motif,upright,reversed],i)=>({id:`major-${i}`,name,numeral,motif,upright,reversed,arcana:'Arcano mayor'})),
  ...suits.flatMap(suit=>ranks.map(([rank,upright,reversed],i)=>({
    id:`${suit.id}-${i+1}`,name:`${rank} de ${suit.name}`,numeral:String(i+1),motif:suit.motif,
    upright:`${upright} en ${suit.domain}.`,reversed:`${reversed} en ${suit.domain}.`,arcana:'Arcano menor',
  }))),
];
export const tarotById = new Map(tarotDeck.map(card=>[card.id,card]));
export const tarotSpreads = {
  one:{name:'Una carta',description:'Una perspectiva para tu pregunta.',positions:['Una mirada para ti']},
  three:{name:'Tres cartas',description:'Explora tu situación paso a paso.',positions:['Tu situación','Lo que puedes explorar','Un siguiente paso']},
};

// Rejection sampling avoids modulo bias. Fisher–Yates draws without replacement.
export function randomBelow(max, random=crypto.getRandomValues.bind(crypto)) {
  const limit=Math.floor(0x100000000/max)*max, value=new Uint32Array(1);
  do {random(value);} while(value[0]>=limit);
  return value[0]%max;
}
export function drawTarot(spread, random) {
  if(!Object.hasOwn(tarotSpreads,spread))throw new Error('Tirada no válida.');
  const deck=tarotDeck.map(card=>card.id),count=tarotSpreads[spread].positions.length;
  for(let i=deck.length-1;i>0;i--){const j=randomBelow(i+1,random);[deck[i],deck[j]]=[deck[j],deck[i]];}
  return deck.slice(0,count).map(id=>({id,reversed:randomBelow(2,random)===1}));
}
