export class Board {
  constructor(w, h) {
    this.w = w; this.h = h;
    this.g = Array.from({ length: h }, () => Array(w).fill(0));
  }

  hit(s, x, y) {
    return s.some((row, j) => row.some((v, i) => {
      if (!v) return false;
      const X = x + i, Y = y + j;
      return X < 0 || X >= this.w || Y >= this.h || (Y >= 0 && this.g[Y][X]);
    }));
  }

  lock(s, x, y) {
    s.forEach((row, j) => row.forEach((v, i) => {
      if (v && y + j >= 0) this.g[y + j][x + i] = v;
    }));
  }

  // Удаляет полные ряды, возвращает [{y, row}] для эффектов
  clear() {
    const out = [];
    this.g = this.g.filter((row, y) => {
      if (row.every(Boolean)) { out.push({ y, row }); return false; }
      return true;
    });
    while (this.g.length < this.h) this.g.unshift(Array(this.w).fill(0));
    return out;
  }

  // Поворот всего поля на 90° (только квадратное)
  rotate(cw) {
    const n = this.w, g = Array.from({ length: n }, () => Array(n).fill(0));
    for (let r = 0; r < n; r++)
      for (let c = 0; c < n; c++) {
        if (cw) g[c][n - 1 - r] = this.g[r][c];
        else g[n - 1 - c][r] = this.g[r][c];
      }
    this.g = g;
  }

  // Гравитация по колонкам: блоки падают в самый низ
  settle() {
    for (let x = 0; x < this.w; x++) {
      const col = this.g.map(r => r[x]).filter(Boolean);
      for (let y = this.h - 1, k = col.length - 1; y >= 0; y--, k--)
        this.g[y][x] = k >= 0 ? col[k] : 0;
    }
  }

  // Мусорный ряд снизу. false — если поле переполнено
  garbage() {
    if (this.g[0].some(Boolean)) return false;
    this.g.shift();
    const hole = Math.floor(Math.random() * this.w);
    this.g.push(Array.from({ length: this.w }, (_, i) => (i === hole ? 0 : 8)));
    return true;
  }
}