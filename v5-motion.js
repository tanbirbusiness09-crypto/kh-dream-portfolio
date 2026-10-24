/* Executive Dimension V5 Phase 1 — requestAnimationFrame-throttled lighting.
   The existing hover, scroll and booking controllers retain ownership of transforms. */
(() => {
  'use strict';
  const hero = document.getElementById('hero');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = matchMedia('(hover: hover) and (pointer: fine)');
  if (!hero) return;
  let frame = 0, px = 71, py = 43, travel = 0;
  const sections = [...document.querySelectorAll('.studio-section')];
  function draw() {
    frame = 0;
    if (reduce.matches) return;
    hero.style.setProperty('--v5-x', px.toFixed(2) + '%');
    hero.style.setProperty('--v5-y', py.toFixed(2) + '%');
    hero.style.setProperty('--v5-travel', travel.toFixed(1) + 'px');
  }
  const schedule = () => { if (!frame) frame = requestAnimationFrame(draw); };
  if (pointer.matches && !reduce.matches) {
    hero.addEventListener('pointermove', e => {
      const b = hero.getBoundingClientRect();
      px = Math.max(22, Math.min(93, (e.clientX - b.left) / b.width * 100));
      py = Math.max(12, Math.min(87, (e.clientY - b.top) / b.height * 100));
      schedule();
    }, {passive: true});
    hero.addEventListener('pointerleave', () => {px = 71; py = 43; schedule();}, {passive: true});
  }
  const onScroll = () => {
    if (!reduce.matches && scrollY < innerHeight * 1.6) {
      travel = Math.max(-26, -scrollY * .026);
      schedule();
    }
  };
  addEventListener('scroll', onScroll, {passive: true});
  addEventListener('resize', onScroll, {passive: true});
  onScroll();
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        entry.target.dataset.v5Active = String(entry.isIntersecting);
      });
    }, {rootMargin:'-10% 0px -12% 0px', threshold:0});
    sections.forEach(el => observer.observe(el));
  } else {
    sections.forEach(el => {el.dataset.v5Active = 'true';});
  }
})();
