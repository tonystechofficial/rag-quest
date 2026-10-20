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

/** Draw a shareable completion certificate; returns null where canvas is unavailable (tests, old browsers). */
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

  ctx.fillStyle = '#0a0e1a';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const glow1 = ctx.createRadialGradient(120, 0, 0, 120, 0, 700);
  glow1.addColorStop(0, 'rgba(34, 211, 238, 0.28)');
  glow1.addColorStop(1, 'rgba(34, 211, 238, 0)');
  ctx.fillStyle = glow1;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  const glow2 = ctx.createRadialGradient(WIDTH - 100, HEIGHT, 0, WIDTH - 100, HEIGHT, 700);
  glow2.addColorStop(0, 'rgba(167, 139, 250, 0.3)');
  glow2.addColorStop(1, 'rgba(167, 139, 250, 0)');
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.strokeStyle = 'rgba(232, 237, 248, 0.18)';
  ctx.lineWidth = 2;
  ctx.strokeRect(36, 36, WIDTH - 72, HEIGHT - 72);

  const gradient = ctx.createLinearGradient(0, 0, WIDTH, 0);
  gradient.addColorStop(0, '#22d3ee');
  gradient.addColorStop(1, '#a78bfa');

  ctx.textAlign = 'center';
  ctx.fillStyle = '#9aa8c7';
  ctx.font = '600 22px system-ui, Segoe UI, Roboto, sans-serif';
  ctx.fillText('RAG QUEST · THE ARCHIVE', WIDTH / 2, 110);

  ctx.fillStyle = gradient;
  ctx.font = '900 56px system-ui, Segoe UI, Roboto, sans-serif';
  ctx.fillText('Certificate of Completion', WIDTH / 2, 185);

  ctx.fillStyle = '#9aa8c7';
  ctx.font = '400 24px system-ui, Segoe UI, Roboto, sans-serif';
  ctx.fillText('This certifies that', WIDTH / 2, 250);

  ctx.fillStyle = '#e8edf8';
  ctx.font = '800 64px system-ui, Segoe UI, Roboto, sans-serif';
  ctx.fillText(data.name || 'An Apprentice Archivist', WIDTH / 2, 330);

  ctx.fillStyle = '#9aa8c7';
  ctx.font = '400 24px system-ui, Segoe UI, Roboto, sans-serif';
  ctx.fillText('restored the Archive and taught the Oracle to speak true,', WIDTH / 2, 385);
  ctx.fillText(
    'mastering data foundations, NLP basics and Retrieval-Augmented Generation.',
    WIDTH / 2,
    420,
  );

  ctx.fillStyle = '#fbbf24';
  ctx.font = '700 26px system-ui, Segoe UI, Roboto, sans-serif';
  ctx.fillText(
    `${data.quests} / ${data.totalQuests} quests · ★ ${data.stars} / ${data.totalStars} · ${data.xp} XP`,
    WIDTH / 2,
    485,
  );

  ctx.fillStyle = '#6b7a9b';
  ctx.font = '400 20px system-ui, Segoe UI, Roboto, sans-serif';
  ctx.fillText(`${data.date} · rag-quest.vercel.app`, WIDTH / 2, 560);

  return canvas;
}

export function downloadCanvas(canvas: HTMLCanvasElement, filename: string): void {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
