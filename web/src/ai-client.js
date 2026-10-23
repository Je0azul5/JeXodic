export async function aiAvailable() {
  try {
    const response=await fetch('/api/ai/status',{signal:AbortSignal.timeout(5000)});
    if (!response.ok) return false;
    return (await response.json()).available === true;
  } catch { return false; }
}

export async function requestInspiration(payload) {
  const response=await fetch('/api/ai/generate',{
    method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),
    signal:AbortSignal.timeout(30000),
  });
  const result=await response.json();
  if (!response.ok) throw new Error(result.error||'No pudimos generar la lectura. Intenta de nuevo.');
  if (result.source !== 'ai' || result.kind !== payload.kind || !result.content) throw new Error('La respuesta no está disponible. Intenta de nuevo.');
  return result.content;
}

export function chartSummary(chart) {
  return {
    unknown:!!chart.unknown,
    asc:chart.asc === null ? null : Math.floor(chart.asc/30),
    planets:chart.planets.map(p=>({id:p.id,sign:p.sign,degree:p.lon%30,house:p.house,uncertain:!!p.uncertain})),
    aspects:chart.aspects.map(a=>({first:a.a.id,second:a.b.id,name:a.name,orb:a.orb})),
  };
}
