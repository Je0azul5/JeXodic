export const cardFormats = {
  post: { width: 1080, height: 1350, label: 'Publicación' },
  story: { width: 1080, height: 1920, label: 'Historia' },
};

// The preview and the downloaded PNG use the same canvas.
export function drawQuoteCard(canvas, quote, day, format = 'post', credit = 'FRASE ORIGINAL DE JEXODIC') {
  const { width: w, height: h } = cardFormats[format];
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo crear la imagen.');
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, '#19182d');
  bg.addColorStop(.55, '#30233e');
  bg.addColorStop(1, '#15172b');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  const glow = ctx.createRadialGradient(540, h * .44, 0, 540, h * .44, 680);
  glow.addColorStop(0, '#b5906b22');
  glow.addColorStop(1, '#b5906b00');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#d9bd8744';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(50, 60, w - 100, h - 120);
  for (let i = 0; i < 65; i++) {
    const x = 85 + ((i * 173 + 41) % 910);
    const y = 100 + ((i * 277 + 83) % (h - 200));
    ctx.fillStyle = i % 3 ? '#d9bd8744' : '#f6e5c688';
    ctx.beginPath();
    ctx.arc(x, y, i % 4 === 0 ? 2 : 1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = '#d9bd871c';
  for (const radius of [390, 416]) {
    ctx.beginPath();
    ctx.arc(540, h / 2, radius, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.textAlign = 'center';
  ctx.fillStyle = '#d9bd87';
  ctx.font = '44px Georgia, serif';
  ctx.fillText('✦ JeXodic', 540, format === 'story' ? 290 : 190);
  ctx.font = '18px Arial, sans-serif';
  ctx.fillText('U N A  P A U S A  P A R A  T I', 540, format === 'story' ? 355 : 255);
  let lines, size = 72;
  do {
    ctx.font = `${size}px Georgia, serif`;
    lines = [''];
    for (const word of quote.split(/\s+/)) {
      const last = lines.length - 1;
      const candidate = lines[last] ? `${lines[last]} ${word}` : word;
      if (ctx.measureText(candidate).width > 780 && lines[last]) lines.push(word);
      else lines[last] = candidate;
    }
    if (lines.length * size * 1.4 <= 540) break;
    size -= 2;
  } while (size > 36);
  const firstY = h / 2 - ((lines.length - 1) * size * 1.4) / 2;
  ctx.fillStyle = '#d9bd87';
  ctx.font = '130px Georgia, serif';
  ctx.fillText('“', 540, firstY - 80);
  ctx.fillStyle = '#faf0dc';
  ctx.font = `${size}px Georgia, serif`;
  lines.forEach((line, i) => ctx.fillText(line, 540, firstY + i * size * 1.4));
  const footerY = h - (format === 'story' ? 310 : 180);
  ctx.strokeStyle = '#d9bd8766';
  ctx.beginPath();
  ctx.moveTo(490, footerY - 50);
  ctx.lineTo(590, footerY - 50);
  ctx.stroke();
  ctx.fillStyle = '#d9bd87';
  ctx.font = '18px Arial, sans-serif';
  ctx.fillText(credit, 540, footerY);
  ctx.fillStyle = '#b7aabe';
  ctx.font = '20px Arial, sans-serif';
  ctx.fillText(day.split('-').reverse().join(' · '), 540, footerY + 44);
}

export function downloadQuoteCard(canvas, day, format) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (!blob) { reject(new Error('No se pudo exportar la tarjeta.')); return; }
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `jexodic-${day}-${format}.png`;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      resolve();
    }, 'image/png');
  });
}
