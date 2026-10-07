import assert from 'node:assert/strict';
import { signalFrame, startBrandSignal, ACTIVE_MS, REST_MS, GLYPH_MS, ALPHABET } from '../src/scripts/brand-signal.mjs';
assert.equal(ACTIVE_MS, 12000); assert.equal(REST_MS, 900); assert.equal(GLYPH_MS, 40);
for (let t = 0; t < 11950; t += 40) {
  const frame = signalFrame(t);
  assert.equal(frame.glyph, ALPHABET[Math.floor(t / 40) % ALPHABET.length]);
  assert.ok(frame.offsets.every(x => Math.abs(x) <= .052));
  assert.ok(frame.scanOpacity >= 0 && frame.scanOpacity <= .55);
}
assert.equal(signalFrame(11950).glyph, '0');
assert.equal(signalFrame(12000).active, false);
assert.equal(signalFrame(12899).active, false);
assert.equal(signalFrame(12900).glyph, '0');
// Match selected Rapid study at representative exact times.
for (const t of [0, 40, 427, 720, 2345, 11850, 11980]) {
 const f = signalFrame(t), settle = Math.min(1, (12000-t)/200);
 assert.deepEqual(f.offsets, [0,1,2].map(n=>Math.sin(t/680*12*1.7+n*2)*.052*settle));
}
class Target {
  handlers = new Map();
  addEventListener(n, f) { this.handlers.set(n, f); }
  removeEventListener(n) { this.handlers.delete(n); }
  fire(n) { this.handlers.get(n)?.(); }
}
class Element extends Target {
  dataset = {}; style = {}; children = []; hidden = true; textContent = ''; attrs = {};
  classes = new Set();
  classList = { remove: n => this.classes.delete(n), toggle: (n,v) => v ? this.classes.add(n) : this.classes.delete(n) };
  append(n) { this.children.push(n); }
  setAttribute(n,v) { this.attrs[n] = v; }
  querySelector() { return this.art; }
}
const slot = new Element(); slot.art = new Element(); const toggle = new Element(); const headerToggle = new Element();
const doc = new Target(); doc.hidden = false;
doc.querySelectorAll = q => q.includes("toggle") ? [toggle, headerToggle] : [slot]; doc.querySelector = () => toggle; doc.createElement = () => new Element();
const reduced = new Target(), forced = new Target(); reduced.matches = forced.matches = false;
const win = new Target(); let time = 0, nextId = 0; const frames = new Map(), timers = new Map();
win.performance = { now: () => time };
win.matchMedia = q => q.includes('reduced') ? reduced : forced;
win.requestAnimationFrame = f => { frames.set(++nextId, f); return nextId; };
win.cancelAnimationFrame = id => frames.delete(id);
win.setTimeout = (f,delay) => { timers.set(++nextId, {f,delay}); return nextId; };
win.clearTimeout = id => timers.delete(id);
let observer;
win.IntersectionObserver = class { constructor(cb){ this.cb=cb; observer=this; } observe(){} disconnect(){} };
const cleanup = startBrandSignal(doc, win);
assert.equal(frames.size, 0, 'No offscreen animation');
observer.cb([{target:slot,isIntersecting:true}]);
assert.equal(frames.size, 1); assert.equal(slot.art.children.length, 4);
assert.equal(toggle.hidden, false);
time = 100; doc.hidden = true; doc.fire('visibilitychange');
assert.equal(frames.size,0); assert.ok(!slot.classes.has('signal-active'));
time = 5000; doc.hidden = false; doc.fire('visibilitychange');
assert.equal(frames.size,1); assert.equal(slot.art.children[0].dataset.glyph, signalFrame(100).glyph, 'Hidden time does not advance phase');
toggle.fire('click'); assert.equal(frames.size,0); assert.equal(toggle.textContent,'Play name effect');
assert.equal(headerToggle.textContent,'Play name effect');
headerToggle.fire('click'); assert.equal(frames.size,1); assert.equal(toggle.textContent,'Pause name effect');
reduced.matches = true; reduced.fire('change'); assert.equal(frames.size,0); assert.equal(toggle.hidden,true);
reduced.matches = false; reduced.fire('change'); assert.equal(frames.size,1);
forced.matches = true; forced.fire('change'); assert.equal(frames.size,0);
forced.matches = false; forced.fire('change'); assert.equal(frames.size,1);
observer.cb([{target:slot,isIntersecting:false}]); assert.equal(frames.size,0);
observer.cb([{target:slot,isIntersecting:true}]); assert.equal(frames.size,1);
time = 16900; [...frames.values()][0](); // 12,000ms of foreground elapsed time.
assert.equal(frames.size,0); assert.equal(timers.size,1); assert.equal([...timers.values()][0].delay,900);
cleanup(); assert.equal(frames.size,0); assert.equal(timers.size,0); assert.equal(toggle.hidden,true);
console.log('PASS: exact selected timing/glyphs/slices; pause/resume, hidden tabs, offscreen slots, reduced motion, high contrast, rest scheduling and cleanup.');
