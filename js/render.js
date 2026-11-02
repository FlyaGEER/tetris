import { COLORS, CANVAS_W, CANVAS_H, MODES } from './config.js';

const FONT = '"Trebuchet MS", system-ui, sans-serif';

function cell(ctx, x, y, s, col, a = 1) {
  ctx.globalAlpha = a;
  ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = s * 0.5;
  ctx.fillRect(x + 1, y + 1, s - 2, s - 2);
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255,255,255,.28)';
  ctx.fillRect(x + 1, y + 1, s - 2, (s - 2) * 0.35);
  ctx.globalAlpha = 1;
}

function text(ctx, str, x, y, size, color = '#fff', align = 'left') {
  ctx.font = `bold ${size}px ${FONT}`;
  ctx.fillStyle = color; ctx.textAlign = align;
  ctx.fillText(str, x, y);
}

function mini(ctx, shape, x, y, s) {
  if (!shape) return;
  const ox = x - (shape[0].length * s) / 2, oy = y - (shape.length * s) / 2;
  shape.forEach((r, j) => r.forEach((v, i) => v && cell(ctx, ox + i * s, oy + j * s, s, COLORS[v])));
}

export function layout(mode) {
  const cs = Math.min(Math.floor(620 / mode.h), Math.floor(420 / mode.w));
  return { cs, bx: 30, by: 40 + (620 - cs * mode.h) / 2 };
}

export function draw(ctx, G) {
  ctx.fillStyle = '#07060d';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Звёздный фон
  ctx.fillStyle = '#ffffff18';
  for (let i = 0; i < 60; i++) {
    const x = (i * 97) % CANVAS_W, y = (i * 53 + G.t * 8 * (1 + (i % 3))) % CANVAS_H;
    ctx.fillRect(x, y, 2, 2);
  }

  ctx.save();
  if (G.shake > 0) ctx.translate((Math.random() - 0.5) * G.shake, (Math.random() - 0.5) * G.shake);

  if (G.state === 'menu') drawMenu(ctx, G);
  else drawGame(ctx, G);

  G.fx.draw(ctx);
  ctx.restore();
}

function drawMenu(ctx, G) {
  text(ctx, 'TETRIS', 380, 170, 96, '#fff', 'center');
  ctx.save();
  ctx.shadowColor = '#b44dff'; ctx.shadowBlur = 30;
  text(ctx, 'РАЗЛОМ', 380, 255, 72, '#b44dff', 'center');
  ctx.restore();
  Object.values(MODES).forEach((m, i) => {
    const y = 350 + i * 90, on = i === G.sel;
    ctx.fillStyle = on ? '#b44dff33' : '#ffffff0d';
    ctx.fillRect(160, y - 40, 440, 70);
    if (on) { ctx.strokeStyle = '#b44dff'; ctx.lineWidth = 2; ctx.strokeRect(160, y - 40, 440, 70); }
    text(ctx, `${i + 1}. ${m.name}`, 180, y - 8, 28, on ? '#fff' : '#aaa');
    text(ctx, m.desc, 180, y + 17, 14, '#8a86a8');
  });
  text(ctx, '↑↓ выбрать · Enter / 1-2-3 начать', 380, 650, 16, '#6b6b86', 'center');
}

function drawGame(ctx, G) {
  const { board: b, mode } = G, { cs, bx, by } = G.lay;
  const W = cs * b.w, H = cs * b.h, cx = bx + W / 2, cy = by + H / 2;

  ctx.save();
  if (G.angle) { ctx.translate(cx, cy); ctx.rotate(G.angle); ctx.translate(-cx, -cy); }

  ctx.fillStyle = '#100d1f'; ctx.fillRect(bx, by, W, H);
  ctx.strokeStyle = '#ffffff0a'; ctx.lineWidth = 1;
  for (let i = 1; i < b.w; i++) { ctx.beginPath(); ctx.moveTo(bx + i * cs, by); ctx.lineTo(bx + i * cs, by + H); ctx.stroke(); }
  for (let j = 1; j < b.h; j++) { ctx.beginPath(); ctx.moveTo(bx, by + j * cs); ctx.lineTo(bx + W, by + j * cs); ctx.stroke(); }

  b.g.forEach((row, y) => row.forEach((v, x) => v && cell(ctx, bx + x * cs, by + y * cs, cs, COLORS[v])));

  const p = G.piece;
  if (p) {
    let gy = p.y; while (!b.hit(p.s, p.x, gy + 1)) gy++;
    p.s.forEach((r, j) => r.forEach((v, i) => {
      if (!v) return;
      cell(ctx, bx + (p.x + i) * cs, by + (gy + j) * cs, cs, COLORS[v], 0.18);
      cell(ctx, bx + (p.x + i) * cs, by + (p.y + j) * cs, cs, COLORS[v]);
    }));
  }
  ctx.strokeStyle = mode.rift ? '#b44dff' : '#ffffff55'; ctx.lineWidth = 3;
  ctx.strokeRect(bx, by, W, H);
  ctx.restore();

  // Боковая панель
  const px = 520;
  text(ctx, 'СЧЁТ', px, 70, 16, '#8a86a8');   text(ctx, String(G.score), px, 105, 36);
  text(ctx, 'ЛИНИИ', px, 150, 16, '#8a86a8'); text(ctx, String(G.lines), px, 180, 28);
  text(ctx, 'УРОВЕНЬ', px, 220, 16, '#8a86a8'); text(ctx, String(G.level + 1), px, 250, 28);
  text(ctx, 'ДАЛЬШЕ', px, 300, 16, '#8a86a8');
  G.queue.slice(0, 3).forEach((s, i) => mini(ctx, s, px + 60, 350 + i * 70, 22));
  text(ctx, 'ХРАНИЛИЩЕ', px, 560, 16, G.canHold ? '#8a86a8' : '#444');
  mini(ctx, G.hold, px + 60, 610, 22);

  if (mode.rift) {
    const left = mode.rift - (G.count % mode.rift);
    const danger = left === 1;
    ctx.save();
    if (danger) { ctx.shadowColor = '#ff3d5a'; ctx.shadowBlur = 20; }
    text(ctx, `Разлом через ${left}`, bx + W / 2, by - 12, 20, danger ? '#ff3d5a' : '#b44dff', 'center');
    ctx.restore();
  }

  if (G.state === 'pause' || G.state === 'over') {
    ctx.fillStyle = '#000000aa'; ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    text(ctx, G.state === 'pause' ? 'ПАУЗА' : 'КОНЕЦ ИГРЫ', 380, 330, 64, '#fff', 'center');
    text(ctx, G.state === 'pause' ? 'P — продолжить' : `Счёт: ${G.score} · Enter — в меню`, 380, 380, 22, '#b44dff', 'center');
  }
}