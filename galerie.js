// ========= GALERIE COMPLÈTE =========
const $ = (sel, el=document) => el.querySelector(sel);
const $$ = (sel, el=document) => Array.from(el.querySelectorAll(sel));

// ========= NAV / BURGER =========
document.addEventListener('DOMContentLoaded', () => {
  const btn = $('.nav-toggle');
  const nav = $('.site-header .nav');
  
  if (btn && nav) {
    const links = $$('.site-header .nav a');

    function openNav(open){
      nav.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.classList.toggle('menu-open', open);
    }

    btn.addEventListener('click', () => openNav(!nav.classList.contains('open')));
    links.forEach(a => a.addEventListener('click', () => openNav(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') openNav(false); });

    function adjustBurgerVisibility(){
      const isMobile = window.innerWidth <= 980;
      if (!isMobile){
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

  // Year
  const y = $('#year');
  if (y) y.textContent = new Date().getFullYear();
});

// ========= GALERIE COMPLÈTE =========
(async () => {
  const grid = document.getElementById('gallery');
  const sliderWrap = document.getElementById('gallery-slider-wrap');
  const slider = document.getElementById('gallery-slider');
  
  if (!grid) return;

  try {
    const res = await fetch('gallery.json', { cache: 'no-store' });
    const items = await res.json();

    // === CONSTRUIRE LA GRILLE (Desktop/Tablette) - TOUTES LES PHOTOS ===
    const frag = document.createDocumentFragment();

    items.forEach((item, index) => {
      const figure = document.createElement('figure');
      figure.className = 'g-item';
      figure.setAttribute('data-index', index);

      if (item.type === 'video') {
        // VIDÉO avec poster + bouton play
        const btn = document.createElement('button');
        btn.className = 'video-thumb';
        btn.setAttribute('aria-label', item.title || 'Vidéo');
        btn.innerHTML = `
          <img src="${item.poster}" alt="${item.title || 'Vidéo'}" loading="lazy" decoding="async">
          <span class="play-badge" aria-hidden="true">▶</span>
        `;
        
        btn.addEventListener('click', () => {
          openLightbox(items, index);
        });
        
        figure.appendChild(btn);
      } else {
        // IMAGE
        const link = document.createElement('a');
        link.href = item.src;
        link.className = 'g-link';
        link.setAttribute('aria-label', `Voir ${item.alt || 'image'} en grand`);
        
        // Support WebP
        const picture = document.createElement('picture');
        if (item.srcWebp) {
          const sourceWebp = document.createElement('source');
          sourceWebp.srcset = item.srcWebp;
          sourceWebp.type = 'image/webp';
          picture.appendChild(sourceWebp);
        }
        
        const img = document.createElement('img');
        img.src = item.src;
        img.alt = item.alt || '';
        img.loading = 'lazy';
        img.decoding = 'async';
        
        picture.appendChild(img);
        link.appendChild(picture);
        figure.appendChild(link);
        
        // Clic -> lightbox
        link.addEventListener('click', (e) => {
          e.preventDefault();
          openLightbox(items, index);
        });
      }

      frag.appendChild(figure);
    });

    grid.replaceChildren(frag);

    // === MODE MOBILE : Swiper ===
    buildMobileGallery(items);

  } catch (err) {
    console.error('Erreur chargement galerie:', err);
    grid.innerHTML = '<p style="text-align:center;color:#ff4444;">Erreur de chargement</p>';
  }

  // === LIGHTBOX ===
  function openLightbox(items, startIndex) {
    let currentIndex = startIndex;

    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.innerHTML = `
      <button class="lightbox-close" aria-label="Fermer">&times;</button>
      <button class="lightbox-prev" aria-label="Image précédente">‹</button>
      <button class="lightbox-next" aria-label="Image suivante">›</button>
      <div class="lightbox-content"></div>
      <div class="lightbox-counter"></div>
    `;

    document.body.appendChild(lightbox);
    document.body.style.overflow = 'hidden';

    const content = lightbox.querySelector('.lightbox-content');
    const counter = lightbox.querySelector('.lightbox-counter');
    const closeBtn = lightbox.querySelector('.lightbox-close');
    const prevBtn = lightbox.querySelector('.lightbox-prev');
    const nextBtn = lightbox.querySelector('.lightbox-next');

    function showItem(index) {
      currentIndex = index;
      const item = items[index];
      
      if (item.type === 'video') {
        content.innerHTML = `
          <video controls autoplay playsinline poster="${item.poster}">
            <source src="${item.src}" type="video/mp4">
          </video>
        `;
      } else {
        // Support WebP dans la lightbox
        if (item.srcWebp) {
          content.innerHTML = `
            <picture>
              <source srcset="${item.srcWebp}" type="image/webp">
              <img src="${item.src}" alt="${item.alt || ''}">
            </picture>
          `;
        } else {
          content.innerHTML = `<img src="${item.src}" alt="${item.alt || ''}">`;
        }
      }

      counter.textContent = `${index + 1} / ${items.length}`;
      
      if (items.length === 1) {
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
      }
    }

    function close() {
      lightbox.remove();
      document.body.style.overflow = '';
    }

    function next() {
      currentIndex = (currentIndex + 1) % items.length;
      showItem(currentIndex);
    }

    function prev() {
      currentIndex = (currentIndex - 1 + items.length) % items.length;
      showItem(currentIndex);
    }

    closeBtn.addEventListener('click', close);
    nextBtn.addEventListener('click', next);
    prevBtn.addEventListener('click', prev);
    
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) close();
    });

    document.addEventListener('keydown', function keyHandler(e) {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
      if (!document.querySelector('.lightbox')) {
        document.removeEventListener('keydown', keyHandler);
      }
    });

    showItem(currentIndex);
    
    requestAnimationFrame(() => {
      lightbox.classList.add('active');
    });
  }

  // === MOBILE SWIPER ===
  function buildMobileGallery(items) {
    if (!slider || !window.Swiper) return;

    const mq = window.matchMedia('(max-width: 768px)');
    let swiperInstance = null;

    function buildSlider() {
      if (!mq.matches) {
        if (swiperInstance) {
          swiperInstance.destroy(true, true);
          swiperInstance = null;
        }
        sliderWrap.hidden = true;
        return;
      }

      const wrapper = slider.querySelector('.swiper-wrapper');
      wrapper.innerHTML = '';

      items.forEach((item, index) => {
        const slide = document.createElement('div');
        slide.className = 'swiper-slide';
        
        if (item.type === 'video') {
          slide.innerHTML = `
            <button class="slide-video" data-index="${index}">
              <img src="${item.poster}" alt="${item.title || 'Vidéo'}">
              <span class="play-badge">▶</span>
            </button>
          `;
        } else {
          const picture = document.createElement('picture');
          if (item.srcWebp) {
            const sourceWebp = document.createElement('source');
            sourceWebp.srcset = item.srcWebp;
            sourceWebp.type = 'image/webp';
            picture.appendChild(sourceWebp);
          }
          
          const img = document.createElement('img');
          img.src = item.src;
          img.alt = item.alt || '';
          img.loading = 'lazy';
          img.decoding = 'async';
          
          picture.appendChild(img);
          
          const btn = document.createElement('button');
          btn.className = 'slide-img';
          btn.dataset.index = index;
          btn.appendChild(picture);
          
          slide.appendChild(btn);
        }
        
        wrapper.appendChild(slide);
      });

      sliderWrap.hidden = false;
      swiperInstance = new Swiper('#gallery-slider', {
        slidesPerView: 1.15,
        spaceBetween: 16,
        centeredSlides: true,
        loop: items.length > 2,
        pagination: {
          el: '.swiper-pagination',
          clickable: true,
        },
      });

      wrapper.addEventListener('click', (e) => {
        e.preventDefault();
        const btn = e.target.closest('[data-index]');
        if (btn) {
          const index = parseInt(btn.dataset.index);
          openLightbox(items, index);
        }
      });
    }

    buildSlider();
    mq.addEventListener('change', buildSlider);
  }
})();