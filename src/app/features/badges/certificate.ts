export interface CertificateData {
  name: string;
  quests: number;
  totalQuests: number;
  stars: number;
  totalStars: number;
  xp: number;
  date: string;
}

const WIDTH = 1200;
const HEIGHT = 630;
const LABEL = "'Barlow Condensed', 'Arial Narrow', sans-serif";
const TYPED = "'Courier Prime', 'Courier New', monospace";
const SERIF = "'Source Serif 4', Georgia, serif";

/** Draw the completion certificate as an index card; null where canvas is unavailable (tests, old browsers). */
export function drawCertificate(data: CertificateData): HTMLCanvasElement | null {
  if (typeof document === 'undefined') {
    return null;
  }
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return null;
  }

  // desk and card
  ctx.fillStyle = '#e3d8bf';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = 'rgba(43,38,33,0.18)';
  ctx.fillRect(66, 70, WIDTH - 120, HEIGHT - 120);
  ctx.fillStyle = '#f1e4c2';
  ctx.fillRect(60, 60, WIDTH - 120, HEIGHT - 120);
  ctx.strokeStyle = '#a99a73';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(60, 60, WIDTH - 120, HEIGHT - 120);

  // ruled lines
  ctx.strokeStyle = '#9db0d6';
  ctx.lineWidth = 1;
  for (let y = 200; y < HEIGHT - 70; y += 36) {
    ctx.beginPath();
    ctx.moveTo(60, y);
    ctx.lineTo(WIDTH - 60, y);
    ctx.stroke();
  }
  ctx.strokeStyle = '#c8473c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(60, 150);
  ctx.lineTo(WIDTH - 60, 150);
  ctx.stroke();

  // tab
  ctx.fillStyle = '#f1e4c2';
  ctx.fillRect(90, 38, 330, 24);
  ctx.strokeStyle = '#a99a73';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(90, 38, 330, 24);
  ctx.fillStyle = '#2b2621';
  ctx.font = `700 15px ${LABEL}`;
  ctx.textAlign = 'left';
  ctx.fillText('RAG QUEST · CATALOGUE OF THE ARCHIVE', 102, 55);

  // title
  ctx.textAlign = 'center';
  ctx.fillStyle = '#2b2621';
  ctx.font = `700 54px ${LABEL}`;
  ctx.fillText('CERTIFICATE OF COMPLETION', WIDTH / 2, 128);

  // typed body
  ctx.font = `400 22px ${TYPED}`;
  ctx.fillStyle = '#5a4f44';
  ctx.fillText('This card certifies that', WIDTH / 2, 228);
  ctx.fillStyle = '#2b2621';
  ctx.font = `700 52px ${SERIF}`;
  ctx.fillText(data.name || 'An apprentice Archivist', WIDTH / 2, 296);
  ctx.font = `400 22px ${TYPED}`;
  ctx.fillStyle = '#5a4f44';
  ctx.fillText('restored the Archive and taught the Oracle to speak true,', WIDTH / 2, 372);
  ctx.fillText(
    'mastering data foundations, NLP basics and Retrieval-Augmented Generation.',
    WIDTH / 2,
    408,
  );
  ctx.fillStyle = '#9c7a2c';
  ctx.font = `700 24px ${TYPED}`;
  ctx.fillText(
    `${data.quests} / ${data.totalQuests} quests · ★ ${data.stars} / ${data.totalStars} · ${data.xp} XP`,
    WIDTH / 2,
    480,
  );
  ctx.fillStyle = '#8a7c6c';
  ctx.font = `400 18px ${TYPED}`;
  ctx.fillText(`${data.date} · rag-quest.vercel.app`, WIDTH / 2, 538);

  // stamp
  ctx.save();
  ctx.translate(WIDTH - 230, 470);
  ctx.rotate(-0.14);
  ctx.strokeStyle = '#c8473c';
  ctx.lineWidth = 3;
  ctx.strokeRect(-110, -34, 220, 68);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-102, -26, 204, 52);
  ctx.fillStyle = '#c8473c';
  ctx.font = `700 30px ${LABEL}`;
  ctx.fillText('R E S T O R E D', 0, 10);
  ctx.restore();

  return canvas;
}

export function downloadCanvas(canvas: HTMLCanvasElement, filename: string): void {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
