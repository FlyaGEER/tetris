// Фигуры: число в матрице = индекс цвета в COLORS
const SHAPES = {
  I: [[1, 1, 1, 1]],
  O: [[2, 2], [2, 2]],
  T: [[0, 3, 0], [3, 3, 3]],
  S: [[0, 4, 4], [4, 4, 0]],
  Z: [[5, 5, 0], [0, 5, 5]],
  J: [[6, 0, 0], [6, 6, 6]],
  L: [[0, 0, 7], [7, 7, 7]],
};

export const rotateCW = m => m[0].map((_, c) => m.map(r => r[c]).reverse());

// «Мешок 7» — честный рандом: все 7 фигур выпадают по разу
export class Bag {
  constructor() { this.items = []; }
  next() {
    if (!this.items.length) {
      this.items = Object.keys(SHAPES).sort(() => Math.random() - 0.5);
    }
    return SHAPES[this.items.pop()].map(r => [...r]);
  }
}