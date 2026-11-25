'use strict';
// A missing optional logo does not break the layout. The real file is never altered.
for (const image of document.querySelectorAll('.brand-mark img')) {
  const show = () => { if (image.naturalWidth > 0) { image.hidden = false; image.previousElementSibling.hidden = true; } };
  image.addEventListener('load', show);
  image.addEventListener('error', () => { image.hidden = true; image.previousElementSibling.hidden = false; });
  if (image.complete) show();
}

const nav = document.querySelector('#nav');
const toggle = document.querySelector('.nav-toggle');
if (nav && toggle) {
  const setOpen = open => { nav.classList.toggle('open', open); toggle.setAttribute('aria-expanded', String(open)); toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation'); };
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', event => { if (event.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { setOpen(false); toggle.focus(); } });
  matchMedia('(min-width:721px)').addEventListener('change', () => setOpen(false));
}
const cards = [...document.querySelectorAll('#project-grid .project-card')];
if (cards.length) {
  const buttons = [...document.querySelectorAll('.filter')];
  const search = document.querySelector('#search');
  const empty = document.querySelector('#empty');
  const results = document.querySelector('#results');
  let category = 'all';
  function apply() {
    const q = search.value.trim().toLowerCase();
    let count = 0;
    for (const card of cards) {
      const show = (category === 'all' || card.dataset.category === category) && (!q || card.dataset.search.toLowerCase().includes(q));
      card.hidden = !show;
      if (show) count++;
    }
    for (const button of buttons) { const active = button.dataset.filter === category; button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active)); }
    empty.hidden = count !== 0;
    results.textContent = `${count} ${count === 1 ? 'project' : 'projects'}`;
  }
  for (const button of buttons) button.addEventListener('click', () => { category = button.dataset.filter; apply(); });
  search.addEventListener('input', apply);
  document.querySelector('#clear-filters').addEventListener('click', () => { category = 'all'; search.value = ''; apply(); buttons[0].focus(); });
  apply();
}
const loadKofi = document.querySelector('#load-kofi');
const embed = document.querySelector('#kofi-embed');
if (loadKofi && embed) {
  loadKofi.setAttribute('aria-expanded', 'false');
  loadKofi.setAttribute('aria-controls', 'kofi-embed');
  loadKofi.addEventListener('click', () => {
    if (!embed.hidden) { embed.replaceChildren(); embed.hidden = true; loadKofi.setAttribute('aria-expanded', 'false'); loadKofi.textContent = 'Open embedded tip panel'; return; }
    const frame = document.createElement('iframe');
    frame.id = 'kofiframe';
    frame.src = 'https://ko-fi.com/xerauq/?hidefeed=true&widget=true&embed=true&preview=true';
    frame.height = '712';
    frame.title = 'Support Xerauq on Ko-fi';
    embed.append(frame);
    embed.hidden = false;
    loadKofi.setAttribute('aria-expanded', 'true');
    loadKofi.textContent = 'Close embedded tip panel';
  });
}


/* ========================================
   RANDOMIZED SPACE EVENTS
   ======================================== */

(() => {
    const art = document.querySelector('.hero-art');

    if (!art || art.querySelector('.xrq-space-effects')) return;

    const layer = document.createElement('div');
    layer.className = 'xrq-space-effects';
    layer.setAttribute('aria-hidden', 'true');

    const grid = art.querySelector('.art-grid');

    if (grid) {
        grid.after(layer);
    } else {
        art.prepend(layer);
    }

    const random = (min, max) => min + Math.random() * (max - min);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');

    // Generate nine independently twinkling stars.
    for (let i = 0; i < 9; i++) {
        const star = document.createElement('span');

        star.className = 'xrq-star';
        star.style.left = `${random(6, 94)}%`;
        star.style.top = `${random(8, 92)}%`;

        star.style.setProperty('--size', `${random(1, 2)}px`);
        star.style.setProperty('--period', `${random(4, 9)}s`);
        star.style.setProperty('--delay', `${-random(0, 9)}s`);

        layer.append(star);
    }

    // Launch an individual meteor or spacecraft.
    function launch(rocket = false) {
        if (reduced.matches || document.hidden) return;

        const w = layer.clientWidth;
        const h = layer.clientHeight;

        if (!w || !h) return;

        const flight = document.createElement('span');
        flight.className = `xrq-flight ${rocket ? 'xrq-rocket' : 'xrq-meteor'}`;

        const shape = document.createElement('span');
        shape.className = 'xrq-flight-shape';

        flight.append(shape);

        // Randomized flight trajectory.
        const x = w * random(.08, .25);

        const y = h * (
            rocket ? random(.65, .85) : random(.12, .42)
        );

        const dx = w * random(.55, .78);

        const dy = h * (
            rocket ? -random(.35, .55) : random(.18, .36)
        );

        const angle = Math.atan2(dy, dx) * 180 / Math.PI;

        const duration = rocket
            ? random(4000, 5500)
            : random(650, 1100);

        flight.style.left = `${x}px`;
        flight.style.top = `${y}px`;

        shape.style.setProperty('--angle', `${angle}deg`);

        // Multi-layer illuminated spacecraft exhaust.
        if (rocket) {
            shape.innerHTML = `
                <svg viewBox="0 0 210 86" aria-hidden="true">
                    <defs>
                        <linearGradient id="xrqPlumeGlow">
                            <stop offset="0"
                                  stop-color="#6374ff"
                                  stop-opacity="0"/>
                            <stop offset=".35"
                                  stop-color="#728dff"
                                  stop-opacity=".22"/>
                            <stop offset=".75"
                                  stop-color="#72ceff"
                                  stop-opacity=".55"/>
                            <stop offset="1"
                                  stop-color="#e0f8ff"
                                  stop-opacity=".9"/>
                        </linearGradient>

                        <linearGradient id="xrqPlumeCore">
                            <stop offset="0"
                                  stop-color="#a1c8ff"
                                  stop-opacity="0"/>
                            <stop offset=".65"
                                  stop-color="#b5e5ff"
                                  stop-opacity=".45"/>
                            <stop offset="1"
                                  stop-color="#ffffff"/>
                        </linearGradient>

                        <filter id="xrqPlumeBlur"
                                x="-20%"
                                y="-30%"
                                width="140%"
                                height="160%">
                            <feGaussianBlur stdDeviation="2.5"/>
                        </filter>
                    </defs>

                    <path
                        d="M3 6
                           C75 5 150 25 205 43
                           C150 61 75 81 3 80
                           C40 60 40 26 3 6 Z"
                        fill="url(#xrqPlumeGlow)"
                        filter="url(#xrqPlumeBlur)"
                    />

                    <path
                        d="M14 20
                           C85 19 155 32 205 43
                           C155 54 85 67 14 66
                           C60 51 60 35 14 20 Z"
                        fill="url(#xrqPlumeGlow)"
                    />

                    <path
                        d="M42 35
                           Q135 35 205 43
                           Q135 51 42 51
                           Q89 43 42 35 Z"
                        fill="url(#xrqPlumeCore)"
                    />

                    <circle
                        cx="205"
                        cy="43"
                        r="2.1"
                        fill="#fff"
                    />
                </svg>`;
        }

        layer.append(flight);

        // Smooth flight with gradual appearance and fading.
        const animation = flight.animate([
            {
                transform: 'translate3d(0, 0, 0)',
                opacity: 0
            },
            {
                transform: `translate3d(${dx * .12}px, ${dy * .12}px, 0)`,
                opacity: rocket ? .65 : .9,
                offset: .12
            },
            {
                transform: `translate3d(${dx * .8}px, ${dy * .8}px, 0)`,
                opacity: rocket ? .65 : .9,
                offset: .8
            },
            {
                transform: `translate3d(${dx}px, ${dy}px, 0)`,
                opacity: 0
            }
        ], {
            duration,
            easing: 'linear',
            fill: 'both'
        });

        // Exhaust expands naturally behind the spacecraft.
        if (rocket) {
            shape.querySelector('svg').animate([
                {
                    transform: 'scale(.3, .55)'
                },
                {
                    transform: 'scale(1, 1)',
                    offset: .55
                },
                {
                    transform: 'scale(1, 1.15)'
                }
            ], {
                duration,
                easing: 'linear',
                fill: 'both'
            });
        }

        // Remove completed effects to prevent memory buildup.
        animation.finished.then(
            () => flight.remove(),
            () => flight.remove()
        );
    }

    // Random shooting stars.
    function meteors() {
        launch();

        // Occasionally produce a second shooting star.
        if (Math.random() < .35) {
            setTimeout(() => launch(), random(900, 2200));
        }

        setTimeout(meteors, random(10000, 23000));
    }

    // Occasional spacecraft flyby.
    function rockets() {
        launch(true);

        setTimeout(rockets, random(26000, 45000));
    }

    // Randomized initial events.
    setTimeout(meteors, random(5000, 10000));
    setTimeout(rockets, random(12000, 19000));
})();
