/* Executive Dimension 5.0 — progressive enhancement / GSAP is optional */
(() => {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = window.matchMedia('(min-width: 921px) and (hover: hover) and (pointer: fine)');
  const gs = window.gsap;
  const st = window.ScrollTrigger;
  const root = document.querySelector('#hero');
  const halo = root?.querySelector('.v6-backdrop-layer');
  // Do not reanimate existing portrait transforms: script.js owns mouse-parallax.
  // GSAP changes only newly-added elements, avoiding competing transform writes.
  if (gs && st && !reduce.matches) {
    gs.registerPlugin(st);
    gs.defaults({ease: 'power3.out'});
    const mm = gs.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gs.utils.toArray('.v6-motion-title').forEach(el => {
        gs.from(el, {autoAlpha:0, y:35, duration:0.9, ease:'power3.out',
          scrollTrigger:{trigger:el,start:'top 88%',once:true}});
      });
      gs.utils.toArray('.v6-motion-card').forEach((el,i) => {
        gs.from(el, {autoAlpha:0,y:48,rotationX:3,duration:.92,
          delay:(i%3)*.07,clearProps:'transform,opacity,visibility',
          scrollTrigger:{trigger:el,start:'top 90%',once:true}});
      });
      if(halo) gs.to(halo,{yPercent:-11,ease:'none',
        scrollTrigger:{trigger:root,start:'top top',end:'bottom top',scrub:1.2}});
      const line=document.querySelector('.v6-journey-cards');
      if(line) gs.from(line,{opacity:.65,duration:1,
        scrollTrigger:{trigger:line,start:'top 80%',once:true}});
      return () => {};
    });
    mm.add('(min-width:921px) and (prefers-reduced-motion: no-preference)', () => {
      gs.utils.toArray('.v6-insight').forEach((card,i)=>{
        gs.to(card,{y:i%2===0?-13:-24,ease:'none',
          scrollTrigger:{trigger:'#insights',start:'top bottom',end:'bottom top',scrub:1}});
      });
    });
  }
  // Fallback and performance: native scrolling always remains functional.
  if (desktop.matches && !reduce.matches) {
    document.querySelectorAll('.v6-focus').forEach(card => {
      let frame=0,x=50,y=25;
      card.addEventListener('pointermove', ev => {
        const box=card.getBoundingClientRect();
        x=Math.min(100,Math.max(0,(ev.clientX-box.left)/box.width*100));
        y=Math.min(100,Math.max(0,(ev.clientY-box.top)/box.height*100));
        if(frame) return;
        frame=requestAnimationFrame(()=>{
          frame=0;
          card.style.setProperty('--v6-light-x',x.toFixed(1)+'%');
          card.style.setProperty('--v6-light-y',y.toFixed(1)+'%');
        });
      },{passive:true});
      card.addEventListener('pointerleave',()=>{
        card.style.removeProperty('--v6-light-x');
        card.style.removeProperty('--v6-light-y');
      });
    });
  }
  const form=document.getElementById('consultationBookingForm');
  const date=form?.elements.namedItem('preferredDate');
  if(date) {
    // ISO date in the user's browser; availability is NOT guaranteed.
    const day=new Date();
    const yr=day.getFullYear(), mo=String(day.getMonth()+1).padStart(2,'0'), dt=String(day.getDate()).padStart(2,'0');
    date.min=yr+'-'+mo+'-'+dt;
  }
  // Semantic analytics events with no PII; an analytics provider can subscribe later.
  document.querySelectorAll('a[href="/booking"]').forEach(a=>{
    a.addEventListener('click',()=>document.dispatchEvent(new CustomEvent('portfolio:booking-open',{detail:{source:a.closest('header')?'header':'content'}})));
  });
})();
