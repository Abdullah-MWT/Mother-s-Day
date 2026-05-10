/* ============================================================
   404 — No One Like Mom Found
   Mother's Day Cinematic Website — script.js
   ============================================================ */

const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

const APP = {
  lang: 'ur',
  reducedMotion: reducedMotionQuery.matches,
  liteMode: false,
};

const PERF = {
  isLowEndDevice: (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4)
    || (navigator.deviceMemory && navigator.deviceMemory <= 4),
};
const CANVAS_MOUSE_INFLUENCE = 0.00006;

function vibrate(ms = 18) {
  if (navigator.vibrate) navigator.vibrate(ms);
}

function setLanguage(lang) {
  APP.lang = lang;
  document.body.classList.toggle('lang-en', lang === 'en');
  document.body.classList.toggle('lang-ur', lang === 'ur');
  document.querySelectorAll('[data-en][data-ur]').forEach(el => {
    el.textContent = lang === 'ur' ? el.dataset.ur : el.dataset.en;
  });
  document.querySelectorAll('#mood-select option[data-en][data-ur]').forEach(opt => {
    opt.textContent = lang === 'ur' ? opt.dataset.ur : opt.dataset.en;
  });
  const btn = document.getElementById('lang-toggle');
  if (btn) btn.textContent = lang === 'ur' ? 'EN' : 'اردو';

  const terminalBody = document.getElementById('terminal-body');
  if (terminalBody?.dataset.started === 'true') {
    terminalBody.innerHTML = '';
    terminalBody.dataset.started = 'false';
    startTerminal();
  }
}

(function initLanguageToggle() {
  const btn = document.getElementById('lang-toggle');
  if (!btn) return;
  btn.addEventListener('click', () => {
    setLanguage(APP.lang === 'ur' ? 'en' : 'ur');
    vibrate(24);
  });
  setLanguage('ur');
})();

/* ── 1. PLAYLIST AUDIO (Urdu/Hindi mood-based) ── */
(function initAudioPlayer() {
  if (typeof Audio === 'undefined') return;
  const tracksByMood = {
    dua: [
      { title: 'Maa (Taare Zameen Par)', artist: 'Shankar Mahadevan', src: 'audio/maa-taare-zameen-par.mp3', fallbackSrc: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
      { title: 'Luka Chuppi (Rang De Basanti)', artist: 'Lata Mangeshkar & A.R. Rahman', src: 'audio/luka-chuppi.mp3', fallbackSrc: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
      { title: 'Tu Kitni Achhi Hai', artist: 'Lata Mangeshkar', src: 'audio/tu-kitni-achhi-hai.mp3', fallbackSrc: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
    ],
    nostalgia: [
      { title: 'Meri Duniya Tu Hi Re Maa', artist: 'Hindi/Urdu Tribute', src: 'audio/meri-duniya-tu-hi-re-maa.mp3', fallbackSrc: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
      { title: 'Aye Maa (Coke Studio style)', artist: 'Urdu Tribute', src: 'audio/aye-maa-tribute.mp3', fallbackSrc: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
      { title: 'Maa Da Ladla (Soft Reprise)', artist: 'Tribute Mix', src: 'audio/maa-da-ladla-reprise.mp3', fallbackSrc: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3' },
    ],
    celebration: [
      { title: 'Maa Meri Jaan', artist: 'Celebration Mix', src: 'audio/maa-meri-jaan.mp3', fallbackSrc: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3' },
      { title: 'Ammi Jan Ke Naam', artist: 'Urdu Pop Tribute', src: 'audio/ammi-jan-ke-naam.mp3', fallbackSrc: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3' },
      { title: 'Shukriya Ammi', artist: 'Hindi-Urdu Acoustic', src: 'audio/shukriya-ammi.mp3', fallbackSrc: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3' },
    ],
  };

  const audio = new Audio();
  audio.preload = 'metadata';

  let mood = 'dua';
  let index = 0;
  let playing = false;
  let activeTrack = null;
  let sourceIndex = 0;

  const els = {
    quickBtn: document.getElementById('audio-btn'),
    quickIcon: document.getElementById('audio-icon'),
    playBtn: document.getElementById('play-btn'),
    prevBtn: document.getElementById('prev-btn'),
    nextBtn: document.getElementById('next-btn'),
    moodSelect: document.getElementById('mood-select'),
    title: document.getElementById('track-title'),
    artist: document.getElementById('track-artist'),
    status: document.getElementById('audio-status'),
    progress: document.getElementById('track-progress'),
  };

  function playlist() {
    return tracksByMood[mood] || [];
  }

  function setStatus(ur, en) {
    if (!els.status) return;
    els.status.dataset.ur = ur;
    els.status.dataset.en = en;
    els.status.textContent = APP.lang === 'ur' ? ur : en;
  }

  function trackSources() {
    if (!activeTrack) return [];
    return [activeTrack.src, activeTrack.fallbackSrc].filter(Boolean);
  }

  function syncPlayUi(isPlaying) {
    if (els.quickIcon) els.quickIcon.textContent = isPlaying ? '⏸' : '▶';
    if (els.playBtn) els.playBtn.textContent = isPlaying ? '⏸' : '▶';
  }

  function loadTrack(newIndex = 0, autoPlay = false) {
    const list = playlist();
    if (!list.length) return;
    const safeIndex = Number.isFinite(newIndex) ? newIndex : 0;
    index = (safeIndex + list.length) % list.length;
    const t = list[index];

    if (els.title) els.title.textContent = t.title;
    if (els.artist) els.artist.textContent = t.artist;

    activeTrack = t;
    sourceIndex = 0;
    audio.src = trackSources()[sourceIndex] || '';
    audio.load();
    setStatus('منتخب گانا تیار ہے', 'Selected track is ready');

    if (autoPlay) playTrack();
  }

  async function playTrack() {
    try {
      await audio.play();
      playing = true;
      syncPlayUi(true);
      setStatus('چل رہا ہے — امی کے نام 💖', 'Playing for Mom 💖');
    } catch (err) {
      playing = false;
      syncPlayUi(false);
      if (err && err.name === 'NotAllowedError') {
        setStatus('پلے کے لیے دوبارہ بٹن دبائیں', 'Tap play again to allow audio');
      } else {
        setStatus('یہ ٹریک لوڈ نہیں ہو سکا', 'Unable to load this track');
      }
    }
  }

  function pauseTrack() {
    audio.pause();
    playing = false;
    syncPlayUi(false);
    setStatus('روک دیا گیا', 'Paused');
  }

  function togglePlay() {
    vibrate(20);
    if (playing) pauseTrack();
    else playTrack();
  }

  function nextTrack() {
    loadTrack(index + 1, true);
    vibrate(20);
  }

  function prevTrack() {
    loadTrack(index - 1, true);
    vibrate(20);
  }

  audio.addEventListener('ended', () => nextTrack());
  audio.addEventListener('error', () => {
    const sources = trackSources();
    if (!sources.length) {
      playing = false;
      syncPlayUi(false);
      setStatus('یہ گانا دستیاب نہیں', 'This track is unavailable');
      return;
    }
    const shouldResume = playing || !audio.paused;
    playing = false;
    if (sourceIndex + 1 < sources.length) {
      sourceIndex += 1;
      audio.src = sources[sourceIndex];
      audio.load();
      setStatus('بیک اَپ سورس سے چلایا جا رہا ہے', 'Playing from backup source');
      if (shouldResume) playTrack();
      return;
    }
    syncPlayUi(false);
    setStatus('یہ گانا دستیاب نہیں', 'This track is unavailable');
  });
  audio.addEventListener('timeupdate', () => {
    if (!els.progress || !audio.duration) return;
    els.progress.value = (audio.currentTime / audio.duration) * 100;
  });

  if (els.progress) {
    els.progress.addEventListener('input', () => {
      if (!audio.duration) return;
      audio.currentTime = (+els.progress.value / 100) * audio.duration;
    });
  }

  if (els.moodSelect) {
    els.moodSelect.addEventListener('change', () => {
      mood = els.moodSelect.value;
      index = 0;
      loadTrack(0, playing);
      setStatus('موڈ تبدیل ہوگیا', 'Mood changed');
    });
  }

  els.playBtn?.addEventListener('click', togglePlay);
  els.quickBtn?.addEventListener('click', togglePlay);
  els.nextBtn?.addEventListener('click', nextTrack);
  els.prevBtn?.addEventListener('click', prevTrack);

  const autoStart = () => {
    if (!playing) playTrack();
    document.removeEventListener('touchstart', autoStart);
    document.removeEventListener('click', autoStart);
  };
  document.addEventListener('click', autoStart, { once: true });
  document.addEventListener('touchstart', autoStart, { once: true });

  loadTrack(0, false);
})();

/* ── 2. CANVAS BACKGROUND ── */
(function initCanvas() {
  if (APP.reducedMotion) return;

  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas.getContext('2d');
  let W, H, particles = [], stars = [], hearts = [], grid = [];

  const particleCount = PERF.isLowEndDevice || APP.liteMode ? 35 : 80;
  const starCount = PERF.isLowEndDevice || APP.liteMode ? 80 : 160;
  const heartCount = PERF.isLowEndDevice || APP.liteMode ? 8 : 16;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    buildGrid();
  }

  function buildGrid() {
    grid = [];
    const step = PERF.isLowEndDevice || APP.liteMode ? 120 : 80;
    for (let x = 0; x < W; x += step) grid.push({ x1: x, y1: 0, x2: x, y2: H });
    for (let y = 0; y < H; y += step) grid.push({ x1: 0, y1: y, x2: W, y2: y });
  }

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * W;
      this.y = Math.random() * H;
      this.r = Math.random() * 1.8 + 0.3;
      this.vx = (Math.random() - 0.5) * 0.25;
      this.vy = (Math.random() - 0.5) * 0.25;
      this.alpha = Math.random() * 0.5 + 0.2;
      this.hue = Math.random() > 0.5 ? '#ff4d6d' : '#ff85a1';
    }
    update(mouse) {
      this.x += this.vx + (mouse.x - W / 2) * CANVAS_MOUSE_INFLUENCE;
      this.y += this.vy + (mouse.y - H / 2) * CANVAS_MOUSE_INFLUENCE;
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

  class Star {
    constructor() {
      this.x = Math.random() * W;
      this.y = Math.random() * H;
      this.r = Math.random() * 0.9 + 0.1;
      this.speed = Math.random() * 0.008 + 0.002;
      this.phase = Math.random() * Math.PI * 2;
    }
    draw() {
      const alpha = 0.3 + 0.7 * Math.abs(Math.sin(Date.now() * this.speed + this.phase));
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.globalAlpha = alpha * 0.6;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  class FloatingHeart {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * W;
      this.y = H + 30;
      this.size = Math.random() * 12 + 5;
      this.speed = Math.random() * 0.5 + 0.2;
      this.alpha = Math.random() * 0.25 + 0.05;
      this.drift = (Math.random() - 0.5) * 0.5;
      this.rot = (Math.random() - 0.5) * 0.03;
      this.angle = 0;
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

  function init() {
    particles = Array.from({ length: particleCount }, () => new Particle());
    stars = Array.from({ length: starCount }, () => new Star());
    hearts = Array.from({ length: heartCount }, () => new FloatingHeart());
  }

  const mouse = { x: 0, y: 0 };
  window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
  window.addEventListener('touchmove', e => {
    mouse.x = e.touches[0].clientX;
    mouse.y = e.touches[0].clientY;
  }, { passive: true });

  function animate() {
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255,77,109,0.03)';
    ctx.lineWidth = 1;
    grid.forEach(g => {
      ctx.beginPath();
      ctx.moveTo(g.x1, g.y1);
      ctx.lineTo(g.x2, g.y2);
      ctx.stroke();
    });

    stars.forEach(s => s.draw());
    particles.forEach(p => { p.update(mouse); p.draw(); });
    hearts.forEach(h => { h.update(); h.draw(); });

    requestAnimationFrame(animate);
  }

  window.addEventListener('resize', resize);
  resize();
  init();
  animate();
})();

/* ── 3. CURSOR GLOW ── */
(function initCursor() {
  if (window.innerWidth <= 600 || APP.reducedMotion) return;
  const cursor = document.getElementById('cursor-glow');
  let cx = 0, cy = 0, tx = 0, ty = 0;

  document.addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; });

  function animateCursor() {
    cx += (tx - cx) * 0.12;
    cy += (ty - cy) * 0.12;
    cursor.style.left = cx + 'px';
    cursor.style.top = cy + 'px';
    requestAnimationFrame(animateCursor);
  }
  animateCursor();

  document.querySelectorAll('a, button, .card, #audio-btn').forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.style.width = '50px';
      cursor.style.height = '50px';
    });
    el.addEventListener('mouseleave', () => {
      cursor.style.width = '22px';
      cursor.style.height = '22px';
    });
  });
})();

/* ── 4. LOADING SCREEN ── */
(function initLoader() {
  const loaderText = document.getElementById('loader-text');
  const loaderBar = document.getElementById('loader-bar');
  const loaderPercent = document.getElementById('loader-percent');
  const loaderStatus = document.getElementById('loader-status');
  const loadingScreen = document.getElementById('loading-screen');
  const mainSite = document.getElementById('main-site');

  const lines = [
    { text: 'غیر مشروط محبت کی تلاش جاری…', status: 'احساسات اسکین ہو رہے ہیں' },
    { text: 'تلاش جاری…', status: 'پروسیسنگ' },
    { text: 'تلاش جاری…', status: 'گہرا اسکین شروع' },
    { text: 'قربانیوں کا حساب لگ رہا ہے…', status: 'محبت کی پیمائش' },
    { text: 'بے خواب راتیں لوڈ ہو رہی ہیں…', status: 'یادیں جمع ہو رہی ہیں' },
    { text: 'صبر اور دعا کی سطح جانچی جا رہی ہے…', status: 'قریب ہے' },
    { text: '404 — ماں جیسا کوئی نہیں ملا۔', status: 'تلاش مکمل' },
  ];

  let lineIdx = 0, charIdx = 0, progress = 0;

  function typeChar() {
    const line = lines[lineIdx];
    if (charIdx < line.text.length) {
      loaderText.textContent += line.text[charIdx++];
      setTimeout(typeChar, 35);
    } else {
      loaderStatus.textContent = line.status;
      setTimeout(nextLine, 520);
    }
  }

  function nextLine() {
    lineIdx++;
    if (lineIdx >= lines.length) return finishLoad();
    charIdx = 0;
    loaderText.textContent = '';
    typeChar();
  }

  const targetPercents = [12, 28, 40, 55, 72, 88, 100];
  let pIdx = 0;
  const progressTimer = setInterval(() => {
    if (pIdx < targetPercents.length) animateBar(targetPercents[pIdx++]);
  }, 700);

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
    setTimeout(() => {
      loadingScreen.classList.add('fade-out');
      mainSite.classList.remove('hidden');
      mainSite.classList.add('visible');
      setTimeout(() => {
        loadingScreen.style.display = 'none';
        initTerminal();
      }, 900);
    }, 900);
  }

  typeChar();
})();

/* ── 5. SCROLL REVEAL ── */
(function initScrollReveal() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const delay = parseInt(el.dataset.delay || 0, 10);
      setTimeout(() => el.classList.add('in-view'), delay);
      observer.unobserve(el);
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.scroll-reveal, .card').forEach(el => observer.observe(el));

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
  const termObs = new IntersectionObserver(entries => {
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
  body.dataset.started = 'true';

  const scripts = {
    ur: [
      { cls: 't-cmd', text: '> mohabbat_scan.exe', pause: 560 },
      { cls: 't-out', text: '\nسسٹم: تلاش شروع…\n', pause: 380 },
      { cls: 't-cmd', text: '\n> find --target "maa_jaisa_pyar"', pause: 640 },
      { cls: 't-out', text: '\n8 ارب دل اسکین ہو گئے…\n', pause: 600 },
      { cls: 't-err', text: '\nERROR: کوئی متبادل نہیں ملا۔\n', pause: 420 },
      { cls: 't-cmd', text: '\n> shukriya --target=ammi --level=behad', pause: 720 },
      { cls: 't-love', text: '\n  امی شکریہ ❤️\n  آپ بے مثال ہیں۔\n', pause: 0 },
    ],
    en: [
      { cls: 't-cmd', text: '> love_scan.exe', pause: 560 },
      { cls: 't-out', text: '\nSYSTEM: search started...\n', pause: 380 },
      { cls: 't-cmd', text: '\n> find --target "mother_like_love"', pause: 640 },
      { cls: 't-err', text: '\nERROR: no replacement found.\n', pause: 420 },
      { cls: 't-love', text: '\n  Thank you, Mom ❤️\n  You are irreplaceable.\n', pause: 0 },
    ],
  };

  const script = APP.lang === 'ur' ? scripts.ur : scripts.en;
  let i = 0, charI = 0, cursorEl = null;

  function addCursor() {
    cursorEl?.remove();
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
      setTimeout(typeSegment, 20 + Math.random() * 16);
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

/* ── 7. PARALLAX ── */
(function initParallax() {
  if (APP.reducedMotion) return;
  const hero = document.querySelector('.hero-inner');
  if (!hero) return;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    hero.style.transform = `translateY(${y * 0.2}px)`;
    hero.style.opacity = Math.max(0, 1 - y / 620);
  });
})();

/* ── 8. VOICE NOTE + WAVEFORM ── */
(function initVoiceNote() {
  const btn = document.getElementById('voice-play-btn');
  const waveform = document.getElementById('waveform');
  const text = document.getElementById('voice-text');
  if (!btn || !waveform) return;

  function playFallbackTone() {
    const audioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!audioContextClass) return Promise.resolve();
    const ctx = new audioContextClass();
    const noteFrequencies = [392, 440, 523.25, 659.25]; // G4, A4, C5, E5
    const stepMs = 220;
    const minGain = 0.0001;
    const contextCloseBufferMs = 200;
    noteFrequencies.forEach((freq, i) => {
      const startTime = ctx.currentTime + i * (stepMs / 1000);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(minGain, startTime);
      gain.gain.exponentialRampToValueAtTime(0.16, startTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(minGain, startTime + 0.2);
      osc.connect(gain).connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + (stepMs / 1000));
    });
    const closeAfterMs = (noteFrequencies.length * stepMs) + contextCloseBufferMs;
    return new Promise(resolve => {
      setTimeout(() => {
        ctx.close().finally(resolve);
      }, closeAfterMs);
    });
  }

  for (let i = 0; i < 24; i++) {
    const bar = document.createElement('span');
    bar.style.setProperty('--h', (Math.random() * 0.9 + 0.3).toFixed(2));
    bar.style.animationDelay = `${(i % 6) * 0.07}s`;
    waveform.appendChild(bar);
  }

  btn.addEventListener('click', () => {
    vibrate(26);
    const message = APP.lang === 'ur'
      ? 'امی، آپ کی محبت اور دعاؤں کے لیے بہت شکریہ۔ آپ میری دنیا ہیں۔'
      : 'Mom, thank you for your love and prayers. You are my world.';

    waveform.classList.add('active');
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(message);
      if (!speechVoices.length) speechVoices = window.speechSynthesis.getVoices?.() || [];
      const hasUrdu = speechVoices.some(v => v.lang && v.lang.toLowerCase().startsWith('ur'));
      utter.lang = APP.lang === 'ur' && hasUrdu ? 'ur-PK' : 'en-US';
      if (APP.lang === 'ur' && !hasUrdu && text) {
        text.textContent = 'نوٹ: براؤزر میں اردو آواز دستیاب نہیں، انگریزی آواز استعمال ہوگی۔';
      } else if (APP.lang === 'en' && !hasUrdu && text) {
        text.textContent = 'Note: Urdu voice is unavailable in this browser, English voice is being used.';
      }
      utter.rate = 0.9;
      utter.onend = () => waveform.classList.remove('active');
      utter.onerror = async () => {
        await playFallbackTone();
        waveform.classList.remove('active');
      };
      window.speechSynthesis.speak(utter);
    } else {
      playFallbackTone().finally(() => waveform.classList.remove('active'));
    }

    if (text) text.textContent = APP.lang === 'ur' ? 'دل سے: شکریہ امی 💖' : 'From the heart: Thank you Mom 💖';
  });
})();

/* ── 9. MEMORY CAPSULE HEARTS ── */
(function initMemoryCapsules() {
  const wrap = document.getElementById('final-particles');
  const toast = document.getElementById('memory-toast');
  if (!wrap || !toast) return;

  const memories = [
    { ur: 'امی کی دعا، میری طاقت۔', en: 'Mom\'s prayer is my strength.' },
    { ur: 'آپ کی مسکراہٹ میرا سکون ہے۔', en: 'Your smile is my peace.' },
    { ur: 'آپ جیسی کوئی نہیں۔', en: 'No one like you, Mom.' },
    { ur: 'آپ میری جنت ہیں۔', en: 'You are my paradise.' },
    { ur: 'شکریہ امی، ہر سانس کے لیے۔', en: 'Thank you Mom, for every breath.' },
  ];

  function showToast(txt) {
    toast.textContent = txt;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 1800);
  }

  for (let i = 0; i < 7; i++) {
    const h = document.createElement('button');
    h.className = 'memory-heart';
    h.textContent = '💗';
    h.style.left = `${8 + Math.random() * 84}%`;
    h.style.top = `${8 + Math.random() * 70}%`;
    h.style.animationDelay = `${Math.random() * 2.6}s`;
    h.addEventListener('click', () => {
      const m = memories[Math.floor(Math.random() * memories.length)];
      showToast(APP.lang === 'ur' ? m.ur : m.en);
      vibrate(22);
    });
    wrap.appendChild(h);
  }
})();

/* ── 10. FINAL LONG PRESS SURPRISE ── */
(function initLongPressSurprise() {
  const heart = document.getElementById('final-heart');
  const final = document.querySelector('.final-section');
  if (!heart || !final) return;

  let timer = null;
  const BURST_COUNT = 22; // tuned for visual density without overcrowding

  function burst() {
    vibrate(45);
    const words = APP.lang === 'ur'
      ? ['شکریہ', 'امی', 'محبت', 'دعا', 'رحمت']
      : ['Thanks', 'Mom', 'Love', 'Prayer', 'Mercy'];

    for (let i = 0; i < BURST_COUNT; i++) {
      const span = document.createElement('span');
      span.textContent = words[i % words.length];
      span.style.position = 'absolute';
      span.style.left = `${Math.random() * 100}%`;
      span.style.top = `${20 + Math.random() * 60}%`;
      span.style.fontSize = `${0.7 + Math.random() * 0.8}rem`;
      span.style.color = 'rgba(255,179,193,0.9)';
      span.style.pointerEvents = 'none';
      span.style.transition = 'transform 1.2s ease, opacity 1.2s ease';
      final.appendChild(span);
      requestAnimationFrame(() => {
        span.style.transform = `translateY(-${40 + Math.random() * 80}px)`;
        span.style.opacity = '0';
      });
      setTimeout(() => span.remove(), 1300);
    }
  }

  function startPress() {
    timer = setTimeout(burst, 700);
  }

  function cancelPress() {
    clearTimeout(timer);
  }

  heart.addEventListener('mousedown', startPress);
  heart.addEventListener('touchstart', startPress, { passive: true });
  heart.addEventListener('mouseup', cancelPress);
  heart.addEventListener('mouseleave', cancelPress);
  heart.addEventListener('touchend', cancelPress);
})();

/* ── 11. LITE MODE TOGGLE ── */
(function initLiteMode() {
  const btn = document.getElementById('lite-mode-btn');
  if (!btn) return;
  APP.liteMode = APP.reducedMotion || PERF.isLowEndDevice;

  function syncUi() {
    document.body.classList.toggle('reduced-motion', APP.liteMode);
    btn.textContent = APP.liteMode ? 'مکمل' : 'سادہ';
  }

  btn.addEventListener('click', () => {
    APP.liteMode = !APP.liteMode;
    syncUi();
    vibrate(16);
  });

  syncUi();
})();

(function initAdaptiveSignals() {
  reducedMotionQuery.addEventListener('change', e => {
    APP.reducedMotion = e.matches;
    if (APP.reducedMotion) {
      APP.liteMode = true;
      document.body.classList.add('reduced-motion');
    }
  });

  const cardCount = document.querySelectorAll('.cards-grid .card').length;
  document.documentElement.style.setProperty('--story-card-count', String(cardCount || 1));

  if ('speechSynthesis' in window) {
    speechVoices = window.speechSynthesis.getVoices?.() || [];
    window.speechSynthesis.addEventListener('voiceschanged', () => {
      speechVoices = window.speechSynthesis.getVoices?.() || [];
    });
  }
})();

/* ── 12. SMOOTH SCROLL for anchors ── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(a.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  });
});
let speechVoices = [];
