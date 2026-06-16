/* =========================================
   WEBGL SHADER BACKGROUND  (ShaderBackground)
   ========================================= */
(function () {
  const canvas = document.getElementById('shader-canvas');
  if (!canvas) return;
  const gl = canvas.getContext('webgl');
  if (!gl) { canvas.style.display = 'none'; return; }

  const vsSource = `
    attribute vec4 aVertexPosition;
    void main() { gl_Position = aVertexPosition; }
  `;
  const fsSource = `
    precision highp float;
    uniform vec2 iResolution;
    uniform float iTime;
    const float overallSpeed = 0.2;
    const float gridSmoothWidth = 0.015;
    const float axisWidth = 0.05;
    const float majorLineWidth = 0.025;
    const float minorLineWidth = 0.0125;
    const float majorLineFrequency = 5.0;
    const float minorLineFrequency = 1.0;
    const float scale = 5.0;
    const vec4 lineColor = vec4(0.25, 0.1, 0.55, 1.0);
    const float minLineWidth = 0.01;
    const float maxLineWidth = 0.2;
    const float lineSpeed = 1.0 * overallSpeed;
    const float lineAmplitude = 1.0;
    const float lineFrequency = 0.2;
    const float warpSpeed = 0.2 * overallSpeed;
    const float warpFrequency = 0.5;
    const float warpAmplitude = 1.0;
    const float offsetFrequency = 0.5;
    const float offsetSpeed = 1.33 * overallSpeed;
    const float minOffsetSpread = 0.6;
    const float maxOffsetSpread = 2.0;
    const int linesPerGroup = 16;
    #define drawCircle(pos,radius,coord) smoothstep(radius+gridSmoothWidth,radius,length(coord-(pos)))
    #define drawSmoothLine(pos,halfWidth,t) smoothstep(halfWidth,0.0,abs(pos-(t)))
    #define drawCrispLine(pos,halfWidth,t) smoothstep(halfWidth+gridSmoothWidth,halfWidth,abs(pos-(t)))
    #define drawPeriodicLine(freq,width,t) drawCrispLine(freq/2.0,width,abs(mod(t,freq)-(freq)/2.0))
    float drawGridLines(float axis){
      return drawCrispLine(0.0,axisWidth,axis)
        +drawPeriodicLine(majorLineFrequency,majorLineWidth,axis)
        +drawPeriodicLine(minorLineFrequency,minorLineWidth,axis);
    }
    float random(float t){ return (cos(t)+cos(t*1.3+1.3)+cos(t*1.4+1.4))/3.0; }
    float getPlasmaY(float x,float hFade,float offset){
      return random(x*lineFrequency+iTime*lineSpeed)*hFade*lineAmplitude+offset;
    }
    void main(){
      vec2 uv = gl_FragCoord.xy/iResolution.xy;
      vec2 space=(gl_FragCoord.xy-iResolution.xy/2.0)/iResolution.x*2.0*scale;
      float hFade=1.0-(cos(uv.x*6.28)*0.5+0.5);
      float vFade=1.0-(cos(uv.y*6.28)*0.5+0.5);
      space.y+=random(space.x*warpFrequency+iTime*warpSpeed)*warpAmplitude*(0.5+hFade);
      space.x+=random(space.y*warpFrequency+iTime*warpSpeed+2.0)*warpAmplitude*hFade;
      vec4 lines=vec4(0.0);
      for(int l=0;l<linesPerGroup;l++){
        float nli=float(l)/float(linesPerGroup);
        float offP=float(l)+space.x*offsetFrequency;
        float rand=random(offP+iTime*offsetSpeed)*0.5+0.5;
        float hw=mix(minLineWidth,maxLineWidth,rand*hFade)/2.0;
        float off=random(offP+iTime*offsetSpeed*(1.0+nli))*mix(minOffsetSpread,maxOffsetSpread,hFade);
        float lp=getPlasmaY(space.x,hFade,off);
        float line=drawSmoothLine(lp,hw,space.y)/2.0+drawCrispLine(lp,hw*0.15,space.y);
        float cx=mod(float(l)+iTime*lineSpeed,25.0)-12.0;
        vec2 cp=vec2(cx,getPlasmaY(cx,hFade,off));
        line+=drawCircle(cp,0.01,space)*4.0;
        lines+=line*lineColor*rand;
      }
      vec4 bg=mix(vec4(0.01,0.01,0.04,1.0),vec4(0.03,0.005,0.06,1.0),uv.x);
      bg*=vFade; bg.a=1.0;
      gl_FragColor=bg+lines;
    }
  `;

  function mkShader(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn(gl.getShaderInfoLog(s)); gl.deleteShader(s); return null;
    }
    return s;
  }
  const prog = gl.createProgram();
  gl.attachShader(prog, mkShader(gl.VERTEX_SHADER, vsSource));
  gl.attachShader(prog, mkShader(gl.FRAGMENT_SHADER, fsSource));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);

  const posLoc = gl.getAttribLocation(prog, 'aVertexPosition');
  const resLoc = gl.getUniformLocation(prog, 'iResolution');
  const timeLoc = gl.getUniformLocation(prog, 'iTime');

  function resize() {
    canvas.width  = canvas.parentElement.offsetWidth  || window.innerWidth;
    canvas.height = canvas.parentElement.offsetHeight || window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  window.addEventListener('resize', resize);
  resize();

  const t0 = Date.now();
  (function render() {
    const t = (Date.now() - t0) / 1000;
    gl.clearColor(0,0,0,1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(prog);
    gl.uniform2f(resLoc, canvas.width, canvas.height);
    gl.uniform1f(timeLoc, t);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(posLoc);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(render);
  })();
})();

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

/* =========================================
   AC TABLE FILTER
   ========================================= */
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const f = btn.dataset.filter;

    document.querySelectorAll('.ac-item-row').forEach(row => {
      const c = row.dataset.cours === 'true';
      const e = row.dataset.entreprise === 'true';
      let show = true;
      if (f === 'cours')      show = c;
      if (f === 'entreprise') show = e;
      if (f === 'both')       show = c && e;
      row.classList.toggle('hidden', !show);
    });

    /* Hide section blocs that have no visible rows */
    document.querySelectorAll('.ac-bloc').forEach(bloc => {
      const hasVisible = [...bloc.querySelectorAll('.ac-item-row')].some(r => !r.classList.contains('hidden'));
      bloc.classList.toggle('hidden', !hasVisible);
    });
  });
});
