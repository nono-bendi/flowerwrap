// ========= helpers =========
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));

// ========= NAV / BURGER =========
document.addEventListener('DOMContentLoaded', () => {
  const btn = $('.nav-toggle');
  const nav = $('.site-header .nav');

  if (btn && nav) {
    const links = $$('.site-header .nav a');

    function openNav(open) {
      nav.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.classList.toggle('menu-open', open);
    }

    btn.addEventListener('click', () => openNav(!nav.classList.contains('open')));
    links.forEach(a => a.addEventListener('click', () => openNav(false)));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') openNav(false); });

    function adjustBurgerVisibility() {
      const isMobile = window.innerWidth <= 980;
      if (!isMobile) {
        btn.style.display = 'none';
        btn.setAttribute('aria-hidden', 'true');
        if (nav.classList.contains('open')) openNav(false);
      } else {
        btn.style.display = '';
        btn.removeAttribute('aria-hidden');
      }
    }
    window.addEventListener('resize', adjustBurgerVisibility);
    adjustBurgerVisibility();
  }

  // Year (footer)
  const y = $('#year');
  if (y) y.textContent = new Date().getFullYear();
});

// ========= GALERIE =========
(async () => {
  const grid       = document.getElementById('gallery');
  const sliderWrap = document.getElementById('gallery-slider-wrap'); // peut ne pas exister selon la page
  const sliderEl   = document.getElementById('gallery-slider');

  if (!grid) return;

  try {
    const res = await fetch('gallery.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const items = await res.json();

    // --- constantes utilisées par makeFigure / slider (déclarées AVANT) ---
    const SIZES_GRID  = '(max-width:600px) 50vw, (max-width:1024px) 33vw, 33vw';
    const SIZES_SLIDE = '(max-width:768px) 90vw, 60vw';

    // util: construit le srcset à partir de "img/car/xxx.webp"
    function buildSrcset(src) {
      const i = src.lastIndexOf('/');
      const dir = src.slice(0, i);       // "img/car"
      const file = src.slice(i + 1);     // "xxx.webp"
      return [
        `${dir}/800w/${file} 800w`,
        `${dir}/1280w/${file} 1280w`,
        `${dir}/1600w/${file} 1600w`,
        `${src} 2000w`
      ].join(', ');
    }

    function makeFigure(item, index) {
      const fig = document.createElement('figure');
      fig.className = 'gallery-item';
      fig.dataset.index = index;

      if (item.type === 'video') {
        const btn = document.createElement('button');
        btn.className = 'video-thumb';
        btn.setAttribute('aria-label', item.title || 'Vidéo');
        btn.innerHTML = `
          <img src="${item.poster}" alt="${item.title || 'Vidéo'}" loading="lazy" decoding="async">
          <span class="play-badge" aria-hidden="true">▶</span>
        `;
        btn.addEventListener('click', () => openLightbox(index));
        fig.appendChild(btn);
        return fig;
      }

      // image
      const a = document.createElement('a');
      a.href = item.src;
      a.className = 'g-link';
      a.setAttribute('aria-label', `Voir ${item.alt || 'image'} en grand`);

      const img = document.createElement('img');
      img.alt = item.alt || '';
      img.loading = 'lazy';
      img.decoding = 'async';
      img.src = item.src;                       // fallback
      img.srcset = buildSrcset(item.src);
      img.sizes = SIZES_GRID;
      img.addEventListener('load', () => fig.classList.add('loaded'), { once: true });

      a.appendChild(img);
      a.addEventListener('click', e => { e.preventDefault(); openLightbox(index); });

      fig.appendChild(a);
      return fig;
    }

    async function buildGridResponsive(container, items) {
      // rendu progressif pour garder l’UI fluide
      const BATCH = 12;
      for (let i = 0; i < items.length; i += BATCH) {
        const slice = items.slice(i, i + BATCH);
        const frag = document.createDocumentFragment();
        slice.forEach((item, k) => frag.appendChild(makeFigure(item, i + k)));
        container.appendChild(frag);
        await new Promise(r => (window.requestIdleCallback
          ? requestIdleCallback(r, { timeout: 120 })
          : setTimeout(r, 40)));
      }
    }

    // --- construction de la grille ---
    await buildGridResponsive(grid, items);

    // ===== Lightbox =====
    function openLightbox(startIndex = 0) {
      let current = startIndex;

      const root = document.createElement('div');
      root.className = 'lightbox';
      root.innerHTML = `
        <button class="lightbox-close" aria-label="Fermer">&times;</button>
        <button class="lightbox-prev"  aria-label="Image précédente">‹</button>
        <button class="lightbox-next"  aria-label="Image suivante">›</button>
        <div class="lightbox-content"></div>
        <div class="lightbox-counter"></div>
      `;
      document.body.appendChild(root);
      document.body.style.overflow = 'hidden';

      const content = root.querySelector('.lightbox-content');
      const counter = root.querySelector('.lightbox-counter');

      function show(i) {
        current = (i + items.length) % items.length;
        const it = items[current];
        if (it.type === 'video') {
          content.innerHTML = `
            <video controls autoplay playsinline poster="${it.poster}">
              <source src="${it.src}" type="video/mp4">
            </video>`;
        } else {
          content.innerHTML = `<img src="${it.src}" alt="${it.alt || ''}">`;
        }
        counter.textContent = `${current + 1} / ${items.length}`;
      }

      function close() { root.remove(); document.body.style.overflow = ''; }
      function next()  { show(current + 1); }
      function prev()  { show(current - 1); }

      root.querySelector('.lightbox-close').addEventListener('click', close);
      root.querySelector('.lightbox-next').addEventListener('click', next);
      root.querySelector('.lightbox-prev').addEventListener('click', prev);
      root.addEventListener('click', e => { if (e.target === root) close(); });

      const keyHandler = (e) => {
        if (e.key === 'Escape') close();
        if (e.key === 'ArrowRight') next();
        if (e.key === 'ArrowLeft') prev();
        if (!document.body.contains(root)) document.removeEventListener('keydown', keyHandler);
      };
      document.addEventListener('keydown', keyHandler);

      show(current);
      requestAnimationFrame(() => root.classList.add('active'));
    }

    // ===== Slider mobile (si présent dans la page) =====
    function buildMobileGallery(items) {
      if (!sliderEl || !window.Swiper) return;

      const mq = window.matchMedia('(max-width: 768px)');
      let swiper = null;

      function rebuild() {
        if (!mq.matches) {
          if (swiper) { swiper.destroy(true, true); swiper = null; }
          if (sliderWrap) sliderWrap.hidden = true;
          return;
        }

        const wrapper = sliderEl.querySelector('.swiper-wrapper');
        wrapper.innerHTML = '';

        items.forEach((item, idx) => {
          const slide = document.createElement('div');
          slide.className = 'swiper-slide';

          if (item.type === 'video') {
            slide.innerHTML = `
              <button class="slide-video" data-index="${idx}">
                <img src="${item.poster}" alt="${item.title || 'Vidéo'}" loading="lazy" decoding="async">
                <span class="play-badge">▶</span>
              </button>`;
          } else {
            const btn = document.createElement('button');
            btn.className = 'slide-img';
            btn.dataset.index = idx;

            const img = document.createElement('img');
            img.alt = item.alt || '';
            img.loading = 'lazy';
            img.decoding = 'async';
            img.src = item.src;
            img.srcset = buildSrcset(item.src);
            img.sizes = SIZES_SLIDE;

            btn.appendChild(img);
            slide.appendChild(btn);
          }

          wrapper.appendChild(slide);
        });

        if (sliderWrap) sliderWrap.hidden = false;
        swiper = new Swiper('#gallery-slider', {
          slidesPerView: 1.15,
          spaceBetween: 16,
          centeredSlides: true,
          loop: items.length > 2,
          pagination: { el: '.swiper-pagination', clickable: true }
        });

        wrapper.addEventListener('click', (e) => {
          const t = e.target.closest('[data-index]');
          if (t) openLightbox(parseInt(t.dataset.index, 10));
        });
      }

      rebuild();
      mq.addEventListener('change', rebuild);
    }

    // --- slider (si dispo) ---
    buildMobileGallery(items);

  } catch (err) {
    console.error('Erreur chargement galerie:', err);
    grid.innerHTML = '<p style="text-align:center;color:#ff4444;">Erreur de chargement</p>';
  }
})();
