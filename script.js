(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const header = document.getElementById('siteHeader');
  const menuToggle = document.getElementById('menuToggle');
  const mobileNav = document.getElementById('mobileNav');
  const heroVisual = document.getElementById('heroVisual');
  const glow = document.getElementById('cursorGlow');
  const year = document.getElementById('copyrightYear');
  year.textContent = String(new Date().getFullYear());

  // Sticky glass navigation: avoid costly on-scroll layouts.
  const setHeader = () => header.classList.toggle('scrolled', window.scrollY > 25);
  window.addEventListener('scroll', setHeader, {passive:true});
  setHeader();

  function toggleMenu(shouldOpen) {
    menuToggle.setAttribute('aria-expanded', String(shouldOpen));
    menuToggle.setAttribute('aria-label', shouldOpen ? 'Close menu' : 'Open menu');
    mobileNav.classList.toggle('open', shouldOpen);
    mobileNav.inert = !shouldOpen;
    document.body.classList.toggle('menu-open', shouldOpen);
  }
  menuToggle.addEventListener('click', () => toggleMenu(menuToggle.getAttribute('aria-expanded') !== 'true'));
  mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => toggleMenu(false)));
  document.addEventListener('keydown', e => { if(e.key === 'Escape') toggleMenu(false); });
  window.addEventListener('resize', () => { if(window.innerWidth > 960) toggleMenu(false); }, {passive:true});

  // Smooth progressive scroll reveals; reduced-motion users see all content immediately.
  const revealEls = document.querySelectorAll('[data-reveal]');
  if(reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(el => el.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      for(const entry of entries) {
        if(entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      }
    }, {threshold:0.12, rootMargin:'0px 0px -25px 0px'});
    revealEls.forEach((el, i) => {
      if(el.closest('.expertise-grid')) el.style.transitionDelay = `${Math.min(i % 4, 3) * 80}ms`;
      revealObserver.observe(el);
    });
  }

  // 2.5D hero depth driven by cursor position. Image remains a 2D original photograph.
  if(finePointer && !reduceMotion && heroVisual) {
    const depthLayers = [...heroVisual.querySelectorAll('[data-depth]')];
    let targetX = 0, targetY = 0, curX = 0, curY = 0, running = false;
    const animate = () => {
      curX += (targetX - curX) * .065;
      curY += (targetY - curY) * .065;
      depthLayers.forEach(layer => {
        const depth = Number(layer.dataset.depth);
        const offsetX = (curX * depth * 43).toFixed(2);
        const offsetY = (curY * depth * 32).toFixed(2);
        const rotate = layer.classList.contains('hero-orbit') ? ' rotate(-22deg)' : '';
        layer.style.transform = `translate3d(${offsetX}px,${offsetY}px,0)${rotate}`;
      });
      if(Math.abs(curX - targetX) > .003 || Math.abs(curY - targetY) > .003) {
        requestAnimationFrame(animate);
      } else {
        running = false;
      }
    };
    const request = () => {if(!running){running = true;requestAnimationFrame(animate);}};
    heroVisual.addEventListener('pointermove', (e) => {
      const rect = heroVisual.getBoundingClientRect();
      targetX = ((e.clientX - rect.left) / rect.width - .5) * 2;
      targetY = ((e.clientY - rect.top) / rect.height - .5) * 2;
      request();
    });
    heroVisual.addEventListener('pointerleave', () => { targetX = 0;targetY = 0;request(); });
  }

  if(finePointer && !reduceMotion && glow) {
    let gx = 0, gy = 0, px = 0, py = 0, active = false;
    document.addEventListener('pointermove', e => { gx = e.clientX - 200;gy = e.clientY - 200;glow.style.opacity = '1';if(!active){active=true;requestAnimationFrame(tick);} },{passive:true});
    function tick(){
      px += (gx-px)*.1; py += (gy-py)*.1;
      glow.style.transform = `translate3d(${px}px,${py}px,0)`;
      if(Math.abs(gx-px)+Math.abs(gy-py) > .7) requestAnimationFrame(tick);
      else active=false;
    }
    document.addEventListener('mouseout',e=>{if(!e.relatedTarget) glow.style.opacity='0';});
  }

  // Physical-feeling card perspective, without affecting keyboard navigation.
  if(finePointer && !reduceMotion) {
    document.querySelectorAll('.tilt-card').forEach(card => {
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width -.5;
        const y = (e.clientY - r.top) / r.height -.5;
        card.style.transform = `perspective(950px) rotateY(${(x*7).toFixed(2)}deg) rotateX(${(-y*7).toFixed(2)}deg) translateY(-5px)`;
      });
      card.addEventListener('pointerleave', () => {card.style.transform = '';});
    });
    document.querySelectorAll('.magnetic').forEach(btn => {
      btn.addEventListener('pointermove', e => {
        const r = btn.getBoundingClientRect();
        const dx = (e.clientX - r.left - r.width/2) * .105;
        const dy = (e.clientY - r.top - r.height/2) * .14;
        btn.style.transform = `translate(${dx}px, ${dy}px)`;
      });
      btn.addEventListener('pointerleave', () => btn.style.transform = '');
    });
  }

  // Scroll-snap gallery works with swipe, mouse, keyboard, and buttons.
  const gallery = document.getElementById('galleryScroller');
  const galleryPrev = document.getElementById('galleryPrev');
  const galleryNext = document.getElementById('galleryNext');
  const galleryProgress = document.getElementById('galleryProgress');
  const galleryCount = document.getElementById('galleryCount');
  const galleryCards = gallery.querySelectorAll('.gallery-card');
  function galleryStep(){
    const gap = Number.parseFloat(getComputedStyle(gallery.querySelector('.gallery-track')).gap) || 0;
    return galleryCards[0].getBoundingClientRect().width + gap;
  }
  function updateGallery(){
    const max = gallery.scrollWidth-gallery.clientWidth;
    galleryPrev.disabled = gallery.scrollLeft < 8;
    galleryNext.disabled = gallery.scrollLeft >= max-8;
    const position = Math.min(1,Math.max(0,max > 0 ? gallery.scrollLeft/max : 0));
    galleryProgress.style.width = `${20+position*80}%`;
    const cardIndex = Math.min(5,Math.max(1,Math.round(gallery.scrollLeft/galleryStep())+1));
    galleryCount.textContent = `${String(cardIndex).padStart(2,'0')} — 05`;
  }
  galleryPrev.addEventListener('click',()=>gallery.scrollBy({left:-galleryStep(),behavior:reduceMotion?'instant':'smooth'}));
  galleryNext.addEventListener('click',()=>gallery.scrollBy({left:galleryStep(),behavior:reduceMotion?'instant':'smooth'}));
  gallery.addEventListener('scroll',updateGallery,{passive:true});
  gallery.addEventListener('keydown', e => {
    if(e.key === 'ArrowRight'){ e.preventDefault();galleryNext.click(); }
    if(e.key === 'ArrowLeft'){ e.preventDefault();galleryPrev.click(); }
  });
  window.addEventListener('resize',updateGallery,{passive:true});
  updateGallery();

  // Four alternate cutouts / no portrait is AI-reconstructed or changed.
  const portraits = [
    {src:'images/portrait-seated-olive.webp', alt:'Kawser Hamid in a dark olive-green suit'},
    {src:'images/portrait-seated-burgundy.webp', alt:'Kawser Hamid in a burgundy business suit'},
    {src:'images/portrait-seated-forward.webp', alt:'Kawser Hamid seated forward in a navy suit'},
    {src:'images/portrait-standing-blue-alt.webp', alt:'Kawser Hamid standing in a navy suit'}
  ];
  const portraitImg = document.getElementById('perspectivePortrait');
  const portraitWrap = portraitImg.parentElement;
  const dotButtons = [...document.querySelectorAll('.perspective-dot')];
  let portraitChangeTimer = null;
  dotButtons.forEach((button, index) => {
    button.addEventListener('click', () => {
      if(button.classList.contains('active')) return;
      dotButtons.forEach((dot, i) => {dot.classList.toggle('active',i === index);dot.setAttribute('aria-pressed',String(i===index));});
      clearTimeout(portraitChangeTimer);
      if(!reduceMotion) portraitWrap.classList.add('changing');
      portraitChangeTimer = setTimeout(()=>{
        portraitImg.src = portraits[index].src;
        portraitImg.alt = portraits[index].alt;
        portraitWrap.classList.remove('changing');
      },reduceMotion?0:190);
    });
  });
})();
