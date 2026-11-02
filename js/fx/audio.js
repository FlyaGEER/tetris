// Звуки синтезируются на лету — никаких файлов
let ac;
function tone(f, d = 0.1, type = 'square', v = 0.05, slide = 0) {
  ac ??= new AudioContext();
  const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d);
  g.gain.setValueAtTime(v, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + d);
  o.connect(g).connect(ac.destination);
  o.start(); o.stop(t + d);
}

export const sfx = {
  move: () => tone(220, 0.04),
  rot:  () => tone(330, 0.06),
  drop: () => tone(120, 0.14, 'sawtooth', 0.08, -70),
  hold: () => tone(500, 0.08, 'triangle'),
  clear: n => { for (let i = 0; i < n + 2; i++) setTimeout(() => tone(440 * 1.26 ** i, 0.15, 'triangle', 0.07), i * 70); },
  rift: () => tone(70, 0.7, 'sawtooth', 0.1, 700),
  over: () => tone(300, 0.9, 'sawtooth', 0.08, -250),
};