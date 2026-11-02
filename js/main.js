import { MODES, COLORS } from './config.js';
import { Board } from './core/board.js';
import { Bag, rotateCW } from './core/pieces.js';
import { Particles } from './fx/particles.js';
import { sfx } from './fx/audio.js';
import { draw, layout } from './render.js';

const ctx = document.getElementById('game').getContext('2d');
const modeKeys = Object.keys(MODES);

const G = {
  state: 'menu', sel: 1, t: 0, shake: 0, angle: 0, fx: new Particles(),
  mode: null, board: null, lay: null, bag: null, queue: [], piece: null, hold: null,
  canHold: true, score: 0, lines: 0, level: 0, count: 0, acc: 0, lockT: 0,
  riftT: 0, riftDir: 1,
};

function start(key) {
  const m = MODES[key];
  Object.assign(G, {
    mode: m, board: new Board(m.w, m.h), lay: layout(m), bag: new Bag(), hold: null,
    canHold: true, score: 0, lines: 0, level: 0, count: 0, acc: 0, lockT: 0, angle: 0,
    state: 'play',
  });
  G.queue = [G.bag.next(), G.bag.next(), G.bag.next(), G.bag.next()];
  spawn();
}

function spawn() {
  G.queue.push(G.bag.next());
  const s = G.queue.shift();
  G.piece = { s, x: Math.floor((G.board.w - s[0].length) / 2), y: 0 };
  G.canHold = true; G.lockT = 0; G.acc = 0;
  if (G.board.hit(s, G.piece.x, G.piece.y)) gameOver();
}

function gameOver() { G.state = 'over'; G.piece = null; G.shake = 20; sfx.over(); }

function tryMove(dx, dy) {
  const p = G.piece;
  if (!p || G.board.hit(p.s, p.x + dx, p.y + dy)) return false;
  p.x += dx; p.y += dy; G.lockT = 0;
  return true;
}

function tryRotate() {
  const p = G.piece, s = rotateCW(p.s);
  for (const k of [0, -1, 1, -2, 2]) {          // простые «wall kicks»
    if (!G.board.hit(s, p.x + k, p.y)) { p.s = s; p.x += k; G.lockT = 0; sfx.rot(); return; }
  }
}

function hardDrop() {
  let n = 0; while (tryMove(0, 1)) n++;
  G.score += n * 2; G.shake = 6; sfx.drop(); lockPiece();
}

function doHold() {
  if (!G.canHold) return;
  const cur = G.piece.s;
  if (G.hold) {
    const s = G.hold; G.hold = cur;
    G.piece = { s, x: Math.floor((G.board.w - s[0].length) / 2), y: 0 };
    G.canHold = false;
  } else { G.hold = cur; spawn(); G.canHold = false; }
  sfx.hold();
}

function lockPiece() {
  const p = G.piece;
  G.board.lock(p.s, p.x, p.y);
  G.piece = null; G.count++;
  const m = G.mode;
  if (m.lava && G.count % m.lava === 0) {
    if (!G.board.garbage()) return gameOver();
    G.shake = 12; sfx.drop();
  }
  if (m.rift && G.count % m.rift === 0) {
    G.state = 'rift'; G.riftT = 0; G.riftDir = Math.random() < 0.5 ? 1 : -1; sfx.rift();
  } else resolve();
}

function resolve() {
  let combo = 0;
  for (;;) {
    const rows = G.board.clear();
    if (!rows.length) break;
    combo++;
    const { cs, bx, by } = G.lay;
    rows.forEach(({ y, row }) => row.forEach((v, x) =>
      G.fx.burst(bx + x * cs + cs / 2, by + y * cs + cs / 2, COLORS[v], 6)));
    G.score += [0, 100, 300, 500, 800][Math.min(rows.length, 4)] * (G.level + 1) * combo;
    G.lines += rows.length; G.level = Math.floor(G.lines / 10);
    G.shake = 8 + rows.length * 4; sfx.clear(rows.length);
    if (G.mode.rift) G.board.settle();          // в «Разломе» после очистки блоки осыпаются
  }
  if (G.state !== 'over') { G.state = 'play'; spawn(); }
}

function finishRift() {
  G.board.rotate(G.riftDir > 0);
  G.board.settle();
  G.angle = 0; G.shake = 24;
  resolve();
}

function update(dt) {
  G.t += dt; G.shake = Math.max(0, G.shake - dt * 60); G.fx.update(dt);

  if (G.state === 'rift') {
    G.riftT += dt;
    const p = Math.min(1, G.riftT / 0.8), e = p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2;
    G.angle = G.riftDir * (Math.PI / 2) * e;
    if (p >= 1) finishRift();
    return;
  }
  if (G.state !== 'play' || !G.piece) return;

  if (G.board.hit(G.piece.s, G.piece.x, G.piece.y + 1)) {
    if ((G.lockT += dt) > 0.45) lockPiece();
  } else if ((G.acc += dt) > Math.max(0.07, 0.8 * 0.85 ** G.level)) {
    G.acc = 0; G.piece.y++;
  }
}

addEventListener('keydown', e => {
  const k = e.key;
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(k)) e.preventDefault();

  if (G.state === 'menu') {
    if (k === 'ArrowUp') G.sel = (G.sel + modeKeys.length - 1) % modeKeys.length;
    if (k === 'ArrowDown') G.sel = (G.sel + 1) % modeKeys.length;
    if (k === 'Enter') start(modeKeys[G.sel]);
    if (/^[1-9]$/.test(k) && modeKeys[k - 1]) start(modeKeys[k - 1]);
    return;
  }
  if (G.state === 'over') { if (k === 'Enter') G.state = 'menu'; return; }
  if ('pPзЗ'.includes(k)) {
    if (G.state === 'play') G.state = 'pause'; else if (G.state === 'pause') G.state = 'play';
    return;
  }
  if (G.state !== 'play' || !G.piece) return;

  if (k === 'ArrowLeft' && tryMove(-1, 0)) sfx.move();
  else if (k === 'ArrowRight' && tryMove(1, 0)) sfx.move();
  else if (k === 'ArrowDown' && tryMove(0, 1)) { G.score++; G.acc = 0; }
  else if (k === 'ArrowUp' || k === 'x' || k === 'X') tryRotate();
  else if (k === ' ') hardDrop();
  else if ('cCсС'.includes(k)) doHold();
});

let last = performance.now();
(function loop(now) {
  update(Math.min(0.05, (now - last) / 1000)); last = now;
  draw(ctx, G);
  requestAnimationFrame(loop);
})(last);