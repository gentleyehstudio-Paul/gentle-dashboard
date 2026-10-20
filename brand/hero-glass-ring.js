/*
 * Gentleyeh Agents-page hero animation — glass ring (or ink-swarm variant)
 * with Lulu & Miles floating characters and a breathing ink-wash backdrop.
 *
 * Required markup inside the hero container (all siblings, positioned via layout()):
 *   <canvas data-glass="1"></canvas>   -- main 3D ring / ink-swarm canvas
 *   <canvas data-ink="1"></canvas>     -- soft background ink-wash rings/loops
 *   <img data-lulu>  <img data-miles> -- floating character art (absolutely positioned)
 *   <div data-tag-lulu></div> <div data-tag-miles></div> -- desktop-only name tags
 *   <div data-zone></div>             -- layout anchor: an empty flex spacer whose
 *                                          rect defines where the ring/characters center
 *
 * Usage:
 *   const cleanup = initHero(heroEl, { variant: 'ring' | 'ink', paused: false,
 *                                       ringMode: 'orbit' | 'ribbon', inkField: 'on' | 'off' });
 *   cleanup() on unmount.
 *   To pause/resume: call the returned controller's setPaused(true/false).
 */
function initHero(hero, opts = {}) {
  const self = {
    props: { ringMode: opts.ringMode, inkField: opts.inkField },
    state: { paused: !!opts.paused },
    setPaused(p) { this.state.paused = p; if (this.anim) { this.anim.paused = p; this.anim.update(); } }
  };
  const q = s => hero.querySelector(s);
  const canvas = q('[data-glass]'), ctx = canvas.getContext('2d');
  const ink = q('[data-ink]'), ictx = ink.getContext('2d');
  const perm = new Uint8Array(512), base = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [base[i], base[j]] = [base[j], base[i]]; }
  for (let i = 0; i < 512; i++) perm[i] = base[i & 255];
  const fade = t => t * t * t * (t * (t * 6 - 15) + 10), lerp = (t, a, b) => a + t * (b - a);
  const grad = (hh, x, y) => { const k = hh & 15, u = k < 8 ? x : y, v = k < 8 ? y : x; return ((k & 1) ? -u : u) + ((k & 2) ? -v : v); };
  function noise(x, y) {
    const xi = Math.floor(x) & 255, yi = Math.floor(y) & 255, xf = x - Math.floor(x), yf = y - Math.floor(y), u = fade(xf), v = fade(yf);
    const aa = perm[perm[xi] + yi], ab = perm[perm[xi] + yi + 1], ba = perm[perm[xi + 1] + yi], bb = perm[perm[xi + 1] + yi + 1];
    return lerp(v, lerp(u, grad(aa, xf, yf), grad(ba, xf - 1, yf)), lerp(u, grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1)));
  }
  const lulu = q('[data-lulu]'), miles = q('[data-miles]'), tl = q('[data-tag-lulu]'), tm = q('[data-tag-miles]'), zone = q('[data-zone]');
  [lulu, miles].forEach(img => { img.onerror = () => { img.style.visibility = 'hidden'; }; });
  const anim = self.anim = { paused: self.state.paused };
  let visible = true, w = 0, h = 0, time = 0, last = 0, raf = 0, mx = 0, my = 0, px = 0, py = 0, L = { cx: 0, cy: 0, R: 1, m: false };
  const variant = opts.variant || hero.dataset.variant || 'ring';
  const NODES = 40;
  let INK = null, PX = null, PY = null;
  const hash = x => { const s = Math.sin(x * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  function buildSwarm(n) {
    const rnd = Math.random, P = [], tiles = [];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) if (!((r + c) % 2)) tiles.push([c - 2 + (rnd() - .5) * .12, r - 1.5 + (rnd() - .5) * .12]);
    const nT = tiles.length;
    const bz = s => { const a = 1 - s, p = [[-2.7, 1.0], [-1.2, -1.7], [1.0, 1.7], [2.8, -.9]]; return [0, 1].map(k => a * a * a * p[0][k] + 3 * a * a * s * p[1][k] + 3 * a * s * s * p[2][k] + s * s * s * p[3][k]); };
    const bzN = s => { const a = bz(Math.max(0, s - .002)), b = bz(Math.min(1, s + .002)), dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [-dy / l, dx / l]; };
    for (let i = 0; i < n; i++) {
      const node = i < NODES;
      let A;
      if (node) { const tk = Math.floor(i / 4) % nT, cr = i % 4; A = [tiles[tk][0] + [-.5, .5, .5, -.5][cr] * .94, tiles[tk][1] + [-.5, -.5, .5, .5][cr] * .94, 0]; }
      else { const tk = i % nT; A = [tiles[tk][0] + (rnd() - .5) * .94, tiles[tk][1] + (Math.pow(rnd(), .75) - .5) * .94, 0]; }
      const s = node ? i / (NODES - 1) : rnd(), b = bz(s), nn = bzN(s);
      const wid = Math.sin(Math.PI * Math.pow(s, .55)) * .95 + .06, lane = Math.floor(rnd() * 11);
      let off = node ? 0 : ((lane + rnd() * .7) / 11 - .5) * wid;
      if (!node && s > .62 && lane % 3 === 0) off *= 1.6;
      const B = [b[0] + nn[0] * off, b[1] + nn[1] * off, (rnd() - .5) * .1];
      const th = (.1 + (node ? i / (NODES - 1) : rnd()) * 1.85) * Math.PI, tt = (th / Math.PI - .1) / 1.85;
      const ew = .62 * Math.pow(1 - tt, .6) + .05, rr = 2.05 + (node ? 0 : (rnd() - .5) * ew);
      const C = [Math.cos(th - 1.9) * rr, Math.sin(th - 1.9) * rr, (rnd() - .5) * .1];
      const drop = !node && rnd() < .05, spark = !node && !drop && rnd() < .018;
      if (drop) { B[0] += (rnd() - .5) * .9; B[1] += (rnd() - .5) * .9; const k = 1 + (rnd() - .3) * .2; C[0] *= k; C[1] *= k; }
      P.push({ S: [A, B, C], node, drop, spark, d: rnd() * .35, ang: rnd() * 6.283, amp: .3 + rnd() * .9, tone: Math.floor(rnd() * 3), tile: i % nT, ph: rnd() * 6.283, r: 1.4 + rnd() * 1.6 });
    }
    return P;
  }
  function drawSwarm(t) {
    if (!INK) { INK = buildSwarm(w < 760 ? 1700 : 3200); PX = new Float32Array(INK.length); PY = new Float32Array(INK.length); }
    const cell = L.m ? w * .15 : Math.min(w, h * 1.35) * .12, F = cell * 10;
    const seg = 6, hold = 3.6, cyc = t % (seg * 3), si = Math.floor(cyc / seg), lt = cyc - si * seg;
    const g = lt < hold ? 0 : (lt - hold) / (seg - hold), nx = (si + 1) % 3;
    const ease = p => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
    const TF = [1, .4, .35], tf = TF[si] + (TF[nx] - TF[si]) * ease(g);
    const rx = (.55 + Math.sin(t * .21) * .1) * tf + py * .25, ry = Math.sin(t * .15) * .4 * tf + px * .35, rz = (-.3 + Math.sin(t * .09) * .08) * tf;
    const cx = Math.cos(rx), sx = Math.sin(rx), cy = Math.cos(ry), sy = Math.sin(ry), cz = Math.cos(rz), sz = Math.sin(rz);
    for (let i = 0; i < INK.length; i++) {
      const qn = INK[i], a = qn.S[si], b = qn.S[nx];
      const p = Math.min(1, Math.max(0, (g - qn.d) / .65)), e = ease(p);
      let x = a[0] + (b[0] - a[0]) * e, y = a[1] + (b[1] - a[1]) * e, z = a[2] + (b[2] - a[2]) * e;
      const tileW = (si === 0 ? 1 - e : 0) + (nx === 0 ? e : 0);
      z += Math.sin(t * .6 + qn.tile) * .14 * tileW;
      const ds = Math.sin(p * Math.PI) * qn.amp * .7 + .025;
      const fx = x * .7 + t * .12, fy = y * .7 - t * .09;
      const an = qn.ang * .25 + noise(fx, fy) * 6.283;
      x += Math.cos(an) * ds; y += Math.sin(an) * ds * .85; z += noise(fy + 9.1, fx) * ds * 1.4;
      let x1 = x * cz - y * sz, y1 = x * sz + y * cz;
      let y2 = y1 * cx - z * sx, z2 = y1 * sx + z * cx;
      let x3 = x1 * cy + z2 * sy, z3 = -x1 * sy + z2 * cy;
      const k = F / (F - z3 * cell);
      PX[i] = L.cx + x3 * cell * k; PY[i] = L.cy + y2 * cell * k;
    }
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'multiply';
    const TONES = ['rgba(22,24,22,.14)', 'rgba(22,24,22,.28)', 'rgba(22,24,22,.5)'], SZ = [1.1, 1.4, 1.8];
    for (let tn = 0; tn < 3; tn++) {
      ctx.fillStyle = TONES[tn]; const sz0 = SZ[tn];
      for (let i = NODES; i < INK.length; i++) { const qn = INK[i]; if (qn.tone !== tn || qn.drop || qn.spark) continue; ctx.fillRect(PX[i], PY[i], sz0, sz0); }
    }
    ctx.fillStyle = 'rgba(20,22,20,.55)';
    for (let i = NODES; i < INK.length; i++) { const qn = INK[i]; if (!qn.drop) continue; ctx.beginPath(); ctx.arc(PX[i], PY[i], qn.r, 0, 6.283); ctx.fill(); }
    ctx.fillStyle = 'rgba(194,58,42,.85)';
    for (let i = NODES; i < INK.length; i++) { if (INK[i].spark) ctx.fillRect(PX[i], PY[i], 2, 2); }
    const seed = Math.floor(t * 14), lim = cell * 1.25;
    const bolt = (a, b, j) => {
      const dx = PX[b] - PX[a], dy = PY[b] - PY[a], len = Math.hypot(dx, dy);
      if (len > lim || len < 1) return;
      const hot = hash(j + seed * 3.1) > .93;
      ctx.strokeStyle = hot ? 'rgba(194,58,42,.9)' : 'rgba(25,26,24,.5)'; ctx.lineWidth = hot ? 1.1 : .7;
      ctx.beginPath(); ctx.moveTo(PX[a], PY[a]);
      for (let s = 1; s < 4; s++) { const f = s / 4, jt = (hash(j * 7.3 + seed + s) - .5) * len * .18; ctx.lineTo(PX[a] + dx * f - dy / len * jt, PY[a] + dy * f + dx / len * jt); }
      ctx.lineTo(PX[b], PY[b]); ctx.stroke();
    };
    for (let j = 0; j < NODES - 1; j++) bolt(j, j + 1, j);
    for (let j = 3; j < NODES; j += 4) bolt(j, j - 3, j + 100);
    for (let j = 0; j < NODES; j++) {
      ctx.fillStyle = 'rgba(25,26,24,.08)'; ctx.beginPath(); ctx.arc(PX[j], PY[j], 6, 0, 6.283); ctx.fill();
      ctx.fillStyle = j % 9 === 0 ? '#a63328' : '#191a18'; ctx.beginPath(); ctx.arc(PX[j], PY[j], 1.9, 0, 6.283); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  }
  function place(el, x, y, width) { el.style.position = 'absolute'; el.style.left = x + 'px'; el.style.top = y + 'px'; if (width) el.style.width = width + 'px'; }
  function layout() {
    w = hero.clientWidth; h = hero.clientHeight;
    const d = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = w * d; canvas.height = h * d; ctx.setTransform(d, 0, 0, d, 0, 0);
    const di = Math.min(d, 1.5); ink.width = w * di; ink.height = h * di; ictx.setTransform(di, 0, 0, di, 0, 0);
    const m = w < 760;
    const zr = zone.getBoundingClientRect(), hr = hero.getBoundingClientRect();
    const zt = zr.top - hr.top, zh = Math.max(zr.height, 220);
    if (m) {
      const lw = Math.min(w * .5, zh * .88), mw = Math.min(w * .44, zh * .8);
      L = { m, cx: w * .5, cy: h * .5, R: w * .39 };
      place(lulu, w * .5 - lw * .98, zt + zh * .02, lw); place(miles, w * .5 + lw * .02, zt + zh * .14, mw);
      tl.style.display = tm.style.display = 'none';
    } else {
      const s = Math.min(zh * .98, w * .2, 400);
      const ly = zt + (zh - s) / 2;
      const lx = w * .5 - s * 1.02, mx0 = w * .5 + s * .02;
      L = { m, cx: w * .5, cy: h * .5, R: Math.min(w * .25, h * .42) };
      place(lulu, lx, ly, s); place(miles, mx0, ly + s * .06, s * .92);
      tl.style.display = tm.style.display = 'block';
      place(tl, lx - 110, ly + s * .7); place(tm, mx0 + s * .95, ly + s * .74);
    }
    render(time);
  }
  function point(u, v, t, ribbon) {
    const R = L.R, r = R * .13;
    const twist = ribbon ? Math.sin(u * 2 + t * .3) * .5 : 0;
    const x = (R + r * Math.cos(v)) * Math.cos(u), y = (R + r * Math.cos(v)) * Math.sin(u), z = r * Math.sin(v) + twist * R;
    const a = .85 + Math.sin(t * .17) * .2, b = t * .18;
    const y1 = y * Math.cos(a) - z * Math.sin(a), z1 = y * Math.sin(a) + z * Math.cos(a);
    const x1 = x * Math.cos(b) + z1 * Math.sin(b), z2 = -x * Math.sin(b) + z1 * Math.cos(b);
    const p = 900 / (900 - z2);
    return { x: L.cx + x1 * p + px * 14, y: L.cy + y1 * p + py * 9, z: z2 };
  }
  function drawInk(t, dt) {
    ictx.clearRect(0, 0, w, h);
    const mode = self.props.inkField ?? 'on';
    if (mode === 'off') return;
    const T = t * 1.8, cx = L.cx + px * 22, cy = L.cy + py * 14, R = L.R;
    const mid = .3 + Math.sin(T * .015 * 30) * .2, high = .25 + Math.sin(T * .02 * 30) * .15;
    for (let l = 0; l < 12; l++) {
      const e = .3 + Math.sin(T * .6 + l * .5) * .2;
      ictx.strokeStyle = `rgba(25,26,24,${e * .4})`;
      ictx.lineWidth = .6 + e;
      ictx.beginPath(); ictx.arc(cx, cy, R * 1.9 * (l + 1) / 12 + e * 40, 0, Math.PI * 2); ictx.stroke();
    }
    const f1 = .5 + Math.sin(T * .6) * .3, f2 = .4 + Math.cos(T * .45) * .3, ls = R * .42 * (.5 + mid);
    ictx.strokeStyle = `rgba(166,51,40,${.18 + high * .3})`; ictx.lineWidth = 1.1;
    for (let qd = 0; qd < 4; qd++) {
      const flip = qd % 2 ? -1 : 1, rot = qd / 4 * Math.PI * 2;
      ictx.beginPath();
      for (let s = 0; s < Math.PI * 2; s += .05) {
        const x = cx + Math.sin(s * f1 * 3 + rot) * ls * flip, y = cy + Math.cos(s * f2 * 2 + rot) * ls;
        s ? ictx.lineTo(x, y) : ictx.moveTo(x, y);
      }
      ictx.closePath(); ictx.stroke();
    }
  }
  function render(t, dt = 0) {
    drawInk(t, dt);
    if (variant === 'ink') { drawSwarm(t); } else { drawRing(t); }
    lulu.style.transform = `translate(${px * 9}px,${Math.sin(t * .65) * 12 + py * 6}px) rotate(${Math.sin(t * .4) * 3 - 4}deg)`;
    miles.style.transform = `translate(${px * 17}px,${Math.sin(t * .65 + 2) * 17 + py * 10}px) rotate(${Math.sin(t * .4 + 1) * 4 + 5}deg)`;
  }
  function drawRing(t) {
    ctx.clearRect(0, 0, w, h);
    const ribbon = (self.props.ringMode ?? 'orbit') === 'ribbon';
    const faces = [], U = L.m ? 72 : 100, V = 12, du = 2 * Math.PI / U, dv = 2 * Math.PI / V;
    for (let i = 0; i < U; i++) for (let j = 0; j < V; j++) {
      const u = i * du, v = j * dv;
      const p = [point(u, v, t, ribbon), point(u + du, v, t, ribbon), point(u + du, v + dv, t, ribbon), point(u, v + dv, t, ribbon)];
      faces.push({ p, z: (p[0].z + p[1].z + p[2].z + p[3].z) / 4, i, j });
    }
    faces.sort((a, b) => a.z - b.z);
    for (const f of faces) {
      const light = Math.pow(Math.max(0, Math.cos(f.j / V * Math.PI * 2 + f.i / U * 3 + t * .18)), 12);
      ctx.beginPath(); f.p.forEach((p, k) => k ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath();
      ctx.fillStyle = `rgba(${Math.round(150 + light * 105)},${Math.round(163 + light * 92)},${Math.round(160 + light * 95)},${.10 + light * .66})`;
      ctx.fill();
      if (light > .62) { ctx.strokeStyle = `rgba(255,255,250,${light * .6})`; ctx.lineWidth = .6; ctx.stroke(); }
    }
  }
  function tick(now) {
    raf = 0;
    if (anim.paused || !visible || document.hidden) { last = 0; return; }
    const dt = last ? Math.min((now - last) / 1000, .05) : 0; last = now; time += dt;
    px += (mx - px) * .05; py += (my - py) * .05;
    render(time, dt); raf = requestAnimationFrame(tick);
  }
  function start() { if (!raf && !anim.paused && visible && !document.hidden) raf = requestAnimationFrame(tick); }
  anim.update = () => { if (anim.paused) { cancelAnimationFrame(raf); raf = 0; last = 0; } else start(); };
  const onMove = e => { if (e.pointerType === 'touch' || anim.paused) return; const b = hero.getBoundingClientRect(); mx = (e.clientX - b.left) / w - .5; my = (e.clientY - b.top) / h - .5; };
  const onLeave = () => { mx = my = 0; };
  const onVis = () => start();
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const onReduced = e => self.setPaused(e.matches);
  hero.addEventListener('pointermove', onMove); hero.addEventListener('pointerleave', onLeave);
  document.addEventListener('visibilitychange', onVis);
  reduced.addEventListener('change', onReduced);
  const ro = new ResizeObserver(layout); ro.observe(hero);
  const io = new IntersectionObserver(e => { visible = e[0].isIntersecting; start(); }); io.observe(hero);
  layout(); start();
  return () => {
    cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
    hero.removeEventListener('pointermove', onMove); hero.removeEventListener('pointerleave', onLeave);
    document.removeEventListener('visibilitychange', onVis); reduced.removeEventListener('change', onReduced);
    if (self.anim === anim) self.anim = null;
  };
}
