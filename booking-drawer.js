/* Side-drawer booking with a real, shareable /booking URL.
   Keeping booking in the same document preserves the animated portfolio behind it. */
(() => {
  'use strict';
  const overlay = document.getElementById('bookingOverlay');
  const dialog = document.getElementById('bookingDrawer');
  const closeButton = document.getElementById('bookingDrawerClose');
  const backdrop = document.getElementById('bookingBackdrop');
  const site = document.querySelector('.site-shell');
  if (!overlay || !dialog || !closeButton || !backdrop) return;

  const pageTitle = document.title;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const isBookingRoute = () => /^\/booking\/?$/.test(location.pathname);
  let lastTrigger = null;
  let closingTimer = 0;
  let opened = false;

  function focusClose() {
    if (opened) closeButton.focus({preventScroll:true});
  }

  function displayBooking(visible) {
    if (visible === opened) return;
    opened = visible;
    clearTimeout(closingTimer);
    if (visible) {
      overlay.hidden = false;
      dialog.inert = false;
      document.body.classList.add('booking-drawer-open');
      site?.setAttribute('inert', '');
      document.title = 'Book a Consultation | Kawser Hamid';
      requestAnimationFrame(() => {
        if (!opened) return;
        overlay.classList.add('is-active');
        requestAnimationFrame(focusClose);
      });
    } else {
      overlay.classList.remove('is-active');
      document.body.classList.remove('booking-drawer-open');
      site?.removeAttribute('inert');
      dialog.inert = true;
      document.title = pageTitle;
      const trigger = lastTrigger;
      const finish = () => {
        if (opened) return;
        overlay.hidden = true;
        if (trigger?.isConnected) trigger.focus({preventScroll:true});
      };
      if (reducedMotion.matches) finish();
      else closingTimer = window.setTimeout(finish, 440);
    }
  }

  function openBooking(trigger) {
    if (trigger) lastTrigger = trigger;
    const menuToggle = document.getElementById('menuToggle');
    if (menuToggle?.getAttribute('aria-expanded') === 'true') menuToggle.click();
    if (!isBookingRoute()) {
      // Using pushState changes the visible URL without unloading the portfolio.
      history.pushState({
        ...(history.state || {}),
        bookingDrawer: true,
        bookingPreviousUrl: location.pathname + location.search + location.hash
      }, '', '/booking' + location.search);
    }
    displayBooking(true);
  }

  function closeBooking() {
    if (!isBookingRoute()) {
      displayBooking(false);
      return;
    }
    if (history.state?.bookingDrawer && history.state?.bookingPreviousUrl) {
      history.back();
    } else {
      // A visitor who opens /booking directly should return to the homepage,
      // not be bounced to an unknown prior website.
      history.replaceState({}, '', '/' + location.search);
      displayBooking(false);
    }
  }

  document.addEventListener('click', event => {
    const trigger = event.target.closest('a[href]');
    if (!trigger || trigger.origin !== location.origin || !/^\/booking\/?$/.test(trigger.pathname)) return;
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    openBooking(trigger);
  });

  closeButton.addEventListener('click', closeBooking);
  backdrop.addEventListener('click', closeBooking);

  document.addEventListener('keydown', event => {
    if (!opened) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeBooking();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusables = [...dialog.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
      .filter(node => !node.inert && node.getClientRects().length > 0);
    if (!focusables.length) {
      event.preventDefault();
      dialog.focus();
      return;
    }
    const first = focusables[0], last = focusables[focusables.length - 1];
    if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
      event.preventDefault();
      first.focus();
    }
  });

  window.addEventListener('popstate', () => displayBooking(isBookingRoute()));

  // /booking is also a valid direct link, including reload and shared links.
  displayBooking(isBookingRoute());
})();