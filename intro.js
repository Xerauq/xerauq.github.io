'use strict';
// A single elapsed-time timeline drives the intro, impact and reconstruction.
(() => {
  const root = document.documentElement;
  const overlay = document.getElementById('intro-overlay');
  const logo = document.getElementById('intro-logo');
  const target = document.querySelector('.header .brand-mark img');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if (!root.classList.contains('xr-intro-active')) return;
  let done = false, raf = 0, timer = 0, startTime, attemptedPNG = false;
  let fragments = [], burst, flash, initial, destination;
  const saved = target ? { visibility: target.style.visibility, transform: target.style.transform } : {};
  const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
  const mix = (a, b, t) => a + (b - a) * t;
  const smooth = t => { t = clamp(t); return t * t * (3 - 2 * t); };
  const out = t => 1 - (1 - clamp(t)) ** 3;
  // Hermite segments share the SAME velocity at each join. No per-keyframe easing.
  function curve(t, points) {
    if (t <= points[0][0]) return points[0][1];
    for (let i = 1; i < points.length; i++) {
      const [a, p, m] = points[i - 1], [b, q, n] = points[i];
      if (t <= b) {
        const d = b - a, u = (t - a) / d, u2 = u * u, u3 = u2 * u;
        return (2 * u3 - 3 * u2 + 1) * p + (u3 - 2 * u2 + u) * d * m + (-2 * u3 + 3 * u2) * q + (u3 - u2) * d * n;
      }
    }
    return points[points.length - 1][1];
  }
  function finish() {
    if (done) return;
    done = true; cancelAnimationFrame(raf); clearTimeout(timer);
    if (overlay) overlay.style.display = 'none';
    if (target) { target.style.visibility = saved.visibility; target.style.transform = saved.transform; }
    root.classList.remove('xr-intro-active', 'xr-intro-reveal', 'xr-intro-flight');
    window.removeEventListener('keydown', onKey, true);
    window.removeEventListener('pagehide', finish); window.removeEventListener('resize', finish);
    document.removeEventListener('visibilitychange', onVisibility);
    reduced.removeEventListener?.('change', onPreference);
    overlay?.removeEventListener('click', finish); overlay?.removeEventListener('wheel', onWheel);
    logo?.removeEventListener('load', ready); logo?.removeEventListener('error', fallback);
    target?.removeEventListener('load', ready); target?.removeEventListener('error', finish);
    overlay?.remove();
  }
  const onKey = e => { if (['Escape', 'Enter', ' ', 'Tab'].includes(e.key)) finish(); };
  const onVisibility = () => { if (document.hidden) finish(); };
  const onPreference = e => { if (e.matches) finish(); };
  const onWheel = e => e.preventDefault();
  const fallback = () => { if (done) return; if (attemptedPNG) { finish(); return; } attemptedPNG = true; logo.src = 'assets/XerauqLogo.png'; };
  function effectImage(className) {
    const image = document.createElement('img'); image.src = target.currentSrc || target.src; image.alt = ''; image.className = className; image.draggable = false;
    return image;
  }
  function place(el) {
    const { x, y, w, h } = destination;
    Object.assign(el.style, { left: `${x - w / 2}px`, top: `${y - h / 2}px`, width: `${w}px`, height: `${h}px` });
  }
  function makeEffects() {
    burst = effectImage('xr-impact-copy'); place(burst); overlay.append(burst);
    flash = document.createElement('div'); flash.className = 'xr-impact-flash'; place(flash); overlay.append(flash);
    // Uneven radial glass cells: inner triangles and split outer wedges tile the
    // full image, including its corners. Each piece uses the untouched PNG.
    const edge = [[0, 0], [.32, 0], [.68, 0], [1, 0], [1, .33], [1, .67], [1, 1], [.64, 1], [.30, 1], [0, 1], [0, .64], [0, .30]];
    const center = [.48, .51];
    const inner = edge.map(([x, y], i) => { const r = .37 + ((i * 7) % 5) * .05; return [mix(center[0], x, r), mix(center[1], y, r)]; });
    const polygons = [];
    for (let i = 0; i < edge.length; i++) {
      const j = (i + 1) % edge.length;
      polygons.push([center, inner[i], inner[j]], [inner[i], edge[i], edge[j]], [inner[i], edge[j], inner[j]]);
    }
    fragments = polygons.map((poly, i) => {
      const piece = document.createElement('div'); piece.className = 'xr-glass-piece'; place(piece);
      piece.style.clipPath = `polygon(${poly.map(([x, y]) => `${x * 100}% ${y * 100}%`).join(',')})`;
      piece.append(effectImage('xr-glass-image'));
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('viewBox', '0 0 100 100'); svg.setAttribute('preserveAspectRatio', 'none');
      const line = document.createElementNS(svg.namespaceURI, 'polygon'); line.setAttribute('points', poly.map(([x, y]) => `${x * 100},${y * 100}`).join(' ')); line.setAttribute('fill', 'none'); line.setAttribute('stroke', '#bfeeff'); line.setAttribute('stroke-opacity', '.65'); line.setAttribute('stroke-width', '1.3'); svg.append(line); piece.append(svg);
      const cx = poly.reduce((s, p) => s + p[0], 0) / poly.length, cy = poly.reduce((s, p) => s + p[1], 0) / poly.length;
      const angle = Math.atan2(cy - center[1], cx - center[0]); const travel = 48 + (i * 29 % 83);
      piece.style.transformOrigin = `${cx * 100}% ${cy * 100}%`;
      overlay.append(piece); return { piece, cx, cy, dx: Math.cos(angle) * travel, dy: Math.sin(angle) * travel, rotation: (i % 2 ? 1 : -1) * (32 + i * 17 % 135) };
    });
  }

  // Continuous entrance, one bounce, a brief pause, then impact.
  const BOUNCE_END = 300;
  const FLIGHT = 585;
  const IMPACT = 775;
  const SHATTER = 775;
  const CURTAIN = 1150;
  const END = 1580;
  let motion, impacted = false, shattered = false;

  function startMotion() {
    const { cx, cy, w, h } = initial;
    const { x: tx, y: ty, w: tw, h: th } = destination;
    const endScale = Math.min(tw / w, th / w);
    const frames = [];

    function pose(t) {
      let x = cx;
      let y = curve(t, [
        [0, cy + .22 * h, .0 * h / 500],
        [200, cy + .022 * h, .0 * h / 500],
        [200, cy + .022 * h, 0 * h / 1000],
        [BOUNCE_END, cy + .022 * h, 0]
      ]);
      let scale = curve(t, [
        [0, 4.6, -.012],
        [200, 1.08, -.07],
        [200, .90, 0],
        [BOUNCE_END, 1, 0]
      ]);

      if (t >= FLIGHT) {
        const u = clamp((t - FLIGHT) / (IMPACT - FLIGHT));
        const travel = u * u;
        x = mix(cx, tx, travel);
        y = mix(cy + .042 * h, ty, travel);
        scale = mix(1, endScale, travel);
      }

      return {
        offset: t / END,
        transform: `translate3d(${x - cx}px, ${y - cy}px, 0) scale(${scale})`,
        opacity: t >= IMPACT ? 0 : smooth(t / 900)
      };
    }

    for (let t = 0; t < IMPACT - 1; t += 5) {
      frames.push(pose(t));
    }

    frames.push(pose(IMPACT - 1), pose(IMPACT), pose(END));

    motion = logo.animate(frames, {
      duration: END,
      easing: 'linear',
      fill: 'both'
    });
  }

  function frame() {
    if (done) return;

    const t = motion.currentTime ?? 0;
    const { w: tw, h: th } = destination;

    if (t >= FLIGHT) {
      root.classList.add('xr-intro-flight');
      overlay.style.setProperty(
        '--xr-cover',
        String(1 - smooth((t - FLIGHT) / 180))
      );
    }

    if (t >= IMPACT) {
      if (!impacted) {
        impacted = true;
        logo.style.visibility = 'hidden';
        target.style.visibility = 'hidden';
      }

      if (t < SHATTER) {
        const u = clamp((t - IMPACT) / (SHATTER - IMPACT));

        burst.style.opacity = '1';
        burst.style.transform = `scale(${mix(1, 1.95, out(u))})`;
      } else {
        burst.style.opacity = '0';

        const u = clamp((t - SHATTER) / 390);
        const travel = out(u);

        for (const f of fragments) {
          const ox = (f.cx - .5) * tw * .95;
          const oy = (f.cy - .5) * th * .95;

          f.piece.style.opacity = String(1 - smooth(u));
          f.piece.style.transform = `translate3d(${ox + f.dx * travel}px, ${oy + f.dy * travel + 35 * u * u}px, 0) rotate(${f.rotation * travel}deg) scale(${1.95 * (1 - .65 * u)})`;
        }
      }

      const fl = clamp((t - IMPACT) / 280);

      flash.style.opacity = String(.82 * (1 - fl) ** 2);
      flash.style.transform = `scale(${1 + 3 * out(fl)})`;

      if (t >= CURTAIN) {
        target.style.transform = `translate3d(0, ${-100 * (1 - out((t - CURTAIN) / (END - CURTAIN)))}%, 0)`;
        target.style.visibility = 'visible';
      }
    }

    if (t >= END) {
      finish();
      return;
    }

    raf = requestAnimationFrame(frame);
  }

  function ready() {
    if (done || initial || !logo?.naturalWidth || !target?.naturalWidth || target.hidden) return;
    if (document.hidden || reduced.matches || !root.classList.contains('xr-intro-active')) { finish(); return; }
    const rect = target.getBoundingClientRect(); if (rect.width <= 0 || rect.height <= 0) { finish(); return; }
    const b = logo.getBoundingClientRect(), vp = overlay.getBoundingClientRect();
    if (b.width <= 0 || vp.width <= 0) { finish(); return; }
    initial = { cx: b.left + b.width / 2, cy: b.top + b.height / 2, w: b.width, h: vp.height };
    destination = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, w: rect.width, h: rect.height };
    makeEffects();
    logo.style.visibility = 'visible';
    startMotion();
    clearTimeout(timer);
    timer = setTimeout(finish, 2400);
    raf = requestAnimationFrame(frame);
  }
  if (!overlay || !logo || !target || reduced.matches || document.hidden) { finish(); return; }
  window.addEventListener('keydown', onKey, true); window.addEventListener('pagehide', finish); window.addEventListener('resize', finish);
  document.addEventListener('visibilitychange', onVisibility); reduced.addEventListener?.('change', onPreference);
  overlay.addEventListener('click', finish); overlay.addEventListener('wheel', onWheel, { passive: false });
  logo.addEventListener('load', ready); logo.addEventListener('error', fallback);
  target.addEventListener('load', ready); target.addEventListener('error', finish);
  timer = setTimeout(finish, 900);
  if (target.complete && !target.naturalWidth) { finish(); return; }
  if (logo.complete && !logo.naturalWidth) fallback(); else ready();
})();
