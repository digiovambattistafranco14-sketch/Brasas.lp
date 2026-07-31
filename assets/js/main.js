/* ============================================================
   Brasas.lp — interacciones
   Vanilla JS, sin dependencias. ~4 kB.
   ============================================================ */
(() => {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Año del pie ---------- */
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Nav pegajosa ---------- */
  const nav = document.getElementById('nav');
  if (nav) {
    const sentinel = document.createElement('div');
    sentinel.style.cssText = 'position:absolute;top:0;height:1px;width:1px';
    document.body.prepend(sentinel);
    new IntersectionObserver(
      ([e]) => nav.classList.toggle('is-stuck', !e.isIntersecting),
      { rootMargin: '-8px 0px 0px 0px' }
    ).observe(sentinel);
  }

  /* ---------- Fundido de imágenes al cargar ---------- */
  const fadeIn = (img) => {
    if (img.complete && img.naturalWidth) img.classList.add('is-loaded');
    else img.addEventListener('load', () => img.classList.add('is-loaded'), { once: true });
    img.addEventListener('error', () => img.classList.add('is-loaded'), { once: true });
  };
  document.querySelectorAll('.frame img, .slide__img img').forEach(fadeIn);

  /* ---------- Aparición al hacer scroll ---------- */
  const revealables = document.querySelectorAll('.reveal');
  revealables.forEach((el) => {
    const d = el.dataset.delay;
    if (d) el.style.setProperty('--d', d);
  });

  if (reduced.matches || !('IntersectionObserver' in window)) {
    revealables.forEach((el) => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.06 });
    revealables.forEach((el) => io.observe(el));
  }

  /* ============================================================
     Carrusel
     - avance automático suave y continuo
     - flechas, puntos, teclado y arrastre táctil
     - bucle infinito real mediante una diapositiva clonada
     ============================================================ */
  const root = document.querySelector('[data-carousel]');
  if (!root) return;

  const frame = root.querySelector('.carousel__frame');
  const track = root.querySelector('.carousel__track');
  const slides = Array.from(track.children);
  const total = slides.length;
  if (!total) return;

  const btnPrev = document.querySelector('[data-carousel-prev]');
  const btnNext = document.querySelector('[data-carousel-next]');
  const elCurrent = document.querySelector('[data-carousel-current]');
  const elTotal = document.querySelector('[data-carousel-total]');
  const caption = document.getElementById('carousel-caption');
  const dotsBox = document.querySelector('.gallery__dots');
  const bar = root.querySelector('[data-carousel-progress]');
  const DUR = Number(root.dataset.interval) || 4800;
  root.style.setProperty('--dur', DUR + 'ms');

  /* clon de la primera para que el salto final sea invisible */
  const clone = slides[0].cloneNode(true);
  clone.setAttribute('aria-hidden', 'true');
  clone.classList.add('is-clone');
  track.appendChild(clone);
  clone.querySelectorAll('img').forEach(fadeIn);

  let position = 0;          // 0 … total (total = clon)
  let width = frame.clientWidth;
  let timer = null;
  let visible = true;
  let paused = false;
  let dragging = false;
  let startX = 0, startY = 0, deltaX = 0, axis = null;

  const logical = () => position % total;

  const setTransform = (px, animate) => {
    track.classList.toggle('is-animating', !!animate);
    track.style.transform = `translate3d(${px}px,0,0)`;
  };

  const restartProgress = () => {
    if (!bar) return;
    bar.classList.remove('is-running');
    if (paused || !visible || reduced.matches) return;
    void bar.offsetWidth; // reinicia la animación
    bar.classList.add('is-running');
  };

  const paintUI = () => {
    const i = logical();
    if (elCurrent) elCurrent.textContent = String(i + 1);

    slides.forEach((s, k) => s.setAttribute('aria-hidden', k === i ? 'false' : 'true'));

    if (dotsBox) {
      Array.from(dotsBox.children).forEach((d, k) => {
        if (k === i) d.setAttribute('aria-current', 'true');
        else d.removeAttribute('aria-current');
      });
    }

    if (caption) {
      const text = slides[i].dataset.caption || '';
      if (caption.textContent === text) return;
      caption.classList.add('is-out');
      setTimeout(() => {
        caption.textContent = text;
        caption.classList.remove('is-out');
      }, reduced.matches ? 0 : 260);
    }
  };

  const goTo = (next, animate = true) => {
    position = next;
    setTransform(-position * width, animate);
    paintUI();
    restartProgress();
  };

  const next = () => goTo(position + 1);

  const prev = () => {
    if (position === 0) {
      // salto instantáneo al clon del final y vuelta animada hacia atrás
      position = total;
      setTransform(-position * width, false);
      void track.offsetWidth;
      requestAnimationFrame(() => goTo(total - 1));
      return;
    }
    goTo(position - 1);
  };

  /* al terminar la transición sobre el clon, se reubica en la primera */
  track.addEventListener('transitionend', (e) => {
    if (e.propertyName !== 'transform') return;
    if (position === total) {
      position = 0;
      setTransform(0, false);
    }
  });

  /* ---------- Reproducción automática ---------- */
  const stop = () => { clearTimeout(timer); timer = null; };

  const play = () => {
    stop();
    if (paused || !visible || dragging || reduced.matches || total < 2) return;
    timer = setTimeout(() => { next(); play(); }, DUR);
  };

  const restart = () => { stop(); play(); restartProgress(); };

  /* ---------- Controles ---------- */
  btnNext?.addEventListener('click', () => { next(); restart(); });
  btnPrev?.addEventListener('click', () => { prev(); restart(); });

  if (dotsBox) {
    if (elTotal) elTotal.textContent = String(total);
    slides.forEach((_, k) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', `Ir a la foto ${k + 1} de ${total}`);
      b.addEventListener('click', () => {
        if (k === logical()) return;
        goTo(k);
        restart();
      });
      dotsBox.appendChild(b);
    });
  }

  /* teclado: flechas cuando el carrusel o sus controles tienen foco */
  const keyScope = root.closest('.gallery') || root;
  keyScope.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); next(); restart(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); restart(); }
  });

  /* pausa al pasar el mouse o al enfocar */
  const setPaused = (v) => { paused = v; v ? stop() : play(); restartProgress(); };
  /* sólo con mouse: en táctil no hay "salir del elemento" y quedaría pausado */
  root.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') setPaused(true); });
  root.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') setPaused(false); });
  /* sólo pausa por foco de teclado: un click en la flecha no debe frenar todo */
  keyScope.addEventListener('focusin', (e) => {
    if (e.target.matches?.(':focus-visible')) setPaused(true);
  });
  keyScope.addEventListener('focusout', (e) => {
    if (!keyScope.contains(e.relatedTarget)) setPaused(false);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else { play(); restartProgress(); }
  });

  /* no gastar ciclos si no está en pantalla; al acercarse, se precargan las fotos
     que todavía no entraron para que ninguna aparezca borrosa al deslizar */
  let warmed = false;
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && !warmed) {
      warmed = true;
      track.querySelectorAll('img[loading="lazy"]').forEach((img) => { img.loading = 'eager'; });
    }
    visible ? (play(), restartProgress()) : stop();
  }, { threshold: 0.25, rootMargin: '400px 0px' }).observe(root);

  /* ---------- Arrastre / swipe ---------- */
  frame.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    dragging = true; axis = null; deltaX = 0;
    startX = e.clientX; startY = e.clientY;
    stop();
    track.classList.remove('is-animating');
    bar?.classList.remove('is-running');
  });

  frame.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (!axis) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (axis === 'x') frame.setPointerCapture?.(e.pointerId);
    }
    if (axis !== 'x') return;

    e.preventDefault();
    // resistencia en los extremos del recorrido
    deltaX = dx;
    setTransform(-position * width + deltaX * 0.92, false);
  });

  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    const threshold = Math.min(90, width * 0.16);
    if (axis === 'x' && Math.abs(deltaX) > threshold) {
      deltaX < 0 ? next() : prev();
    } else {
      goTo(position);
    }
    axis = null; deltaX = 0;
    restart();
  };

  frame.addEventListener('pointerup', endDrag);
  frame.addEventListener('pointercancel', endDrag);
  frame.addEventListener('dragstart', (e) => e.preventDefault());

  /* ---------- Reajuste ---------- */
  const onResize = () => {
    const w = frame.clientWidth;
    if (w === width) return;
    width = w;
    setTransform(-position * width, false);
  };
  if ('ResizeObserver' in window) new ResizeObserver(onResize).observe(frame);
  else window.addEventListener('resize', onResize);

  reduced.addEventListener?.('change', () => { restart(); });

  /* ---------- Arranque ---------- */
  goTo(0, false);
  play();
})();
