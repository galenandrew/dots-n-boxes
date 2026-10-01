// A one-shot confetti burst drawn on a temporary full-screen canvas.
(function (root) {
  'use strict';

  const COUNT = 200;
  const DURATION = 4000; // ms until the canvas is removed
  const FADE_START = 0.6; // fraction of DURATION after which pieces fade out
  const GRAVITY = 0.3;
  const DRAG = 0.98;

  // Bursts confetti from viewport point (x, y) using the given colors.
  function launchConfetti({ x, y, colors }) {
    if (root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const canvas = document.createElement('canvas');
    canvas.className = 'confetti';
    canvas.setAttribute('aria-hidden', 'true');
    const dpr = root.devicePixelRatio || 1;
    canvas.width = root.innerWidth * dpr;
    canvas.height = root.innerHeight * dpr;
    document.body.append(canvas);

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const pieces = Array.from({ length: COUNT }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 12;
      return {
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 6, // bias upward so it arcs like an explosion
        width: 6 + Math.random() * 6,
        height: 10 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.3,
        flutter: Math.random() * Math.PI * 2,
      };
    });

    const start = performance.now();
    let last = start;

    function frame(now) {
      const elapsed = now - start;
      const dt = Math.min((now - last) / 16.67, 3); // in 60fps frames; capped after tab switches
      last = now;

      const fade = Math.max(0, (elapsed / DURATION - FADE_START) / (1 - FADE_START));
      ctx.clearRect(0, 0, root.innerWidth, root.innerHeight);
      ctx.globalAlpha = 1 - fade;

      for (const p of pieces) {
        p.vx *= DRAG ** dt;
        p.vy = p.vy * DRAG ** dt + GRAVITY * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rotation += p.spin * dt;
        p.flutter += 0.15 * dt;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.scale(1, Math.cos(p.flutter)); // flip over as it falls
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
        ctx.restore();
      }

      if (elapsed < DURATION) {
        requestAnimationFrame(frame);
      } else {
        canvas.remove();
      }
    }

    requestAnimationFrame(frame);
  }

  root.launchConfetti = launchConfetti;
})(this);
