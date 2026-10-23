# Kawser Hamid — Executive Dimension

A responsive, cinematic 3D-style executive portfolio, built using the 13 original user-provided images. No build step, framework, paid APIs, or CDN is required.

## Quick start — Windows

1. Unzip the project.
2. **Recommended:** Double-click `START_WINDOWS.bat` (Node.js installed) or open a terminal here and run `npm start`; visit `http://localhost:3000`. No `npm install` is required.
3. Or double-click `index.html` to preview without a server. All core interactions work as-is. You may also use VS Code Live Server.

## Deploy

Upload everything, including `images/`, `styles.css`, `script.js`, and `index.html`, into your Hostinger `public_html` directory. This is a static site and does not need Node.js in production. It can also deploy directly on Vercel or Netlify as a static project.

## Content and links

- Main content: `index.html`
- Layout/typography/responsive styles: `styles.css`
- Interactions: `script.js`
- User images: `images/*.webp` (optimized copies; original PNGs remain unchanged in your uploads)
- Booking button: opens WhatsApp at `+966 57 404 7388` (the known KH Dream Services contact number). Change it if personal-consultancy enquiries should go to another number.
- Company website button: `https://khdreamservices.com`.
- Gallery photographs are used for visual storytelling. Verify any claims about specific meetings or events before publishing.

## Included interactions

- Mouse-following multi-depth hero portrait, rings and labels
- Premium button interactions
- Perspective tilt cards with motion-reduction support
- Scroll-triggered reveals via IntersectionObserver
- Touch/keyboard accessible scrolling leadership gallery with arrow buttons
- Perspective portrait switcher (four suit variations)
- Responsive mobile navigation, sticky transparent/glass header
- Reduced-motion and touch-device fallbacks

## Notes

The pictures are 2D image cutouts; this creates a 2.5D parallax look, not a rotatable 3D human model. Contact CTAs work; this standalone build does not claim to provide a backend booking calendar or CMS. No invented statistics or testimonials are included.
