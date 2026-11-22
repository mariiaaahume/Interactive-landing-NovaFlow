(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var loader = document.getElementById('loader');
  var hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  var lenis = null;

  /* ---------- Logo marquee: fill each row with 4 identical sets (2 halves) ---------- */
  document.querySelectorAll('.logos__track').forEach(function (track) {
    var set = track.querySelector('.logos__set');
    for (var i = 0; i < 3; i++) {
      var clone = set.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone);
    }
  });

  /* ---------- Background videos: play only while on screen; poster only with reduced motion ---------- */
  (function () {
    var vids = Array.from(document.querySelectorAll('video.bg-video'));
    var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    vids.forEach(function (v) {
      v.muted = true; v.setAttribute('muted', '');
      if (still) { v.removeAttribute('autoplay'); v.pause(); }
    });
    if (still || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
        else v.pause();
      });
    }, { rootMargin: '200px 0px' });
    vids.forEach(function (v) { io.observe(v); });
  })();

  /* ---------- Buttons: fill grows from the point where the cursor enters / leaves ---------- */
  document.querySelectorAll('.btn').forEach(function (btn) {
    function setOrigin(e) {
      var r = btn.getBoundingClientRect();
      btn.style.setProperty('--x', (e.clientX - r.left) + 'px');
      btn.style.setProperty('--y', (e.clientY - r.top) + 'px');
    }
    btn.addEventListener('pointerenter', setOrigin);
    btn.addEventListener('pointerleave', setOrigin);
  });

  /* ---------- Scalable Solutions: zoom toward the cursor ---------- */
  var scal = document.getElementById('scalable');
  var scalImg = document.querySelector('#scalableZoom .bg-video');
  if (scal && scalImg) {
    scal.addEventListener('pointermove', function (e) {
      var r = scalImg.parentElement.getBoundingClientRect();
      var x = Math.min(100, Math.max(0, (e.clientX - r.left) / r.width * 100));
      var y = Math.min(100, Math.max(0, (e.clientY - r.top) / r.height * 100));
      scalImg.style.setProperty('--zx', x + '%');
      scalImg.style.setProperty('--zy', y + '%');
    });
  }

  /* ---------- Mobile menu (works without GSAP) ---------- */
  var burger = document.getElementById('burger');
  var menu = document.getElementById('mobileMenu');
  var menuClose = document.getElementById('menuClose');
  function setMenu(open) {
    burger.setAttribute('aria-expanded', String(open));
    menu.hidden = !open;
    document.body.style.overflow = open ? 'hidden' : '';
    if (lenis) open ? lenis.stop() : lenis.start();
    if (open) {
      menuClose.focus();
      if (hasGsap && !reduce) {
        gsap.fromTo(menu, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: .7, ease: 'expo.out' });
        gsap.fromTo(menu.querySelectorAll('li a'), { yPercent: 110 }, { yPercent: 0, duration: .9, stagger: .06, ease: 'expo.out', delay: .1 });
        gsap.fromTo(menu.querySelectorAll('.btn-nav, .mobile-menu__top'), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: .8, ease: 'expo.out', delay: .3 });
      }
    } else {
      burger.focus({ preventScroll: true });
    }
  }
  burger.addEventListener('click', function () { setMenu(true); });
  menuClose.addEventListener('click', function () { setMenu(false); });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) setMenu(false); });
  window.matchMedia('(min-width: 901px)').addEventListener('change', function (mq) { if (mq.matches && !menu.hidden) setMenu(false); });

  /* ---------- No animation path ---------- */
  if (!hasGsap || reduce) {
    if (loader) loader.hidden = true;
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add('fx');
  document.body.classList.add('is-loading');

  /* ---------- Smooth scroll ---------- */
  if (typeof window.Lenis !== 'undefined') {
    lenis = new Lenis({ duration: 1.15, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); } });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      var target = id === '#top' ? 0 : document.querySelector(id);
      if (target === null) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { duration: 1.4 });
      else window.scrollTo({ top: target === 0 ? 0 : target.getBoundingClientRect().top + scrollY, behavior: 'smooth' });
    });
  });

  /* ---------- Split helpers ---------- */
  function splitChars(el) {
    var text = el.textContent;
    el.textContent = '';
    var frag = document.createDocumentFragment();
    Array.from(text).forEach(function (c) {
      var s = document.createElement('span');
      s.className = 'ch';
      s.textContent = c === ' ' ? ' ' : c;
      frag.appendChild(s);
    });
    el.appendChild(frag);
    return el.querySelectorAll('.ch');
  }

  // Firma-style masked lines: words grouped by their rendered line
  function splitLines(el) {
    if (!el.dataset.src) el.dataset.src = el.textContent.trim();
    var words = el.dataset.src.split(/\s+/);
    el.innerHTML = words.map(function (w) { return '<span class="wtmp">' + w + '</span>'; }).join(' ');
    var lines = [], last = null;
    el.querySelectorAll('.wtmp').forEach(function (w) {
      var top = w.offsetTop;
      if (last === null || Math.abs(top - last) > 4) { lines.push([]); last = top; }
      lines[lines.length - 1].push(w.textContent);
    });
    el.innerHTML = lines.map(function (l) { return '<span class="split-line"><span>' + l.join(' ') + '</span></span>'; }).join('');
    return el.querySelectorAll('.split-line > span');
  }

  /* ---------- Preloader → hero intro (wejungle-inspired) ---------- */
  var hero = document.getElementById('hero');
  var heroMedia = document.getElementById('heroMedia');
  var titleLine = document.querySelector('.hero__title .line__in');
  var rotWords = Array.from(document.querySelectorAll('.rotator__word'));
  rotWords.forEach(splitChars);
  var firstChars = rotWords[0].querySelectorAll('.ch');

  var countEl = document.getElementById('loaderCount');
  var barEl = document.getElementById('loaderBar');
  var logoDots = document.querySelectorAll('#loaderLogo circle');
  var loaderLetters = document.querySelectorAll('.loader__word span');

  gsap.set(hero, { clipPath: 'inset(18% 22% 18% 22% round 24px)' });
  gsap.set(heroMedia, { scale: 1.25 });
  gsap.set(titleLine, { yPercent: 110 });
  gsap.set(firstChars, { yPercent: 110 });
  gsap.set(['[data-hero="badge"]', '[data-hero="sub"]', '[data-hero="actions"]', '[data-hero="trusted"]', '.nav'], { autoAlpha: 0, y: 24 });

  var counter = { v: 0 };
  var intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
  intro
    .from(logoDots, { scale: 0, transformOrigin: '50% 50%', duration: .9, stagger: { each: .012, from: 'random' }, ease: 'back.out(3)' }, 0)
    .from(loaderLetters, { yPercent: 110, duration: 1, stagger: .045 }, .15)
    .to(counter, { v: 100, duration: 1.7, ease: 'power2.inOut', onUpdate: function () { countEl.textContent = Math.round(counter.v); } }, 0)
    .to(barEl, { scaleX: 1, duration: 1.7, ease: 'power2.inOut' }, 0)
    .to('#loaderLogo', { rotate: 180, duration: 1.7, ease: 'power2.inOut' }, 0)
    .to(loaderLetters, { yPercent: -110, duration: .7, stagger: .03, ease: 'expo.in' }, 1.75)
    .to(logoDots, { scale: 0, transformOrigin: '50% 50%', duration: .5, stagger: { each: .006, from: 'center' }, ease: 'power3.in' }, 1.8)
    .to(loader, { clipPath: 'inset(0 0 100% 0)', duration: 1.1, ease: 'expo.inOut' }, 2.25)
    .to(hero, { clipPath: 'inset(0% 0% 0% 0% round 10px)', duration: 1.5, ease: 'expo.inOut' }, 2.2)
    .to(heroMedia, { scale: 1, duration: 2.2, ease: 'expo.out' }, 2.4)
    .to('.nav', { autoAlpha: 1, y: 0, duration: 1 }, 3.0)
    .to('[data-hero="badge"]', { autoAlpha: 1, y: 0, duration: 1 }, 3.05)
    .to(titleLine, { yPercent: 0, duration: 1.2 }, 3.1)
    .to(firstChars, { yPercent: 0, duration: 1.2, stagger: .035 }, 3.2)
    .to('[data-hero="sub"]', { autoAlpha: 1, y: 0, duration: 1 }, 3.4)
    .to('[data-hero="actions"]', { autoAlpha: 1, y: 0, duration: 1 }, 3.5)
    .to('[data-hero="trusted"]', { autoAlpha: 1, y: 0, duration: 1 }, 3.6)
    .add(function () {
      loader.hidden = true;
      gsap.set(hero, { clearProps: 'clipPath' });
      document.body.classList.remove('is-loading');
      if (lenis) lenis.start();
      ScrollTrigger.refresh();
      startRotator();
    }, 3.4);

  // Never trap the visitor behind the loader
  setTimeout(function () { if (!loader.hidden) intro.progress(1); }, 7000);
  loader.addEventListener('click', function () { intro.progress(1); });

  /* ---------- Firma-style word swap in the headline ---------- */
  // Outgoing letters travel far enough (and fade) that no descender/dot stays visible inside the mask.
  var rotIndex = 0, rotTimer = null, rotBusy = false;
  var rot = document.getElementById('rotator');
  function startRotator() {
    if (rotTimer) return;
    rotTimer = setInterval(function () {
      if (document.hidden || rotBusy) return;
      rotBusy = true;
      var cur = rotWords[rotIndex];
      rotIndex = (rotIndex + 1) % rotWords.length;
      var next = rotWords[rotIndex];
      var curChars = cur.querySelectorAll('.ch');
      var nextChars = next.querySelectorAll('.ch');
      gsap.set(nextChars, { yPercent: 160, opacity: 0 });
      next.classList.add('is-in');
      gsap.set(rot, { width: cur.offsetWidth });
      gsap.to(rot, { width: next.offsetWidth, duration: 1.1, ease: 'expo.inOut', delay: .15 });
      gsap.to(curChars, { yPercent: -160, opacity: 0, duration: .7, stagger: .025, ease: 'power3.in' });
      gsap.to(nextChars, {
        yPercent: 0, opacity: 1, duration: 1, stagger: .03, ease: 'expo.out', delay: .5,
        onComplete: function () {
          cur.classList.remove('is-active');
          next.classList.remove('is-in');
          next.classList.add('is-active');
          gsap.set(curChars, { yPercent: 0, opacity: 1 });
          gsap.set(rot, { clearProps: 'width' });
          rotBusy = false;
        }
      });
      rot.setAttribute('aria-label', next.textContent);
    }, 3000);
  }

  /* ---------- Hero scroll + pointer parallax ---------- */
  gsap.to(heroMedia, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
  // the content only fades on large screens; on phones it stays fully readable
  ScrollTrigger.matchMedia({
    '(min-width: 901px)': function () {
      gsap.to('.hero__content', { yPercent: 18, autoAlpha: .2, ease: 'none', scrollTrigger: { trigger: hero, start: 'center center', end: 'bottom top', scrub: true } });
    }
  });
  if (finePointer) {
    var qx = gsap.quickTo(heroMedia, 'x', { duration: 1.2, ease: 'power3' });
    var qy = gsap.quickTo(heroMedia, 'y', { duration: 1.2, ease: 'power3' });
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      qx(((e.clientX - r.left) / r.width - .5) * -24);
      qy(((e.clientY - r.top) / r.height - .5) * -16);
    });
  }

  /* ---------- Statement: word-by-word scrubbed reveal ---------- */
  var statement = document.getElementById('statementText');
  statement.innerHTML = statement.textContent.trim().split(/\s+/).map(function (w) { return '<span class="w">' + w + '</span>'; }).join(' ');
  var sWords = statement.querySelectorAll('.w');
  function paintGradient() {
    var W = statement.offsetWidth, H = statement.offsetHeight;
    sWords.forEach(function (w) {
      w.style.backgroundSize = W + 'px ' + H + 'px';
      w.style.backgroundPosition = (-w.offsetLeft) + 'px ' + (-w.offsetTop) + 'px';
    });
  }
  paintGradient();
  gsap.fromTo(sWords, { opacity: window.innerWidth < 641 ? .3 : .12, filter: 'blur(6px)' }, {
    opacity: 1, filter: 'blur(0px)', stagger: .1, ease: 'none',
    scrollTrigger: { trigger: statement, start: 'top 85%', end: window.innerWidth < 641 ? 'bottom 68%' : 'bottom 45%', scrub: .6 }
  });
  gsap.from('.statement .eyebrow', { y: 20, autoAlpha: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.statement', start: 'top 85%', once: true } });
  gsap.to('.blob--left', { y: 120, ease: 'none', scrollTrigger: { trigger: '.statement', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.to('.blob--right', { y: -140, x: -60, ease: 'none', scrollTrigger: { trigger: '.statement', start: 'top bottom', end: 'bottom top', scrub: true } });

  /* ---------- Masked line reveals for headings ---------- */
  var lineEls = Array.from(document.querySelectorAll('.reveal-lines'));
  function buildLines() {
    lineEls.forEach(function (el) {
      var inner = splitLines(el);
      if (el._st) el._st.kill();
      if (el.dataset.played) return;
      gsap.set(inner, { yPercent: 115 });
      el._st = ScrollTrigger.create({
        trigger: el, start: 'top 88%', once: true,
        onEnter: function () { el.dataset.played = '1'; gsap.to(inner, { yPercent: 0, duration: 1.3, stagger: .1, ease: 'expo.out' }); }
      });
    });
  }
  buildLines();
  gsap.utils.toArray('.intro .muted, .partner__lead').forEach(function (p) {
    gsap.from(p, { y: 24, autoAlpha: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: p, start: 'top 90%', once: true } });
  });

  /* ---------- Cards & bento entrance (straight, transforms cleared afterwards) ---------- */
  gsap.from('.card', { y: 70, autoAlpha: 0, duration: 1.2, stagger: .12, ease: 'expo.out', clearProps: 'transform,opacity,visibility', scrollTrigger: { trigger: '.cards', start: 'top 85%', once: true } });
  gsap.from('.bento > *', { y: 80, autoAlpha: 0, duration: 1.2, stagger: .12, ease: 'expo.out', clearProps: 'transform,opacity,visibility', scrollTrigger: { trigger: '.bento', start: 'top 85%', once: true } });
  gsap.from('.dots-main circle', { scale: 0, transformOrigin: '50% 50%', duration: .8, stagger: { each: .03, from: 'end' }, ease: 'back.out(2.5)', scrollTrigger: { trigger: '.tile--purple', start: 'top 70%', once: true } });

  /* ---------- Purple tile: a gradient sweeps around the ring and lights the dots it passes (infinite) ---------- */
  var ring = document.getElementById('dotsRing');
  var glow = document.getElementById('dotsGlow');
  var ringDots = Array.from(ring.querySelectorAll('svg circle')).map(function (c) { return { el: c }; });
  ring.querySelectorAll('.dots-ghost circle').forEach(function (c) { c.setAttribute('fill-opacity', '1'); });
  var ringAngle = 0, ringOn = false;
  function measureRing() {
    var r = ring.getBoundingClientRect();
    var minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
    ringDots.forEach(function (d) {
      var b = d.el.getBoundingClientRect();
      d.x = b.left + b.width / 2 - r.left; d.y = b.top + b.height / 2 - r.top;
      minx = Math.min(minx, d.x); maxx = Math.max(maxx, d.x); miny = Math.min(miny, d.y); maxy = Math.max(maxy, d.y);
    });
    var cx = (minx + maxx) / 2, cy = (miny + maxy) / 2;
    ringDots.forEach(function (d) { d.ang = Math.atan2(d.y - cy, d.x - cx); });
    var size = Math.max(maxx - minx, maxy - miny) * 1.35;
    gsap.set(glow, { left: cx, top: cy, width: size, height: size });
  }
  function paintRing() {
    ringDots.forEach(function (d) {
      var v = 0.5 + 0.5 * Math.cos(d.ang - ringAngle);
      d.el.style.opacity = (0.12 + 0.88 * Math.pow(v, 2.2)).toFixed(3);
    });
    glow.style.transform = 'translate(-50%, -50%) rotate(' + (ringAngle * 180 / Math.PI + 90).toFixed(2) + 'deg)';
  }
  gsap.ticker.add(function (time, dt) {
    if (!ringOn) return;
    ringAngle += (dt / 1000) * (Math.PI * 2 / 7); // one turn every 7s
    paintRing();
  });
  measureRing(); paintRing(); // first frame = Figma state: right side lit, left side dim
  ScrollTrigger.create({
    trigger: ring, start: 'top bottom', end: 'bottom top',
    onToggle: function (self) { ringOn = self.isActive; gsap.to(glow, { opacity: ringOn ? 1 : 0, duration: .8 }); },
    onRefresh: measureRing
  });
  gsap.to('#asterisk', { rotate: 360, ease: 'none', scrollTrigger: { trigger: '.partner', start: 'top bottom', end: 'bottom top', scrub: 1 } });
  gsap.fromTo('#scalableZoom', { scale: 1.2 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.tile--image', start: 'top bottom', end: 'bottom 40%', scrub: true } });

  /* ---------- Card illustrations: state -1 at rest, state -2 on hover ---------- */
  function sceneTimeline(card) {
    var type = card.dataset.scene;
    var tl = gsap.timeline({ paused: true, defaults: { ease: 'expo.out' } });
    if (type === 'cal') {
      var circle = card.querySelector('.cal__circle');
      var cursor = card.querySelector('.cal__cursor');
      var chip = card.querySelector('.cal__chip');
      gsap.set(circle, { scale: .3, autoAlpha: 0 });
      gsap.set(cursor, { x: 46, y: 38, rotate: 18, autoAlpha: 0 });
      gsap.set(chip, { x: -18, scale: .85, autoAlpha: 0 });
      tl.to(cursor, { x: 0, y: 0, rotate: 0, autoAlpha: 1, duration: .7 }, 0)
        .to(cursor, { scale: .82, duration: .12, ease: 'power2.out' }, .5)
        .to(cursor, { scale: 1, duration: .35, ease: 'back.out(3)' }, .62)
        .to(circle, { scale: 1, autoAlpha: 1, duration: .7, ease: 'back.out(2.2)' }, .55)
        .to(chip, { x: 0, scale: 1, autoAlpha: 1, duration: .8 }, .75);
    } else if (type === 'folder') {
      var panel = card.querySelector('.folder__panel');
      var front = card.querySelector('.folder__front');
      tl.to(panel, { rotate: -10, duration: 1, ease: 'elastic.out(1, .75)' }, 0)
        .to(front, { y: -4, duration: .8 }, 0);
    }
    return tl;
  }
  document.querySelectorAll('.card[data-scene]').forEach(function (card) {
    var tl = sceneTimeline(card);
    if (finePointer) {
      card.addEventListener('pointerenter', function () { tl.timeScale(1).play(); });
      card.addEventListener('pointerleave', function () { tl.timeScale(1.6).reverse(); });
    } else {
      // touch screens have no hover: play the -2 state when the card is in view
      ScrollTrigger.create({ trigger: card, start: 'top 65%', end: 'bottom 20%', onEnter: function () { tl.play(); }, onEnterBack: function () { tl.play(); }, onLeave: function () { tl.reverse(); }, onLeaveBack: function () { tl.reverse(); } });
    }
  });

  /* ---------- "Automate the everyday" — moving giant type (wejungle-inspired) ---------- */
  /* Firma-style reading lock, with no empty screen:
     1) the phrase is already on screen (soft and blurred) as it scrolls in, and sharpens word by word;
     2) it then locks in the middle of the viewport while the scroll keeps going;
     3) its words blur away one by one while the second phrase blurs in on the same spot;
     4) short hold, then it releases and the gradient section follows straight after. */
  var leadTrack = document.getElementById('leadTrack');
  var leadBox = document.getElementById('leadBox');
  var leadA = document.getElementById('leadA');
  var leadB = document.getElementById('leadB');
  var leadTl1 = null, leadTl2 = null;
  function leadDist() { return window.innerHeight * (window.innerWidth < 901 ? 0.95 : 1.1); }
  function leadTop() { return Math.max(0, Math.round((window.innerHeight - leadBox.offsetHeight) / 2)); }
  function sizeLead() {
    leadTrack.style.height = Math.round(leadBox.offsetHeight + leadDist()) + 'px';
    leadBox.style.setProperty('--lead-top', leadTop() + 'px');
  }
  function wordsOf(layer) {
    layer.querySelectorAll('.automate__line').forEach(function (p) {
      if (!p.dataset.src) p.dataset.src = p.textContent.trim();
      p.innerHTML = p.dataset.src.split(/\s+/).map(function (w) { return '<span class="lw"><span class="lw__i">' + w + '</span></span>'; }).join(' ');
    });
    return layer.querySelectorAll('.lw');
  }
  function buildLead() {
    if (leadTl1) { leadTl1.scrollTrigger.kill(); leadTl1.kill(); }
    if (leadTl2) { leadTl2.scrollTrigger.kill(); leadTl2.kill(); }
    var a = wordsOf(leadA), b = wordsOf(leadB);
    var aIn = leadA.querySelectorAll('.lw__i');
    sizeLead();
    gsap.set(b, { opacity: 0, filter: 'blur(12px)', y: 16 });
    leadTl1 = gsap.fromTo(a, { opacity: .4, filter: 'blur(7px)' }, {
      opacity: 1, filter: 'blur(0px)', stagger: .08, ease: 'none',
      scrollTrigger: { trigger: leadTrack, start: 'top bottom', end: 'top 45%', scrub: .5 }
    });
    leadTl2 = gsap.timeline({
      scrollTrigger: { trigger: leadTrack, start: function () { return 'top ' + leadTop() + 'px'; }, end: function () { return '+=' + leadDist(); }, scrub: .6, invalidateOnRefresh: true }
    });
    leadTl2
      .fromTo(aIn, { opacity: 1, filter: 'blur(0px)', y: 0 }, { opacity: 0, filter: 'blur(12px)', y: -16, stagger: .05, duration: .5, ease: 'power1.in', immediateRender: false }, .35)
      .to(b, { opacity: 1, filter: 'blur(0px)', y: 0, stagger: .06, duration: .5, ease: 'power1.out' }, '>-0.3')
      .to({}, { duration: .55 });
  }
  buildLead();

  var giantA = document.getElementById('giantA');
  var giantB = document.getElementById('giantB');
  var gaChars = splitChars(giantA);
  var gbChars = splitChars(giantB);
  giantA.classList.add('is-split');
  giantB.classList.add('is-split');
  var stageTrack = document.getElementById('stageTrack');
  var stage = document.getElementById('stage');
  var caption = document.getElementById('stageCaption');
  var capInner = splitLines(caption);

  // Letters stay on one baseline: they only fade/blur in, in sequence, while the rows slide.
  ScrollTrigger.matchMedia({
    '(min-width: 901px)': function () {
      var tl = gsap.timeline({ scrollTrigger: { trigger: stageTrack, start: 'top 70%', end: 'bottom bottom', scrub: 1 } });
      tl.fromTo(giantA, { xPercent: 10 }, { xPercent: -26, ease: 'none', duration: 1 }, 0)
        .fromTo(giantB, { xPercent: -8 }, { xPercent: 16, ease: 'none', duration: 1 }, 0)
        .fromTo(gaChars, { opacity: 0, filter: 'blur(12px)' }, { opacity: 1, filter: 'blur(0px)', stagger: .045, duration: .25, ease: 'power1.out' }, 0)
        .fromTo(gbChars, { opacity: 0, filter: 'blur(12px)' }, { opacity: 1, filter: 'blur(0px)', stagger: .035, duration: .25, ease: 'power1.out' }, .12)
        .fromTo(capInner, { yPercent: 115 }, { yPercent: 0, duration: .25, ease: 'power3.out' }, .5);
    },
    '(max-width: 900px)': function () {
      gsap.fromTo(giantA, { xPercent: 10 }, { xPercent: -45, ease: 'none', scrollTrigger: { trigger: stage, start: 'top bottom', end: 'bottom top', scrub: true } });
      gsap.fromTo(giantB, { xPercent: -30 }, { xPercent: 5, ease: 'none', scrollTrigger: { trigger: stage, start: 'top bottom', end: 'bottom top', scrub: true } });
      gsap.fromTo(gaChars, { opacity: 0 }, { opacity: 1, stagger: .05, ease: 'none', scrollTrigger: { trigger: stage, start: 'top 85%', end: 'center 60%', scrub: true } });
      gsap.fromTo(gbChars, { opacity: 0 }, { opacity: 1, stagger: .04, ease: 'none', scrollTrigger: { trigger: stage, start: 'top 70%', end: 'center 45%', scrub: true } });
      gsap.fromTo(capInner, { yPercent: 115 }, { yPercent: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: caption, start: 'top 92%', once: true } });
    }
  });

  /* ---------- CTA ---------- */
  gsap.fromTo('#ctaMedia', { yPercent: -6, scale: 1.08 }, { yPercent: 6, scale: 1, ease: 'none', scrollTrigger: { trigger: '#cta', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.from('.btn-demo', { y: 30, autoAlpha: 0, duration: 1.2, ease: 'expo.out', clearProps: 'transform,opacity,visibility', scrollTrigger: { trigger: '#cta', start: 'top 80%', once: true } });

  /* ---------- Footer: AKQA-style staggered rise (CSS transition, delay per item) ---------- */
  var shows = Array.from(document.querySelectorAll('#footer [data-show]'));
  shows.forEach(function (el, i) { el.style.setProperty('--d', (i * 0.07).toFixed(2) + 's'); });
  ScrollTrigger.create({
    trigger: '#footer', start: 'top 88%', once: true,
    onEnter: function () { shows.forEach(function (el) { el.classList.add('in-view'); }); }
  });
  var fDots = document.querySelectorAll('.footer__logo svg circle');
  gsap.from(fDots, {
    scale: 0, transformOrigin: '50% 50%', duration: .8, stagger: { each: .01, from: 'random' }, ease: 'back.out(3)', delay: .2,
    scrollTrigger: { trigger: '#footer', start: 'top 88%', once: true },
    onComplete: function () {
      // idle loop: slow spin + dots twinkling in a wave
      gsap.to('.footer__logo svg', { rotate: 360, transformOrigin: '50% 50%', duration: 36, ease: 'none', repeat: -1 });
      gsap.to(fDots, { opacity: .25, duration: 1.1, ease: 'sine.inOut', stagger: { each: .045, repeat: -1, yoyo: true, from: 'start' } });
    }
  });

  /* ---------- What we offer holds on its last line, then "A trusted AI-powered" rises over it.
     Inside it, the heading stays still while the cards rise and push it up. ---------- */
  var pushA = document.getElementById('stackA');
  function measurePush() {
    var vh = window.innerHeight, h = pushA.offsetHeight;
    var top = Math.min(0, vh - h);
    pushA.style.setProperty('--stick', top + 'px');
    pushA.style.transformOrigin = '50% ' + Math.round(-top + Math.min(h, vh) / 2) + 'px';
  }
  measurePush();
  ScrollTrigger.addEventListener('refreshInit', measurePush);
  gsap.fromTo(pushA, { scale: 1, '--dim': 0 }, {
    scale: .965, '--dim': .1, ease: 'none',
    scrollTrigger: { trigger: '#how', start: 'top bottom', end: 'top top', scrub: true }
  });

  /* ---------- Footer emerges from underneath the gradient section ---------- */
  var closingInner = document.querySelector('.closing__inner');
  var closing = document.getElementById('contact');
  gsap.fromTo(closingInner, { y: function () { return -Math.round(Math.min(closing.offsetHeight, window.innerHeight) * .6); } }, {
    y: 0, ease: 'none',
    scrollTrigger: {
      trigger: closing, start: 'top bottom', invalidateOnRefresh: true,
      end: function () { return closing.offsetHeight < window.innerHeight ? 'bottom bottom' : 'top top'; },
      scrub: true
    }
  });
  ScrollTrigger.addEventListener('refreshInit', sizeLead);

  /* ---------- Resize: rebuild text splits ---------- */
  var lastW = window.innerWidth, rT;
  window.addEventListener('resize', function () {
    clearTimeout(rT);
    rT = setTimeout(function () {
      if (Math.abs(window.innerWidth - lastW) < 40) { paintGradient(); return; }
      lastW = window.innerWidth;
      buildLines();
      buildLead();
      measureRing();
      paintGradient();
      ScrollTrigger.refresh();
    }, 200);
  });
  window.addEventListener('load', function () { paintGradient(); ScrollTrigger.refresh(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { paintGradient(); buildLines(); buildLead(); ScrollTrigger.refresh(); measureRing(); });
})();
