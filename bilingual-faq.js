/* English/Bengali visible text switcher and animated FAQ. */
(() => {
  'use strict';
  const faqItems = Array.from(document.querySelectorAll('#faq .v6-faq'));
  let pinned = null;
  const isHover = window.matchMedia('(hover: hover) and (pointer: fine)');
  const states = [];

  function markOpen(state, shouldOpen) {
    state.item.classList.toggle('is-open', shouldOpen);
    state.button.setAttribute('aria-expanded', String(shouldOpen));
    state.content.inert = !shouldOpen;
  }
  function open(state) {
    for (const other of states) if (other !== state) markOpen(other, false);
    if (pinned && pinned !== state) pinned = null;
    markOpen(state, true);
  }
  function close(state) {
    if (pinned !== state) markOpen(state, false);
  }
  faqItems.forEach((item, i) => {
    const summary = item.querySelector('summary');
    const answer = item.querySelector('.v6-answer');
    if (!summary || !answer) return;
    // Native details remain accessible if JavaScript is unavailable.
    const wrapper = document.createElement('div');
    wrapper.className = 'v6-faq';
    wrapper.id = 'faq-question-' + (i + 1);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'v6-faq-trigger';
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', 'faq-answer-' + (i + 1));
    const label = document.createElement('span');
    label.textContent = summary.textContent.trim();
    const icon = document.createElement('span');
    icon.className = 'v6-faq-icon';
    icon.setAttribute('aria-hidden','true');
    icon.textContent = '+';
    button.append(label, icon);
    const content = document.createElement('div');
    content.className = 'v6-faq-content';
    content.id = 'faq-answer-' + (i + 1);
    content.inert = true;
    const clip = document.createElement('div');
    clip.className = 'v6-faq-clip';
    clip.append(answer);
    content.append(clip);
    wrapper.append(button, content);
    item.replaceWith(wrapper);
    const state = {item:wrapper,button,content};
    states.push(state);

    wrapper.addEventListener('pointerenter', () => {
      if (isHover.matches) open(state);
    });
    wrapper.addEventListener('pointerleave', () => {
      if (isHover.matches) close(state);
    });
    wrapper.addEventListener('focusin', () => open(state));
    wrapper.addEventListener('focusout', event => {
      if (!wrapper.contains(event.relatedTarget)) close(state);
    });
    button.addEventListener('click', () => {
      if (pinned === state) {
        pinned = null;
        markOpen(state, false);
      } else {
        pinned = state;
        open(state);
      }
    });
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !pinned) return;
    markOpen(pinned, false);
    pinned = null;
  });

  const dict = window.__KH_BN_DICTIONARY__ || {};
  Object.assign(dict, {
    'Kawser Hamid standing in a navy business suit': 'কাউসার হামিদ নেভি রঙের ব্যবসায়িক স্যুটে দাঁড়িয়ে আছেন',
    'Kawser Hamid seated in a navy suit': 'কাউসার হামিদ নেভি স্যুট পরে বসে আছেন',
    'Portrait of Kawser Hamid': 'কাউসার হামিদের প্রতিকৃতি',
    'Kawser Hamid - back to top': 'কাউসার হামিদ — পৃষ্ঠার শুরুতে যান',
    'Executive Portfolio': 'এক্সিকিউটিভ পোর্টফোলিও',
    '01 / ARRIVAL': '০১ / সূচনা',
    '02 / STORY': '০২ / গল্প',
    '03 / EXPERTISE': '০৩ / দক্ষতা',
    '04 / LEADERSHIP': '০৪ / নেতৃত্ব',
    '05 / SOLUTIONS': '০৫ / সমাধান',
    '06 / PROCESS': '০৬ / প্রক্রিয়া',
    '07 / INSIGHTS': '০৭ / ইনসাইটস',
    '08 / FAQ': '০৮ / সাধারণ প্রশ্ন',
    '09 / CONTACT': '০৯ / যোগাযোগ'
  });
  const switcher = document.getElementById('khLanguageSwitcher');
  const originals = new WeakMap();
  const attributes = new WeakMap();
  const translationAttributes = ['placeholder','aria-label','title','alt'];
  const ignored = new Set(['STYLE','SCRIPT','NOSCRIPT','TEXTAREA']);

  function getCopy(value, language) {
    const clean = String(value).replace(/\s+/g, ' ').trim();
    if (language === 'bn' && Object.hasOwn(dict, clean)) {
      const before = value.match(/^\s*/)?.[0] || '';
      const after = value.match(/\s*$/)?.[0] || '';
      return before + dict[clean] + after;
    }
    return value;
  }
  function translateTree(root, language) {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes=[];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      const parent = node.parentElement;
      if (!parent || ignored.has(parent.tagName) || parent.closest('#khLanguageSwitcher')) continue;
      if (!originals.has(node)) originals.set(node,node.nodeValue);
      const original = originals.get(node);
      const updated = getCopy(original, language);
      if (node.nodeValue !== updated) node.nodeValue = updated;
    }
    const elements = root.querySelectorAll ? [root, ...root.querySelectorAll('*')] : [];
    for (const element of elements) {
      if (!element?.hasAttribute || element.closest('#khLanguageSwitcher')) continue;
      let saved=attributes.get(element);
      if (!saved) {saved={};attributes.set(element,saved);}
      for (const a of translationAttributes) {
        if (!element.hasAttribute(a)) continue;
        if (!Object.hasOwn(saved,a)) saved[a]=element.getAttribute(a);
        const next=getCopy(saved[a],language);
        if (element.getAttribute(a)!==next) element.setAttribute(a,next);
      }
    }
  }
  let current = 'en';
  try {current=localStorage.getItem('kh-portfolio-language')==='bn'?'bn':'en'} catch (_) {}
  function applyLanguage(language, save=true) {
    current=language;
    document.documentElement.lang=language;
    document.body.classList.toggle('kh-bengali',language==='bn');
    translateTree(document.body,language);
    const titleNode=document.querySelector('title');
    if (titleNode) translateTree(titleNode,language);
    if (switcher) switcher.dataset.language = language;
    if (switcher) {
      const label = language==='bn'?'Switch website language to English':'ওয়েবসাইট বাংলায় দেখুন';
      switcher.setAttribute('aria-label',label);
      switcher.setAttribute('title',label);
    }
    if (save) try{localStorage.setItem('kh-portfolio-language',language)}catch(_){}
    document.dispatchEvent(new CustomEvent('portfolio:language-changed',{detail:{language}}));
  }
  switcher?.addEventListener('click', () => applyLanguage(current==='en'?'bn':'en'));
  applyLanguage(current,false);
  // Booking scripts insert messages and change the page title dynamically.
  const dynamicTargets=[
    document.getElementById('bookingResult'),
    document.querySelector('.rail-label'),
    document.querySelector('title')
  ].filter(Boolean);
  for(const target of dynamicTargets){
    const observer=new MutationObserver(() => {
      if(current==='bn') translateTree(target,'bn');
    });
    observer.observe(target,{childList:true,subtree:true});
  }
})();
