// Exact 02 Rapid scramble motion from the selected Signal study.
export const ACTIVE_MS = 12000;
export const REST_MS = 900;
export const GLYPH_MS = 40;
export const ALPHABET = [...'07aλ3T8+2µ9×4z6÷1F5±b8?L2§c9−I4=J7:d3/5g×6λs1+u9µr2÷v0'];
export function signalFrame(elapsed) {
  const t = elapsed % (ACTIVE_MS + REST_MS);
  if (t < 0 || t >= ACTIVE_MS) return { active: false, wait: ACTIVE_MS + REST_MS - t };
  const settle = Math.min(1, (ACTIVE_MS - t) / 200);
  const scan = (t % 720) / 720;
  return {
    active: true,
    glyph: t >= ACTIVE_MS - 50 ? '0' : ALPHABET[Math.floor(t / GLYPH_MS) % ALPHABET.length],
    offsets: [0, 1, 2].map(n => Math.sin(t / 680 * 12 * 1.7 + n * 2) * .052 * settle),
    scanTop: 12 + scan * 73,
    scanOpacity: Math.sin(Math.PI * scan) * .55 * settle,
  };
}

export function startBrandSignal(doc = document, win = window) {
  const slots = [...doc.querySelectorAll('.brand-zero')];
  if (!slots.length) return () => {};
  const reduced = win.matchMedia('(prefers-reduced-motion: reduce)');
  const forced = win.matchMedia('(forced-colors: active)');
  const toggle = doc.querySelector('[data-signal-toggle]');
  const visible = new Set();
  const parts = new Map();
  for (const slot of slots) {
    const art = slot.querySelector('.zero-art');
    if (!art) continue;
    const slices = [0, 1, 2].map(() => {
      const slice = doc.createElement('span');
      slice.className = 'zero-slice';
      slice.dataset.glyph = '0';
      art.append(slice);
      return slice;
    });
    const scan = doc.createElement('span');
    scan.className = 'zero-scan';
    art.append(scan);
    parts.set(slot, { slices, scan });
  }
  let paused = false, raf = 0, timer = 0, elapsed = 0, runningAt = null;
  const blocked = () => paused || doc.hidden || reduced.matches || forced.matches || !visible.size;
  const now = () => win.performance.now();
  function cancel() {
    win.cancelAnimationFrame(raf);
    win.clearTimeout(timer);
    raf = timer = 0;
  }
  function stop() {
    cancel();
    if (runningAt !== null) elapsed += now() - runningAt;
    runningAt = null;
    slots.forEach(slot => slot.classList.remove('signal-active'));
  }
  function tick() {
    cancel();
    if (blocked()) { stop(); return; }
    if (runningAt === null) runningAt = now();
    const frame = signalFrame(elapsed + now() - runningAt);
    for (const slot of visible) {
      slot.classList.toggle('signal-active', frame.active);
      if (!frame.active) continue;
      const { slices, scan } = parts.get(slot);
      slices.forEach((slice, i) => {
        if (slice.dataset.glyph !== frame.glyph) slice.dataset.glyph = frame.glyph;
        slice.style.transform = `translateX(${frame.offsets[i]}em)`;
      });
      scan.style.top = `${frame.scanTop}%`;
      scan.style.opacity = frame.scanOpacity.toFixed(3);
    }
    if (frame.active) raf = win.requestAnimationFrame(tick);
    else timer = win.setTimeout(tick, frame.wait);
  }
  function refresh() {
    if (toggle) {
      toggle.hidden = reduced.matches || forced.matches;
      toggle.setAttribute('aria-pressed', String(paused));
      toggle.textContent = paused ? 'Play name effect' : 'Pause name effect';
    }
    if (blocked()) stop(); else tick();
  }
  const onToggle = () => { paused = !paused; refresh(); };
  toggle?.addEventListener('click', onToggle);
  reduced.addEventListener('change', refresh);
  forced.addEventListener('change', refresh);
  doc.addEventListener('visibilitychange', refresh);
  win.addEventListener('pagehide', stop);
  win.addEventListener('pageshow', refresh);
  const observer = win.IntersectionObserver ? new win.IntersectionObserver(entries => {
    for (const { target, isIntersecting } of entries) {
      if (isIntersecting) visible.add(target);
      else { visible.delete(target); target.classList.remove('signal-active'); }
    }
    refresh();
  }) : null;
  if (observer) parts.forEach((_, slot) => observer.observe(slot));
  else parts.forEach((_, slot) => visible.add(slot));
  refresh();
  return () => {
    stop(); observer?.disconnect();
    toggle?.removeEventListener('click', onToggle);
    reduced.removeEventListener('change', refresh);
    forced.removeEventListener('change', refresh);
    doc.removeEventListener('visibilitychange', refresh);
    win.removeEventListener('pagehide', stop);
    win.removeEventListener('pageshow', refresh);
    if (toggle) toggle.hidden = true;
  };
}
