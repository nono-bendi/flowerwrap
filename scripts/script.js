// ========= helpers =========
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

  // ========= YEAR FOOTER =========
  const y = $('#year');
  if (y) y.textContent = new Date().getFullYear();

  // ========= SCROLL TO (GSAP) =========
  if (window.gsap && window.ScrollToPlugin) {
    gsap.registerPlugin(ScrollToPlugin);
    const linksHash = $$('a[href^="#"]');
    linksHash.forEach(link => {
      link.addEventListener('click', e => {
        const href = link.getAttribute('href');
        if (!href || href === '#') return;
        const target = $(href);
        if (!target) return;
        e.preventDefault();

        gsap.to(window, {
          duration: 1.2,
          ease: "power3.inOut",
          scrollTo: { y: target, offsetY: 80 }
        });

        document.body.classList.remove('menu-open');
        $('.site-header .nav')?.classList.remove('open');
      });
    });
  }

 // ========= HERO BLUR TEXT (GSAP + SplitType, par MOT) =========
  const h1 = $('#hero-title');
  const subtitle = $('.hero-subtitle');
  if (h1 && !window._heroAnimDone) {
    window._heroAnimDone = true;

    const fontsReady = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();

    function startAnimation() {
      const split = new SplitType('#hero-title', { types: 'words' });

      requestAnimationFrame(() => {
        h1.style.visibility = 'visible';
        split.words.forEach(w => (w.style.willChange = 'transform,opacity,filter'));

        // Animation du titre
        gsap.fromTo(
          split.words,
          { y: 40, opacity: 0, filter: 'blur(12px)' },
          {
            y: 0,
            opacity: 1,
            filter: 'blur(0px)',
            duration: 1.2,
            ease: 'power3.out',
            stagger: 0.18,
            onComplete: () => split.words.forEach(w => (w.style.willChange = 'auto'))
          }
        );

        // Animation du subtitle (apparaît après le titre)
        if (subtitle) {
          gsap.fromTo(
            subtitle,
            { y: 20, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 1,
              ease: 'power3.out',
              delay: 0.8
            }
          );
        }
      });
    }
    function kickWhenInView() {
      fontsReady.then(() => {
        const io = ('IntersectionObserver' in window)
          ? new IntersectionObserver(([entry]) => {
              if (entry && entry.isIntersecting) {
                io.unobserve(h1);
                startAnimation();
              }
            }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' })
          : null;

        if (io) {
          io.observe(h1);
          setTimeout(() => {
            const r = h1.getBoundingClientRect();
            if (r.top < innerHeight && r.bottom > 0) { io.unobserve(h1); startAnimation(); }
          }, 200);
        } else {
          startAnimation();
        }
      });
    }

    kickWhenInView();
  }
});



// === MASCOTTE RIVE ===
(function () {
  function initMascotteRive() {
    const RiveClass = (window.rive && window.rive.Rive) || window.Rive;
    if (!RiveClass) return console.error('Rive non chargé');

    const canvas = document.getElementById('flowerMascotte');
    if (!canvas) return;

    const riveApp = new RiveClass({
      src: 'img/mascotte.riv',
      canvas,
      autoplay: true,
      stateMachines: ['State Machine 1'],
      layout: new (window.rive || window).Layout({
        fit: (window.rive || window).Fit.Contain,
        alignment: (window.rive || window).Alignment.CenterRight
      }),
      onLoad: () => {
        riveApp.resizeDrawingSurfaceToCanvas();
        console.log('✅ Mascotte chargée');
      },
      onError: (e) => console.error('❌ Rive error:', e),
    });

    new ResizeObserver(() => riveApp.resizeDrawingSurfaceToCanvas())
      .observe(canvas);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMascotteRive);
  } else {
    initMascotteRive();
  }
})();

// ========= GALERIE INDEX (4 PHOTOS) - ATTEND LE DOM =========
window.addEventListener('DOMContentLoaded', async () => {
  const grid = document.getElementById('gallery');
  const sliderWrap = document.getElementById('gallery-slider-wrap');
  const slider = document.getElementById('gallery-slider');
  
  if (!grid) {
    console.log('❌ Élément #gallery non trouvé');
    return;
  }

  console.log('✅ Élément #gallery trouvé, chargement...');

  try {
    const res = await fetch('gallery.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const allItems = await res.json();
    
    // ⚡ LIMITER À 4 PHOTOS pour l'index
    const items = allItems.slice(0, 6);

    console.log('📸 Chargement de', items.length, 'photos:', items);

    // === CONSTRUIRE LA GRILLE (Desktop/Tablette) ===
    const frag = document.createDocumentFragment();

    items.forEach((item, index) => {
      console.log(`📷 Construction image ${index + 1}:`, item);
      
      const figure = document.createElement('figure');
      figure.className = 'g-item';
      figure.setAttribute('data-index', index);

      // IMAGE
      const link = document.createElement('a');
      link.href = item.src;
      link.className = 'g-link';
      link.setAttribute('aria-label', `Voir ${item.alt || 'image'} en grand`);
      
      // Support WebP avec fallback
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
      
      // Debug: vérifie le chargement de l'image
      img.addEventListener('load', () => {
        console.log('✅ Image chargée:', item.src);
      });
      img.addEventListener('error', (e) => {
        console.error('❌ Erreur chargement image:', item.src, e);
      });
      
      picture.appendChild(img);
      link.appendChild(picture);
      figure.appendChild(link);
      
      // Clic -> ouvre en nouvel onglet
      link.addEventListener('click', (e) => {
        e.preventDefault();
        window.open(item.src, '_blank', 'noopener');
      });

      frag.appendChild(figure);
    });

    grid.replaceChildren(frag);
    console.log('✅ Grille construite avec', items.length, 'photos dans', grid);

    // === MODE MOBILE : Swiper ===
    buildMobileGallery(items);

  } catch (err) {
    console.error('❌ Erreur chargement galerie:', err);
    grid.innerHTML = '<p style="text-align:center;color:#ff4444;">Erreur: ' + err.message + '</p>';
  }

  // === MOBILE SWIPER ===
  function buildMobileGallery(items) {
    if (!slider || !window.Swiper) {
      console.log('⚠️ Swiper non disponible');
      return;
    }

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

      console.log('📱 Construction slider mobile');

      // Mobile: construire le slider
      const wrapper = slider.querySelector('.swiper-wrapper');
      wrapper.innerHTML = '';

      items.forEach((item) => {
        const slide = document.createElement('div');
        slide.className = 'swiper-slide';
        
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
        slide.appendChild(picture);
        wrapper.appendChild(slide);
      });

      // Init Swiper
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

      console.log('✅ Slider mobile construit');
    }

    buildSlider();
    mq.addEventListener('change', buildSlider);
  }
});

// ── Hint "pssst…" pour la mascotte (une seule fois par page) ──
(function(){
  const canvas = document.getElementById('flowerMascotte');
  const hint = document.getElementById('mascotHint');
  const about = document.getElementById('apropos');
  if(!canvas || !hint || !about) return;

  // 💬 Détecte si mobile
  const isMobile = window.matchMedia('(max-width: 768px)').matches;

  // 💬 Définit le bon texte selon l’écran
  hint.textContent = isMobile
    ? '👀 Touche et fais glisser !'
    : '👀 Pssst… Survole-moi !';

  let shown = false;
  const once = () => { if(shown) return true; shown = true; return false; };

  // Affiche puis masque après 2.6s
  function showHint(){
    if (once()) return;
    hint.classList.add('show');
    setTimeout(() => hint.classList.remove('show'), 2600);
  }

  if (isMobile) {
    // === MOBILE : montre la bulle automatiquement à l’apparition ===
    if ('IntersectionObserver' in window){
      const io = new IntersectionObserver((entries)=>{
        entries.forEach(entry=>{
          if(entry.isIntersecting && !shown){
            setTimeout(showHint, 600); // petit délai doux
            io.disconnect();
          }
        });
      }, { threshold: 0.5 });
      io.observe(about);
    }
  } else {
    // === DESKTOP : survol proche du canvas ===
    function nearCanvas(e){
      const r = canvas.getBoundingClientRect();
      const cx = r.left + r.width/2;
      const cy = r.top + r.height/2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      const threshold = Math.min(r.width, r.height) * 0.9;
      return dist < threshold;
    }

    let raf = null;
    window.addEventListener('mousemove', (e) => {
      if (shown) return;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        if (nearCanvas(e)) showHint();
      });
    }, { passive:true });
  }
})();



// === Envoi via EmailJS ===
// === Envoi via EmailJS ===
(function(){
  const form = document.getElementById('contactForm');
  const notice = document.getElementById('formNotice');
  if (!form || !notice) return;

  const SERVICE_ID = 'service_63pllsb';
  const TEMPLATE_ID = 'template_6lrmsag';              // mail envoyé à ton client
  const AUTO_REPLY_TEMPLATE_ID = 'template_iz37p8l'; // mail auto pour le visiteur

  const show = (msg, ok=true)=>{
    notice.style.display='block';
    notice.textContent = msg;
    notice.style.color = ok ? '#9BE19B' : '#FF9B9B';
  };

  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const btn = form.querySelector('.form-submit');
    btn?.setAttribute('disabled','true');

    try {
      // --- Envoi principal (vers ton client) ---
      const res = await emailjs.sendForm(SERVICE_ID, TEMPLATE_ID, '#contactForm');

      // --- Si tout s’est bien passé ---
      if (res.status === 200) {
        // --- Envoi auto-réponse au visiteur ---
        await emailjs.sendForm(SERVICE_ID, AUTO_REPLY_TEMPLATE_ID, '#contactForm');

        form.reset();
        show('✅ Merci ! Votre message a bien été envoyé.');
      } else {
        show('❌ Erreur inattendue. Réessayez plus tard.', false);
      }
   } catch (err) {
  console.error('EmailJS error:', err);
  const msg = (err && (err.text || err.message)) ? (err.text || err.message) : 'Connexion bloquée (origines non autorisées ?)';
  show('❌ ' + msg, false);
} finally {
      btn?.removeAttribute('disabled');
    }
  });
})();


// Gestion de la section active dans la navbar
function updateActiveNavLink() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.site-header .nav a');
  
  let currentSection = '';
  const scrollPosition = window.scrollY + 200;
  
  sections.forEach(section => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.offsetHeight;
    
    if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
      currentSection = section.getAttribute('id');
    }
  });
  
  if (window.scrollY < 300) {
    currentSection = 'hero';
  }
  
  navLinks.forEach(link => {
    link.classList.remove('active');
    const href = link.getAttribute('href');
    
    if (href === `#${currentSection}`) {
      link.classList.add('active');
    }
  });
}

window.addEventListener('scroll', updateActiveNavLink);
document.addEventListener('DOMContentLoaded', updateActiveNavLink);

document.querySelectorAll('.site-header .nav a').forEach(link => {
  link.addEventListener('click', function() {
    const nav = document.getElementById('primary-nav');
    const toggle = document.querySelector('.nav-toggle');
    if (nav && nav.classList.contains('open')) {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('menu-open');
    }
    setTimeout(updateActiveNavLink, 100);
  });
});

