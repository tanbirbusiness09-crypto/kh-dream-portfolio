(() => {
  'use strict';
  const form = document.getElementById('consultationBookingForm');
  if (!form) return;
  const result = document.getElementById('bookingResult');
  const copyButton = document.getElementById('bookingCopy');
  const phoneDestination = '966574047388'; // Existing business WhatsApp shown on the site.
  let lastMessage = '';
  let lastUrl = '';
  const normalize = value => String(value || '').trim().replace(/\s+/g, ' ');
  const get = name => normalize(form.elements.namedItem(name)?.value);
  const phoneValid = number => number.replace(/\D/g, '').length >= 7 && number.replace(/\D/g, '').length <= 15;

  const buildMessage = () => {
    const fields = [
      ['Customer name', get('customerName')],
      ['Email address', get('customerEmail')],
      ['Phone number', get('customerPhone')],
      ['Address', get('customerAddress')],
      ['Consultation topic', get('serviceType')],
    ];
    if (get('customerNote')) fields.push(['Additional details', get('customerNote')]);
    return 'Hello KH Dream Services, I would like to request a consultation with Kawser Hamid.\n\n'
      + fields.map(([label, value]) => label + ': ' + value).join('\n')
      + '\n\nPlease contact me to confirm the booking. Thank you.';
  };
  const showStatus = (html, url) => {
    result.classList.add('is-visible');
    result.innerHTML = html + (url ? '<a href="' + url + '" target="_blank" rel="noopener noreferrer">Open WhatsApp request again ↗</a>' : '');
    result.setAttribute('role', 'status');
  };

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const phone = get('customerPhone');
    if (!phoneValid(phone)) {
      const field = form.elements.namedItem('customerPhone');
      field.setCustomValidity('Enter a valid phone number with 7–15 digits, including country code if needed.');
      field.reportValidity();
      return;
    }
    const consent = form.elements.namedItem('bookingConsent');
    if (!consent.checked) {
      consent.focus();
      return;
    }

    lastMessage = buildMessage();
    lastUrl = 'https://wa.me/' + phoneDestination + '?text=' + encodeURIComponent(lastMessage);
    // The open is initiated synchronously by a real submit gesture.
    const bookingLink = document.createElement('a');
    bookingLink.href = lastUrl;
    bookingLink.target = '_blank';
    bookingLink.rel = 'noopener noreferrer';
    bookingLink.style.display = 'none';
    document.body.appendChild(bookingLink);
    bookingLink.click();
    bookingLink.remove();
    showStatus('<strong>Request prepared.</strong> Your details are ready in WhatsApp. Tap <b>Send</b> there to submit the booking request. Our team must confirm an appointment before it is booked.<br>', lastUrl);
  });

  form.elements.namedItem('customerPhone').addEventListener('input', function () {
    this.setCustomValidity('');
  });
  form.addEventListener('input', () => {
    if (result.classList.contains('is-visible')) {
      result.classList.remove('is-visible');
      result.textContent = '';
    }
  });

  copyButton?.addEventListener('click', async () => {
    if (!form.reportValidity()) return;
    const phone = get('customerPhone');
    if (!phoneValid(phone)) {
      const field = form.elements.namedItem('customerPhone');
      field.setCustomValidity('Enter a valid phone number.');
      field.reportValidity();
      return;
    }
    lastMessage = buildMessage();
    try {
      await navigator.clipboard.writeText(lastMessage);
      showStatus('<strong>Details copied.</strong> You can paste your consultation request into WhatsApp or email. Copying does not submit a booking.', '');
    } catch (_) {
      showStatus('Automatic copy is unavailable in this browser. Please use the WhatsApp button to prepare your booking request.', '');
    }
  });
})();
