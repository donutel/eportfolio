/* =========================================
   FLUID SPHERE — CANVAS ANIMATION
   ========================================= */
const canvas = document.getElementById('sphere-canvas');
const ctx = canvas.getContext('2d');
let t = 0;

function getSize() {
  return Math.min(window.innerWidth * 0.65, window.innerHeight * 0.72, 580);
}

function resizeCanvas() {
  const s = getSize();
  canvas.width  = s;
  canvas.height = s;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

function drawSphere() {
  const W  = canvas.width;
  const cx = W / 2;
  const cy = W / 2;
  const R  = W * 0.41;

  ctx.clearRect(0, 0, W, W);

  /* ---- clip to circle ---- */
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.clip();

  /* ---- deep black background ---- */
  ctx.fillStyle = '#030303';
  ctx.fillRect(0, 0, W, W);

  /* ---- flowing light streaks ---- */
  const N = 14;
  for (let i = 0; i < N; i++) {
    const pct   = i / N;
    const base  = pct * Math.PI * 2;
    const s1    = 0.18 + pct * 0.09;
    const s2    = 0.12 + pct * 0.06;

    const x1 = cx + Math.cos(base + t * s1)             * R * (0.55 + 0.32 * Math.sin(t * 0.28 + i));
    const y1 = cy + Math.sin(base * 1.4 + t * s1 * 0.7) * R * (0.45 + 0.30 * Math.cos(t * 0.22 + i));
    const x2 = cx + Math.cos(base + 2.2 + t * s2)       * R * (0.38 + 0.30 * Math.cos(t * 0.24 + i * 1.4));
    const y2 = cy + Math.sin(base * 0.6 + 1.6 + t * s2) * R * (0.55 + 0.22 * Math.sin(t * 0.28 + i * 1.8));

    const cp1x = cx + Math.cos(base + 0.7 + t * 0.09)  * R * 0.28;
    const cp1y = cy + Math.sin(base * 1.1 + t * 0.11)  * R * 0.28;
    const cp2x = cx + Math.cos(base + 1.5 + t * 0.07)  * R * 0.22;
    const cp2y = cy + Math.sin(base * 0.85 + t * 0.09) * R * 0.32;

    const alpha = 0.055 + 0.035 * Math.sin(t * 0.38 + i * 0.65);
    const lw    = 0.8  + 1.6   * Math.abs(Math.sin(t * 0.27 + i * 0.55));

    const g = ctx.createLinearGradient(x1, y1, x2, y2);
    g.addColorStop(0,    'rgba(255,255,255,0)');
    g.addColorStop(0.25, `rgba(210,210,210,${alpha * 0.7})`);
    g.addColorStop(0.5,  `rgba(255,255,255,${alpha * 1.9})`);
    g.addColorStop(0.75, `rgba(200,200,200,${alpha * 0.6})`);
    g.addColorStop(1,    'rgba(255,255,255,0)');

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x2, y2);
    ctx.strokeStyle = g;
    ctx.lineWidth   = lw;
    ctx.stroke();
  }

  /* ---- centre void (black hole) ---- */
  const vx = cx + Math.sin(t * 0.09) * R * 0.06;
  const vy = cy + Math.cos(t * 0.11) * R * 0.06;
  const cvGrad = ctx.createRadialGradient(vx, vy, 0, cx, cy, R * 0.52);
  cvGrad.addColorStop(0,   'rgba(0,0,0,0.97)');
  cvGrad.addColorStop(0.5, 'rgba(0,0,0,0.55)');
  cvGrad.addColorStop(1,   'rgba(0,0,0,0)');
  ctx.fillStyle = cvGrad;
  ctx.fillRect(0, 0, W, W);

  /* ---- edge vignette ---- */
  const eGrad = ctx.createRadialGradient(cx, cy, R * 0.5, cx, cy, R);
  eGrad.addColorStop(0, 'rgba(0,0,0,0)');
  eGrad.addColorStop(1, 'rgba(0,0,0,0.94)');
  ctx.fillStyle = eGrad;
  ctx.fillRect(0, 0, W, W);

  ctx.restore();

  /* ---- subtle outer ring ---- */
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(255,255,255,${0.018 + 0.008 * Math.sin(t * 0.4)})`;
  ctx.lineWidth = 0.6;
  ctx.stroke();

  t += 0.007;
  requestAnimationFrame(drawSphere);
}

drawSphere();

/* =========================================
   CUSTOM CURSOR
   ========================================= */
const cursorDot  = document.getElementById('cursor');
const cursorRing = document.getElementById('cursor-ring');
let mouseX = -100, mouseY = -100;
let ringX  = -100, ringY  = -100;

document.addEventListener('mousemove', e => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  cursorDot.style.left = mouseX + 'px';
  cursorDot.style.top  = mouseY + 'px';
});

/* Smoothly trail the ring */
(function animateRing() {
  ringX += (mouseX - ringX) * 0.14;
  ringY += (mouseY - ringY) * 0.14;
  cursorRing.style.left = ringX + 'px';
  cursorRing.style.top  = ringY + 'px';
  requestAnimationFrame(animateRing);
})();

const hoverEls = document.querySelectorAll(
  'a, button, .accordion-header, .sae-card, .comp-card, .mission-card, .btn-primary, .btn-ghost'
);
hoverEls.forEach(el => {
  el.addEventListener('mouseenter', () => {
    cursorDot.classList.add('hover');
    cursorRing.classList.add('hover');
  });
  el.addEventListener('mouseleave', () => {
    cursorDot.classList.remove('hover');
    cursorRing.classList.remove('hover');
  });
});

/* =========================================
   NAV — SCROLL STATE
   ========================================= */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

/* =========================================
   MOBILE MENU
   ========================================= */
const toggle    = document.querySelector('.nav-toggle');
const navLinks  = document.querySelector('.nav-links');

toggle.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});

document.querySelectorAll('.nav-links a').forEach(a => {
  a.addEventListener('click', () => navLinks.classList.remove('open'));
});

/* =========================================
   SCROLL REVEAL
   ========================================= */
const revealEls = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      /* stagger children if they share the same parent batch */
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.08,
  rootMargin: '0px 0px -60px 0px'
});

revealEls.forEach((el, i) => {
  el.style.transitionDelay = (i % 4) * 80 + 'ms';
  revealObserver.observe(el);
});

/* =========================================
   ACCORDION
   ========================================= */
document.querySelectorAll('.accordion-header').forEach(header => {
  header.addEventListener('click', () => {
    const acc    = header.parentElement;
    const isOpen = acc.classList.contains('open');

    /* close all */
    document.querySelectorAll('.accordion.open').forEach(a => {
      a.classList.remove('open');
    });

    /* open clicked (if it was closed) */
    if (!isOpen) acc.classList.add('open');
  });
});

/* =========================================
   ACTIVE NAV LINK ON SCROLL
   ========================================= */
const sections = document.querySelectorAll('section[id]');
const navItems = document.querySelectorAll('.nav-links a');

const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navItems.forEach(a => a.style.color = '');
      const active = document.querySelector(`.nav-links a[href="#${entry.target.id}"]`);
      if (active) active.style.color = '#fff';
    }
  });
}, { threshold: 0.4 });

sections.forEach(s => sectionObserver.observe(s));
