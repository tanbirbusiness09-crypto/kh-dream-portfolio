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


  // Organic Leadership Branch — scroll moves through paired left/right scenes.
  // Desktop: pinned timeline, reversible 3D depth. Mobile: natural scroll.
  const leadership = document.getElementById('leadership');
  if (leadership) {
    const track = document.getElementById('branchTrack');
    const stage = document.getElementById('branchStage');
    const world = document.getElementById('branchWorld');
    const pairs = [...leadership.querySelectorAll('.branch-pair')];
    const progressEl = document.getElementById('branchProgress');
    const countEl = document.getElementById('branchCount');
    const desktopBranch = window.matchMedia('(min-width: 961px) and (min-height: 720px) and (prefers-reduced-motion: no-preference)');
    const mobileBranch = window.matchMedia('(max-width: 960px), (max-height: 719px)');
    let activeMode = '';
    let frame = 0;
    let observer = null;

    const clip = (v, low, high) => Math.max(low, Math.min(high, v));
    const smoothstep = t => t * t * (3 - 2 * t);

    function drawBranch() {
      frame = 0;
      if (!desktopBranch.matches) return;
      const progress = clip(-track.getBoundingClientRect().top /
        Math.max(1, track.offsetHeight - window.innerHeight), 0, 1);
      const maxShift = Math.max(0, world.offsetHeight - stage.clientHeight);
      const worldY = -maxShift * progress;
      world.style.transform = 'translate3d(0,' + worldY.toFixed(2) + 'px,0)';
      progressEl.style.width = (progress * 100).toFixed(2) + '%';

      const focalY = stage.clientHeight * 0.49;
      let nearest = 0;
      let best = -1;
      pairs.forEach((pair, i) => {
        const cardCenter = pair.offsetTop + pair.offsetHeight * 0.5 + worldY;
        const relative = (cardCenter - focalY) / Math.max(1, stage.clientHeight);
        const focus = smoothstep(clip(1 - Math.abs(relative) * 1.35, 0, 1));
        const fading = 1 - focus;
        pair.style.opacity = String(.13 + focus * .87);
        pair.style.filter = 'blur(' + (fading * 1.4).toFixed(2) + 'px)';
        pair.style.zIndex = String(10 + Math.round(focus * 20));
        pair.classList.toggle('is-current', focus > .65);

        const cards = pair.querySelectorAll('.branch-card');
        cards.forEach((card, side) => {
          const sign = side === 0 ? -1 : 1;
          const shiftX = sign * 32 * fading;
          const shiftY = relative * 35 + fading * (side === 0 ? -15 : 15);
          const shiftZ = -155 * fading;
          const rotateY = sign * (13 * fading + 1.5);
          const rotateX = 6 * fading;
          const scale = 1 - .09 * fading;
          card.style.transform =
            'translate3d(' + shiftX.toFixed(2) + 'px,' + shiftY.toFixed(2) + 'px,' +
            shiftZ.toFixed(2) + 'px) rotateY(' + rotateY.toFixed(2) +
            'deg) rotateX(' + rotateX.toFixed(2) + 'deg) scale(' + scale.toFixed(3) + ')';
        });

        if (focus > best) { best = focus; nearest = i; }
      });
      countEl.innerHTML = String(nearest + 1).padStart(2, '0') +
        ' <i>/ ' + String(pairs.length).padStart(2, '0') + '</i>';
    }

    function requestBranchFrame() {
      if (!desktopBranch.matches || frame) return;
      frame = requestAnimationFrame(drawBranch);
    }

    function setBranchMode() {
      const mode = desktopBranch.matches ? 'desktop' :
        (!reduceMotion && mobileBranch.matches ? 'mobile' : 'static');
      if (mode === activeMode) { requestBranchFrame(); return; }
      activeMode = mode;
      if (observer) { observer.disconnect(); observer = null; }

      leadership.classList.toggle('branch-desktop-ready', mode === 'desktop');
      leadership.classList.toggle('branch-mobile-ready', mode === 'mobile');
      world.style.transform = '';
      pairs.forEach(pair => {
        pair.style.cssText = '';
        pair.classList.remove('is-current', 'is-inview');
        pair.querySelectorAll('.branch-card').forEach(card => { card.style.transform = ''; });
      });
      progressEl.style.width = mode === 'desktop' ? '0%' : '100%';

      if (mode === 'desktop') {
        requestAnimationFrame(drawBranch);
      } else if (mode === 'mobile' && 'IntersectionObserver' in window) {
        observer = new IntersectionObserver(entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-inview');
              observer.unobserve(entry.target);
            }
          });
        }, { rootMargin: '0px 0px -8% 0px', threshold: .1 });
        pairs.forEach(pair => observer.observe(pair));
      } else {
        pairs.forEach(pair => pair.classList.add('is-inview'));
      }
    }

    window.addEventListener('scroll', requestBranchFrame, { passive:true });
    window.addEventListener('resize', () => {
      setBranchMode();
      requestBranchFrame();
    }, { passive:true });
    desktopBranch.addEventListener('change', setBranchMode);
    mobileBranch.addEventListener('change', setBranchMode);
    setBranchMode();
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
