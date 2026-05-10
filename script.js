/* ============================================================
   404 — No One Like Mom Found
   Mother's Day Cinematic Website — script.js
   ============================================================ */

/* ── 1. AUDIO SETUP (Web Audio API — no external file needed) ── */
(function initAudio() {
  let ctx, masterGain, muted = false, started = false;

  // Create soft emotional piano melody with Web Audio API
  function createTone(freq, startTime, duration, vol = 0.15) {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(masterGain);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(vol, startTime + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  }

  // A tender, repeating arpeggiated melody (Am → F → C → G)
  const melody = [
    // Am
    [220.0, 0.0,  1.0, 0.08], [261.6, 0.35, 0.8, 0.06], [329.6, 0.7, 0.8, 0.06],
    // F
    [174.6, 1.2,  1.0, 0.08], [220.0, 1.55, 0.8, 0.06], [261.6, 1.9, 0.8, 0.06],
    // C
    [130.8, 2.4,  1.0, 0.08], [164.8, 2.75, 0.8, 0.06], [220.0, 3.1, 0.8, 0.06],
    // G
    [196.0, 3.6,  1.0, 0.08], [246.9, 3.95, 0.8, 0.06], [294.0, 4.3, 0.8, 0.06],
    // Am high
    [440.0, 4.8,  1.2, 0.07], [392.0, 5.2, 1.0, 0.05], [349.2, 5.7, 1.0, 0.05],
    // F high
    [349.2, 6.4,  0.9, 0.07], [329.6, 6.8, 0.8, 0.05], [294.0, 7.2, 0.8, 0.05],
    // C high
    [261.6, 7.8,  0.9, 0.07], [246.9, 8.2, 0.8, 0.05], [220.0, 8.6, 0.8, 0.05],
    // G high
    [196.0, 9.2,  1.2, 0.07], [220.0, 9.7, 0.8, 0.05], [246.9,10.2, 1.4, 0.06],
  ];
  const LOOP_DUR = 12; // seconds

  function scheduleMelody(offset) {
    melody.forEach(([freq, t, dur, vol]) => {
      createTone(freq, ctx.currentTime + offset + t, dur, vol);
    });
  }

  function startMusic() {
    if (started) return;
    started = true;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.55, ctx.currentTime + 3.5);
    masterGain.connect(ctx.destination);
    scheduleMelody(0);
    // Loop
    setInterval(() => scheduleMelody(0), LOOP_DUR * 1000);
  }

  document.getElementById('audio-btn').addEventListener('click', () => {
    if (!started) { startMusic(); }
    muted = !muted;
    if (ctx) {
      masterGain.gain.cancelScheduledValues(ctx.currentTime);
      masterGain.gain.setTargetAtTime(muted ? 0 : 0.55, ctx.currentTime, 0.5);
    }
    document.getElementById('audio-icon').textContent = muted ? '♪̶' : '♪';
  });

  // Auto-start on first user interaction
  const autoStart = () => { startMusic(); document.removeEventListener('touchstart', autoStart); document.removeEventListener('click', autoStart); };
  document.addEventListener('click', autoStart, { once: true });
  document.addEventListener('touchstart', autoStart, { once: true });
})();


/* ── 2. CANVAS BACKGROUND (particles, stars, hearts) ── */
(function initCanvas() {
  const canvas = document.getElementById('bg-canvas');
  const ctx    = canvas.getContext('2d');
  let W, H, particles = [], stars = [], hearts = [], grid = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    buildGrid();
  }

  // Grid lines
  function buildGrid() {
    grid = [];
    const step = 80;
    for (let x = 0; x < W; x += step) grid.push({ x1: x, y1: 0, x2: x, y2: H, vert: true });
    for (let y = 0; y < H; y += step) grid.push({ x1: 0, y1: y, x2: W, y2: y, vert: false });
  }

  // Particles (glow dots)
  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x  = Math.random() * W;
      this.y  = Math.random() * H;
      this.r  = Math.random() * 1.8 + 0.3;
      this.vx = (Math.random() - 0.5) * 0.25;
      this.vy = (Math.random() - 0.5) * 0.25;
      this.alpha = Math.random() * 0.5 + 0.2;
      this.hue = Math.random() > 0.5 ? '#ff4d6d' : '#ff85a1';
    }
    update() {
      this.x += this.vx + (mouse.x - W / 2) * 0.00008;
      this.y += this.vy + (mouse.y - H / 2) * 0.00008;
      if (this.x < 0 || this.x > W || this.y < 0 || this.y > H) this.reset();
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = this.hue;
      ctx.globalAlpha = this.alpha;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  // Stars
  class Star {
    constructor() {
      this.x = Math.random() * W;
      this.y = Math.random() * H;
      this.r = Math.random() * 0.9 + 0.1;
      this.alpha = Math.random();
      this.speed = Math.random() * 0.008 + 0.002;
      this.phase = Math.random() * Math.PI * 2;
    }
    update() { this.alpha = 0.3 + 0.7 * Math.abs(Math.sin(Date.now() * this.speed + this.phase)); }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = this.alpha * 0.6;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  // Floating heart particles
  class FloatingHeart {
    constructor() { this.reset(); }
    reset() {
      this.x    = Math.random() * W;
      this.y    = H + 30;
      this.size = Math.random() * 12 + 5;
      this.speed= Math.random() * 0.5 + 0.2;
      this.alpha= Math.random() * 0.25 + 0.05;
      this.drift= (Math.random() - 0.5) * 0.5;
      this.rot  = (Math.random() - 0.5) * 0.03;
      this.angle= 0;
    }
    update() {
      this.y -= this.speed;
      this.x += this.drift;
      this.angle += this.rot;
      if (this.y < -30) this.reset();
    }
    draw() {
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      ctx.font = `${this.size}px serif`;
      ctx.fillText('❤', -this.size / 2, this.size / 2);
      ctx.restore();
    }
  }

  // Init collections
  function init() {
    particles = Array.from({ length: 80  }, () => new Particle());
    stars     = Array.from({ length: 160 }, () => new Star());
    hearts    = Array.from({ length: 16  }, () => new FloatingHeart());
  }

  // Mouse tracking
  const mouse = { x: 0, y: 0 };
  window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
  window.addEventListener('touchmove', e => {
    mouse.x = e.touches[0].clientX;
    mouse.y = e.touches[0].clientY;
  }, { passive: true });

  // Animate
  function animate() {
    ctx.clearRect(0, 0, W, H);

    // Grid overlay (very subtle)
    ctx.strokeStyle = 'rgba(255,77,109,0.03)';
    ctx.lineWidth = 1;
    grid.forEach(g => {
      ctx.beginPath();
      ctx.moveTo(g.x1, g.y1);
      ctx.lineTo(g.x2, g.y2);
      ctx.stroke();
    });

    // Stars
    stars.forEach(s => { s.update(); s.draw(); });

    // Particles
    particles.forEach(p => { p.update(); p.draw(); });

    // Hearts
    hearts.forEach(h => { h.update(); h.draw(); });

    requestAnimationFrame(animate);
  }

  window.addEventListener('resize', () => { resize(); buildGrid(); });
  resize();
  init();
  animate();
})();


/* ── 3. CURSOR GLOW ── */
(function initCursor() {
  const cursor = document.getElementById('cursor-glow');
  let cx = 0, cy = 0, tx = 0, ty = 0;

  document.addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; });

  function animateCursor() {
    cx += (tx - cx) * 0.12;
    cy += (ty - cy) * 0.12;
    cursor.style.left = cx + 'px';
    cursor.style.top  = cy + 'px';
    requestAnimationFrame(animateCursor);
  }
  animateCursor();

  // Grow on hover over interactive elements
  document.querySelectorAll('a, button, .card, #audio-btn').forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.style.width  = '50px';
      cursor.style.height = '50px';
    });
    el.addEventListener('mouseleave', () => {
      cursor.style.width  = '22px';
      cursor.style.height = '22px';
    });
  });
})();


/* ── 4. LOADING SCREEN ── */
(function initLoader() {
  const loaderText    = document.getElementById('loader-text');
  const loaderBar     = document.getElementById('loader-bar');
  const loaderPercent = document.getElementById('loader-percent');
  const loaderStatus  = document.getElementById('loader-status');
  const loadingScreen = document.getElementById('loading-screen');
  const mainSite      = document.getElementById('main-site');

  const lines = [
    { text: 'Searching for someone who loves unconditionally…', status: 'SCANNING EMOTIONAL DATABASE' },
    { text: 'Searching…',                                        status: 'PROCESSING' },
    { text: 'Searching…',                                        status: 'DEEP SCAN INITIATED' },
    { text: 'Analyzing sacrifices made…',                        status: 'QUANTIFYING LOVE' },
    { text: 'Scanning sleepless nights…',                        status: 'LOADING MEMORIES' },
    { text: 'Measuring unconditional patience…',                 status: 'ALMOST THERE' },
    { text: '404 — No one like Mom found.',                      status: 'SEARCH COMPLETE' },
  ];

  let lineIdx = 0, charIdx = 0, progress = 0;
  let typingTimer, progressTimer;

  function typeChar() {
    const line = lines[lineIdx];
    if (charIdx < line.text.length) {
      loaderText.textContent += line.text[charIdx++];
      typingTimer = setTimeout(typeChar, 38);
    } else {
      loaderStatus.textContent = line.status;
      setTimeout(nextLine, 600);
    }
  }

  function nextLine() {
    lineIdx++;
    if (lineIdx >= lines.length) return finishLoad();
    charIdx = 0;
    loaderText.textContent = '';
    typeChar();
  }

  // Animate progress bar
  const targetPercents = [12, 28, 40, 55, 72, 88, 100];
  let pIdx = 0;
  progressTimer = setInterval(() => {
    if (pIdx < targetPercents.length) {
      const target = targetPercents[pIdx++];
      animateBar(target);
    }
  }, 900);

  function animateBar(target) {
    const step = () => {
      if (progress < target) {
        progress = Math.min(progress + 1, target);
        loaderBar.style.width = progress + '%';
        loaderPercent.textContent = progress + '%';
        requestAnimationFrame(step);
      }
    };
    step();
  }

  function finishLoad() {
    clearInterval(progressTimer);
    animateBar(100);
    setTimeout(() => {
      loadingScreen.classList.add('fade-out');
      mainSite.classList.remove('hidden');
      mainSite.classList.add('visible');
      setTimeout(() => {
        loadingScreen.style.display = 'none';
        initTerminal(); // start terminal typing once visible
      }, 1000);
    }, 1200);
  }

  // Start
  typeChar();
})();


/* ── 5. SCROLL REVEAL (IntersectionObserver) ── */
(function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el    = entry.target;
        const delay = parseInt(el.dataset.delay || 0);
        setTimeout(() => el.classList.add('in-view'), delay);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.scroll-reveal, .card').forEach(el => observer.observe(el));

  // Hide scroll indicator on first scroll
  const scrollInd = document.getElementById('scroll-indicator');
  if (scrollInd) {
    window.addEventListener('scroll', () => {
      scrollInd.style.opacity = '0';
      scrollInd.style.transition = 'opacity 0.5s';
    }, { once: true });
  }
})();


/* ── 6. TERMINAL TYPING EFFECT ── */
function initTerminal() {
  const termObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        startTerminal();
        termObs.disconnect();
      }
    });
  }, { threshold: 0.3 });

  const termEl = document.querySelector('.terminal-window');
  if (termEl) termObs.observe(termEl);
}

function startTerminal() {
  const body = document.getElementById('terminal-body');
  if (!body) return;

  // Script: array of {type, text, delay_after}
  const script = [
    { cls: 't-cmd', text: '> initializing_search_protocol.exe',  pause: 600 },
    { cls: 't-out', text: '\nSYSTEM: Ready. Searching global database…\n', pause: 400 },
    { cls: 't-cmd', text: '\n> query --target "unconditional_love"', pause: 700 },
    { cls: 't-out', text: '\nScanning 8 billion humans…\nScanning 900 billion records…\n', pause: 800 },
    { cls: 't-err', text: '\nERROR: No match found in database.\n',        pause: 400 },
    { cls: 't-cmd', text: '\n> search_mother_replacement.exe',             pause: 900 },
    { cls: 't-out', text: '\nResult: ', pause: 0 },
    { cls: 't-err', text: 'No replacement found.\n',                        pause: 600 },
    { cls: 't-cmd', text: '\n> gratitude --level=infinite --target=mom',   pause: 800 },
    { cls: 't-err', text: '\nERROR: Words are insufficient.\nWords are always insufficient.\n', pause: 500 },
    { cls: 't-cmd', text: '\n> calculate_love_owed()',                      pause: 700 },
    { cls: 't-out', text: '\nCalculating…\nCalculating…\n',                pause: 400 },
    { cls: 't-err', text: 'OVERFLOW: Value exceeds maximum integer.\n',    pause: 600 },
    { cls: 't-cmd', text: '\n> final_output --format=heart',               pause: 800 },
    { cls: 't-love',text: '\n  Happy Mother\'s Day ❤️\n  You are irreplaceable.\n  404 — No one like you, ever.\n', pause: 0 },
  ];

  let i = 0, charI = 0, cursorEl = null;

  function addCursor() {
    if (cursorEl) cursorEl.remove();
    cursorEl = document.createElement('span');
    cursorEl.className = 't-cursor';
    body.appendChild(cursorEl);
    body.parentElement.scrollTop = body.parentElement.scrollHeight;
  }

  function typeSegment() {
    if (i >= script.length) { addCursor(); return; }
    const seg = script[i];

    if (charI === 0) {
      const span = document.createElement('span');
      span.className = seg.cls;
      span.id = 'current-seg';
      body.appendChild(span);
    }

    const span = document.getElementById('current-seg');
    if (charI < seg.text.length) {
      span.textContent += seg.text[charI++];
      addCursor();
      setTimeout(typeSegment, 22 + Math.random() * 18);
    } else {
      span.removeAttribute('id');
      charI = 0;
      i++;
      setTimeout(typeSegment, seg.pause);
    }
  }

  addCursor();
  typeSegment();
}


/* ── 7. PARALLAX EFFECT ── */
(function initParallax() {
  const hero = document.querySelector('.hero-inner');
  if (!hero) return;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    hero.style.transform = `translateY(${y * 0.25}px)`;
    hero.style.opacity   = Math.max(0, 1 - y / 600);
  });
})();


/* ── 8. SMOOTH SCROLL for anchors ── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(a.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  });
});
