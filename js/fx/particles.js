export class Particles {
  constructor() { this.list = []; }

  burst(x, y, color, n = 8, power = 260) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = Math.random() * power;
      this.list.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60,
                       life: 0.5 + Math.random() * 0.6, max: 1.1, color,
                       s: 2 + Math.random() * 4 });
    }
  }

  update(dt) {
    this.list = this.list.filter(p => (p.life -= dt) > 0);
    for (const p of this.list) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 520 * dt; }
  }

  draw(ctx) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const p of this.list) {
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.s, p.s);
    }
    ctx.restore();
  }
}