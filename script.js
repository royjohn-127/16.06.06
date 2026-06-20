/* ============================================================================
   FOR DAPHINE - SCRIPT
   ============================================================================
   Organized to match index.html / style.css:
     1. Preloader
     2. Hero petal canvas
     3. Story thread (scroll spy)
     4. Love list flip cards
     5. Letter typewriter
     6. Klawie fireflies
     7. Gallery polaroid rotation + lightbox
     8. Secret messages modal
     9. Music player
     10. Finale (starfield, floating hearts, reveal button)

   Nothing here needs a build step - it's plain JavaScript, loaded once at
   the bottom of index.html after the page content.
   ============================================================================ */

// Respect the visitor's OS-level "reduce motion" setting. Heavy looping
// animations (petals, fireflies, starfield, hearts) check this before
// running so the page stays calm for anyone who needs that.
const PREFERS_REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ----------------------------------------------------------------------------
   1. PRELOADER
   Hides as soon as the page has fully loaded, with a small minimum delay so
   it doesn't just flash on fast connections.
   ---------------------------------------------------------------------------- */
(function preloader() {
  const el = document.getElementById('preloader');
  const hide = () => el.classList.add('is-hidden');
  const minDelay = new Promise((res) => setTimeout(res, 900));
  const pageLoad = new Promise((res) => {
    if (document.readyState === 'complete') res();
    else window.addEventListener('load', res);
  });
  Promise.all([minDelay, pageLoad]).then(hide);
  // Safety net: never let the preloader trap a visitor for more than 4s.
  setTimeout(hide, 4000);
})();

/* ----------------------------------------------------------------------------
   2. HERO PETAL CANVAS
   A lightweight particle system: soft blush/gold petals drift down and
   sway across the hero. Pauses automatically once the hero scrolls out of
   view (via IntersectionObserver) to save battery, and is skipped entirely
   if the visitor prefers reduced motion.
   ---------------------------------------------------------------------------- */
(function petalCanvas() {
  const canvas = document.getElementById('petal-canvas');
  const ctx = canvas.getContext('2d');
  let petals = [];
  let running = false;
  let rafId = null;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function makePetal() {
    return {
      x: Math.random() * canvas.width,
      y: Math.random() * -canvas.height,
      size: 6 + Math.random() * 8,
      speedY: 0.4 + Math.random() * 0.6,
      speedX: Math.random() * 0.6 - 0.3,
      sway: Math.random() * Math.PI * 2,
      swaySpeed: 0.01 + Math.random() * 0.015,
      rotation: Math.random() * Math.PI,
      rotationSpeed: (Math.random() - 0.5) * 0.02,
      hue: Math.random() > 0.5 ? '246,210,214' : '227,203,140', // blush / gold
      opacity: 0.4 + Math.random() * 0.4,
    };
  }

  function initPetals() {
    resize();
    const count = window.innerWidth < 600 ? 16 : 30;
    petals = Array.from({ length: count }, makePetal);
  }

  function drawPetal(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.fillStyle = `rgba(${p.hue}, ${p.opacity})`;
    ctx.beginPath();
    // A simple petal shape: an ellipse tapered at both ends.
    ctx.ellipse(0, 0, p.size * 0.55, p.size, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function tick() {
    if (!running) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    petals.forEach((p) => {
      p.sway += p.swaySpeed;
      p.y += p.speedY;
      p.x += p.speedX + Math.sin(p.sway) * 0.4;
      p.rotation += p.rotationSpeed;
      if (p.y > canvas.height + 20) {
        Object.assign(p, makePetal(), { y: -20 });
      }
      drawPetal(p);
    });
    rafId = requestAnimationFrame(tick);
  }

  function start() {
    if (running || PREFERS_REDUCED_MOTION) return;
    running = true;
    tick();
  }
  function stop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
  }

  window.addEventListener('resize', () => { resize(); });
  initPetals();

  const hero = document.getElementById('hero');
  if (!PREFERS_REDUCED_MOTION && hero) {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => (e.isIntersecting ? start() : stop())),
      { threshold: 0.05 }
    );
    observer.observe(hero);
  }
})();

/* ----------------------------------------------------------------------------
   3. STORY THREAD - scroll spy
   Highlights the active chapter dot and fills the gold thread line based on
   overall scroll progress through <main>.
   ---------------------------------------------------------------------------- */
(function storyThread() {
  const dots = document.querySelectorAll('.thread-dot');
  const fill = document.getElementById('threadFill');
  const sections = Array.from(dots).map((d) =>
    document.getElementById(d.dataset.section)
  );
  if (!dots.length) return;

  function onScroll() {
    // Fill amount = how far we've scrolled through the whole page.
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0;
    fill.style.height = pct + '%';

    // Active dot = the section currently nearest the viewport center.
    const center = scrollTop + window.innerHeight / 2;
    let activeIndex = 0;
    sections.forEach((sec, i) => {
      if (sec && sec.offsetTop <= center) activeIndex = i;
    });
    dots.forEach((d, i) => d.classList.toggle('is-active', i === activeIndex));
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

/* ----------------------------------------------------------------------------
   4. LOVE LIST - flip cards
   Clicking a card toggles a data-flipped attribute, which the CSS uses to
   rotate the card 180deg and reveal the back face.
   ---------------------------------------------------------------------------- */
(function loveCards() {
  document.querySelectorAll('.love-card').forEach((card) => {
    card.addEventListener('click', () => {
      const isFlipped = card.dataset.flipped === 'true';
      card.dataset.flipped = String(!isFlipped);
    });
  });
})();

/* ----------------------------------------------------------------------------
   5. LETTER - typewriter effect
   The full letter text lives in the data-full-text attribute (see
   index.html) so it stays easy to edit as plain text. This script types it
   out character by character once the letter scrolls into view, and only
   runs once.
   ---------------------------------------------------------------------------- */
(function letterTypewriter() {
  const el = document.getElementById('letterText');
  const cursor = document.querySelector('.letter-cursor');
  if (!el) return;
  const fullText = el.dataset.fullText || '';
  let started = false;

  function type() {
    if (started) return;
    started = true;

    // If the visitor prefers reduced motion, just show the full letter
    // immediately rather than animating every character.
    if (PREFERS_REDUCED_MOTION) {
      el.textContent = fullText;
      if (cursor) cursor.classList.add('is-done');
      return;
    }

    let i = 0;
    const speed = 18; // ms per character - tune for a faster/slower reveal
    function step() {
      el.textContent = fullText.slice(0, i);
      i++;
      if (i <= fullText.length) {
        setTimeout(step, speed);
      } else if (cursor) {
        cursor.classList.add('is-done');
      }
    }
    step();
  }

  const observer = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.isIntersecting && type()),
    { threshold: 0.35 }
  );
  observer.observe(el.closest('.letter-paper'));
})();

/* ----------------------------------------------------------------------------
   6. KLAWIE - fireflies
   Spawns small glowing dots that drift upward inside the firefly field.
   Generated continuously while the section is in view.
   ---------------------------------------------------------------------------- */
(function fireflies() {
  const field = document.querySelector('.firefly-field');
  if (!field || PREFERS_REDUCED_MOTION) return;
  let active = false;
  let intervalId = null;

  function spawn() {
    const fly = document.createElement('span');
    fly.className = 'firefly';
    fly.style.left = Math.random() * 100 + '%';
    fly.style.bottom = '-10px';
    fly.style.setProperty('--fx', (Math.random() * 80 - 40) + 'px');
    fly.style.animationDuration = (5 + Math.random() * 5) + 's';
    field.appendChild(fly);
    setTimeout(() => fly.remove(), 11000);
  }

  const section = document.getElementById('klawie');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting && !active) {
        active = true;
        spawn();
        intervalId = setInterval(spawn, 700);
      } else if (!e.isIntersecting && active) {
        active = false;
        clearInterval(intervalId);
      }
    });
  }, { threshold: 0.1 });
  observer.observe(section);
})();

/* ----------------------------------------------------------------------------
   7. GALLERY - polaroid rotation + lightbox
   Each polaroid gets a slight random-feeling tilt from its data-rotate
   attribute (set in the HTML), and clicking any photo opens it large in a
   simple lightbox overlay.
   ---------------------------------------------------------------------------- */
(function gallery() {
  document.querySelectorAll('.polaroid').forEach((card) => {
    const rotate = card.dataset.rotate || 0;
    card.style.setProperty('--r', rotate + 'deg');
  });

  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const closeBtn = document.getElementById('lightboxClose');

  function open(card) {
    const img = card.querySelector('img');
    const caption = card.querySelector('figcaption');
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;
    lightboxCaption.textContent = caption ? caption.textContent : '';
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
  }
  function close() {
    lightbox.hidden = true;
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.polaroid').forEach((card) => {
    card.addEventListener('click', () => open(card));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(card); }
    });
  });
  closeBtn.addEventListener('click', close);
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
})();

/* ----------------------------------------------------------------------------
   8. SECRET MESSAGES - modal
   Each .secret-item button stores its note in data-message. Clicking it
   opens a small centered modal with that text.
   ---------------------------------------------------------------------------- */
(function secrets() {
  const modal = document.getElementById('secretModal');
  const text = document.getElementById('secretModalText');
  const closeBtn = document.getElementById('secretModalClose');

  function open(message) {
    text.textContent = message;
    modal.hidden = false;
  }
  function close() { modal.hidden = true; }

  document.querySelectorAll('.secret-item').forEach((btn) => {
    btn.addEventListener('click', () => open(btn.dataset.message));
  });
  closeBtn.addEventListener('click', close);
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) close(); });
})();

/* ----------------------------------------------------------------------------
   9. MUSIC PLAYER
   A simple play/pause toggle for the floating player. Browsers block
   autoplay with sound, so the song only starts once she actually taps
   play - that tap also satisfies the browser's autoplay policy.
   ---------------------------------------------------------------------------- */
(function musicPlayer() {
  const audio = document.getElementById('bgMusic');
  const player = document.getElementById('musicPlayer');
  const toggle = document.getElementById('musicToggle');
  const iconPlay = toggle.querySelector('.icon-play');
  const iconPause = toggle.querySelector('.icon-pause');

  toggle.addEventListener('click', () => {
    if (audio.paused) {
      audio.play().catch(() => {
        // If the mp3 file hasn't been added yet, playback will fail
        // silently here - see README.md to add assets/music/a-couple-minutes.mp3
      });
    } else {
      audio.pause();
    }
  });

  audio.addEventListener('play', () => {
    player.classList.add('is-playing');
    iconPlay.hidden = true;
    iconPause.hidden = false;
    toggle.setAttribute('aria-label', 'Pause music');
  });
  audio.addEventListener('pause', () => {
    player.classList.remove('is-playing');
    iconPlay.hidden = false;
    iconPause.hidden = true;
    toggle.setAttribute('aria-label', 'Play music');
  });
})();

/* ----------------------------------------------------------------------------
   10. FINALE - starfield, floating hearts, reveal button
   ---------------------------------------------------------------------------- */

// --- 10a. Starfield canvas: gentle twinkling stars across the finale. ---
(function finaleStars() {
  const canvas = document.getElementById('finale-canvas');
  const ctx = canvas.getContext('2d');
  let stars = [];
  let running = false;
  let rafId = null;

  function resize() {
    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = canvas.parentElement.offsetHeight;
  }

  function initStars() {
    resize();
    const count = window.innerWidth < 600 ? 60 : 120;
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.4 + 0.3,
      twinkleSpeed: 0.005 + Math.random() * 0.02,
      phase: Math.random() * Math.PI * 2,
    }));
  }

  function tick() {
    if (!running) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    stars.forEach((s) => {
      s.phase += s.twinkleSpeed;
      const opacity = 0.3 + Math.abs(Math.sin(s.phase)) * 0.7;
      ctx.beginPath();
      ctx.fillStyle = `rgba(255, 248, 230, ${opacity})`;
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    rafId = requestAnimationFrame(tick);
  }

  function start() { if (!running && !PREFERS_REDUCED_MOTION) { running = true; tick(); } }
  function stop() { running = false; if (rafId) cancelAnimationFrame(rafId); }

  window.addEventListener('resize', () => initStars());

  const section = document.getElementById('finale');
  initStars();
  const observer = new IntersectionObserver(
    (entries) => entries.forEach((e) => (e.isIntersecting ? start() : stop())),
    { threshold: 0.05 }
  );
  observer.observe(section);

  // If reduced motion is on, draw one still frame so it isn't empty.
  if (PREFERS_REDUCED_MOTION) { running = true; tick(); running = false; }
})();

// --- 10b. Floating hearts: small hearts drifting upward continuously. ---
(function floatingHearts() {
  const container = document.getElementById('floatingHearts');
  if (!container || PREFERS_REDUCED_MOTION) return;
  let active = false;
  let intervalId = null;

  function spawn() {
    const heart = document.createElement('span');
    heart.className = 'floating-heart';
    heart.textContent = Math.random() > 0.5 ? '♡' : '❤';
    heart.style.left = Math.random() * 100 + '%';
    heart.style.fontSize = (12 + Math.random() * 18) + 'px';
    heart.style.setProperty('--drift', (Math.random() * 120 - 60) + 'px');
    heart.style.animationDuration = (6 + Math.random() * 6) + 's';
    container.appendChild(heart);
    setTimeout(() => heart.remove(), 13000);
  }

  const section = document.getElementById('finale');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting && !active) {
        active = true;
        spawn();
        intervalId = setInterval(spawn, 600);
      } else if (!e.isIntersecting && active) {
        active = false;
        clearInterval(intervalId);
      }
    });
  }, { threshold: 0.1 });
  observer.observe(section);
})();

// --- 10c. "One Last Thing..." reveal button ---
(function finaleReveal() {
  const button = document.getElementById('oneLastThing');
  const reveal = document.getElementById('finalReveal');
  if (!button) return;

  button.addEventListener('click', () => {
    reveal.hidden = false;
    button.style.display = 'none';
    reveal.scrollIntoView({ behavior: PREFERS_REDUCED_MOTION ? 'auto' : 'smooth', block: 'center' });

    // A small celebratory burst of hearts right when the message appears.
    if (!PREFERS_REDUCED_MOTION) {
      const container = document.getElementById('floatingHearts');
      for (let i = 0; i < 18; i++) {
        setTimeout(() => {
          const heart = document.createElement('span');
          heart.className = 'floating-heart';
          heart.textContent = '❤';
          heart.style.left = Math.random() * 100 + '%';
          heart.style.fontSize = (14 + Math.random() * 22) + 'px';
          heart.style.setProperty('--drift', (Math.random() * 160 - 80) + 'px');
          heart.style.animationDuration = (4 + Math.random() * 4) + 's';
          container.appendChild(heart);
          setTimeout(() => heart.remove(), 9000);
        }, i * 60);
      }
    }
  });
})();
