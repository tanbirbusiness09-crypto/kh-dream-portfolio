/* Executive Dimension / Phase 1 — progressive 3D entrance */
(() => {
  'use strict';
  const root = document.documentElement;
  const portal = document.getElementById('entryPortal');
  const skip = document.getElementById('entrySkip');
  const hero = document.getElementById('hero');
  const shell = document.querySelector('.site-shell');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const intro = root.classList.contains('motion-intro') && !reduceMotion;
  let timer = 0, finished = false;

  function paintScroll() {
    frame = 0;
    if (!hero || reduceMotion || window.innerWidth <= 960) return;
    const progress = Math.max(0, Math.min(1, window.scrollY / Math.max(1, hero.offsetHeight * .95)));
    hero.style.setProperty('--hero-visual-lift', (-72 * progress).toFixed(1) + 'px');
    hero.style.setProperty('--hero-visual-scale', (1 + progress * .027).toFixed(4));
    hero.style.setProperty('--hero-grid-lift', (-24 * progress).toFixed(1) + 'px');
    hero.style.setProperty('--hero-ghost-lift', (-58 * progress).toFixed(1) + 'px');
  }
  let frame = 0;
  function requestFrame() {
    if (!frame && !reduceMotion && hero) frame = requestAnimationFrame(paintScroll);
  }
  function endIntro(skipped) {
    if (finished) return;
    finished = true;
    clearTimeout(timer);
    root.classList.remove('motion-intro');
    root.classList.add('motion-finished');
    document.body.classList.remove('intro-locked');
    if (hero) hero.classList.remove('hero-intro-active');
    if (portal) { portal.hidden = true; portal.inert = true; }
    if (shell) shell.inert = false;
    try { sessionStorage.setItem('kh-intro-complete', '1'); } catch (_) {}
    if (skipped && window.scrollY < window.innerHeight * .4) {
      const title = document.getElementById('heroTitle');
      if (title) {
        title.setAttribute('tabindex', '-1');
        title.focus({preventScroll: true});
      }
    }
    paintScroll();
  }

  if (portal) {
    if (intro) {
      portal.hidden = false;
      portal.inert = false;
      if (shell) shell.inert = true;
      document.body.classList.add('intro-locked');
      if (hero) hero.classList.add('hero-intro-active');
      if (skip) skip.addEventListener('click', () => endIntro(true), {once:true});
      document.addEventListener('keydown', e => { if (e.key === 'Escape') endIntro(true); });
      timer = setTimeout(() => endIntro(false), 2300);
      window.addEventListener('pagehide', () => endIntro(false), {once:true});
    } else { portal.hidden = true; portal.inert = true; }
  }
  window.addEventListener('scroll', requestFrame, {passive:true});
  window.addEventListener('resize', requestFrame, {passive:true});
  window.addEventListener('pageshow', requestFrame, {passive:true});
  paintScroll();
})();