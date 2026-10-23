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

  // Leadership scroll narrative: pinned reversible 2.5D sequence on desktop.
  // On mobile and for reduced-motion, chapters remain normal document content.
  const leadership = document.getElementById('leadership');
  if (leadership) {
    const track = document.getElementById('leadershipScrollTrack');
    const stage = document.getElementById('leadershipStage');
    const scenes = [...leadership.querySelectorAll('.leadership-scene')];
    const progressBar = document.getElementById('leadershipProgress');
    const count = document.getElementById('leadershipCount');
    const desktopScenes = window.matchMedia('(min-width: 961px) and (prefers-reduced-motion: no-preference)');
    const mobileScenes = window.matchMedia('(max-width: 960px) and (prefers-reduced-motion: no-preference)');
    let chapterObserver = null;
    let currentMode = '';
    let scrollFrame = 0;

    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
    const ease = t => t * t * (3 - 2 * t);

    function updateLeadershipScroll() {
      scrollFrame = 0;
      if (!desktopScenes.matches) return;
      const rect = track.getBoundingClientRect();
      const travel = Math.max(1, track.offsetHeight - window.innerHeight);
      const progress = clamp(-rect.top / travel, 0, 1);
      const position = progress * (scenes.length - 1);
      const nearest = clamp(Math.round(position), 0, scenes.length - 1);

      // Scroll distance drives perspective, depth, and opposing exit/entrance.
      scenes.forEach((scene, i) => {
        const relative = i - position;
        const distance = Math.abs(relative);
        const direction = Math.sign(relative);
        const visible = distance < 1.15;
        const amount = ease(clamp(distance, 0, 1));
        const x = relative * 32;
        const y = distance * 35;
        const z = -amount * 440;
        const rotation = -direction * amount * 23;
        const tilt = amount * 6;
        const scale = 1 - amount * .13;
        scene.style.transform = `translate3d(${x.toFixed(2)}vw, ${y.toFixed(1)}px, ${z.toFixed(0)}px) rotateY(${rotation.toFixed(1)}deg) rotateX(${tilt.toFixed(1)}deg) scale(${scale.toFixed(3)})`;
        scene.style.opacity = String(visible ? clamp(1 - amount * .99, 0, 1) : 0);
        scene.style.zIndex = String(100 - Math.round(distance * 10));
        scene.classList.toggle('is-current', i === nearest);
      });
      progressBar.style.width = `${(progress * 100).toFixed(2)}%`;
      count.innerHTML = `${String(nearest + 1).padStart(2, '0')} <i>/ ${String(scenes.length).padStart(2, '0')}</i>`;
      stage.style.setProperty('--story-progress', String(progress));
    }

    function requestLeadershipFrame() {
      if (!desktopScenes.matches || scrollFrame) return;
      scrollFrame = window.requestAnimationFrame(updateLeadershipScroll);
    }

    function configureLeadershipMode() {
      const nextMode = desktopScenes.matches ? 'desktop' : mobileScenes.matches ? 'mobile' : 'static';
      if (nextMode === currentMode) {
        requestLeadershipFrame();
        return;
      }
      currentMode = nextMode;
      if (chapterObserver) { chapterObserver.disconnect(); chapterObserver = null; }
      leadership.classList.toggle('leadership-3d-ready', nextMode === 'desktop');
      leadership.classList.toggle('leadership-mobile-ready', nextMode === 'mobile');
      scenes.forEach(scene => {
        scene.removeAttribute('style');
        scene.classList.remove('is-inview');
        scene.classList.remove('is-current');
      });
      progressBar.style.width = nextMode === 'desktop' ? '0%' : '100%';
      count.innerHTML = `01 <i>/ ${String(scenes.length).padStart(2, '0')}</i>`;
      if (nextMode === 'desktop') {
        updateLeadershipScroll();
      } else if (nextMode === 'mobile' && 'IntersectionObserver' in window) {
        chapterObserver = new IntersectionObserver(entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-inview');
              chapterObserver.unobserve(entry.target);
            }
          });
        }, { rootMargin: '0px 0px -8% 0px', threshold: .12 });
        scenes.forEach(scene => chapterObserver.observe(scene));
      } else {
        scenes.forEach(scene => scene.classList.add('is-inview'));
      }
    }

    window.addEventListener('scroll', requestLeadershipFrame, { passive: true });
    window.addEventListener('resize', () => {
      configureLeadershipMode();
      requestLeadershipFrame();
    }, { passive: true });
    desktopScenes.addEventListener('change', configureLeadershipMode);
    mobileScenes.addEventListener('change', configureLeadershipMode);
    configureLeadershipMode();
  }

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
