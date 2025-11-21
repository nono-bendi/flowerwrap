document.addEventListener('DOMContentLoaded', async () => {
  
  // 1. MENU BURGER (Utilise les classes de style.css)
  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.nav');
  
  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      const isOpen = nav.classList.contains('open');
      nav.classList.toggle('open', !isOpen);
      navToggle.setAttribute('aria-expanded', !isOpen);
      // Important : style.css utilise body.menu-open pour bloquer le scroll
      document.body.classList.toggle('menu-open', !isOpen);
    });

    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('menu-open');
      });
    });
  }
  
  const yearSpan = document.getElementById('year');
  if(yearSpan) yearSpan.textContent = new Date().getFullYear();

  // 2. CHARGEMENT GALERIE
  const galleryGrid = document.getElementById('gallery');
  const filterBtns = document.querySelectorAll('.filter-btn');
  
  let galleryData = [];
  let currentFilter = 'all';
  let filteredData = [];

  // Chargement JSON
  try {
    // Assure-toi que gallery.json est bien au même endroit que galerie.html
    const res = await fetch('gallery.json'); 
    if (!res.ok) throw new Error('Erreur HTTP ' + res.status);
    const rawData = await res.json();

    galleryData = rawData.map((item, index) => ({
      id: index,
      src: item.src,
      title: item.title || 'Réalisation FlowerWrap',
      category: item.category || 'total'
    }));

    renderGallery();

  } catch (err) {
    console.error("Erreur:", err);
    if(galleryGrid) galleryGrid.innerHTML = `<p style="color:white;text-align:center">Erreur de chargement (${err.message}). Vérifiez le fichier gallery.json.</p>`;
  }

  function renderGallery() {
    if(!galleryGrid) return;
    galleryGrid.innerHTML = '';

    filteredData = currentFilter === 'all' 
      ? galleryData 
      : galleryData.filter(item => item.category === currentFilter);

    if (filteredData.length === 0) {
      galleryGrid.innerHTML = '<p style="color:#888;text-align:center;">Aucune photo dans cette catégorie.</p>';
      return;
    }

    filteredData.forEach((item, index) => {
      const div = document.createElement('div');
      div.className = 'gallery-item'; 
      
      div.innerHTML = `
        <img src="${item.src}" alt="${item.title}" loading="lazy">
        <div class="gallery-item-overlay">
          <div class="gallery-item-title">${item.title}</div>
          <div class="gallery-item-category">${getLabel(item.category)}</div>
        </div>
      `;
      div.addEventListener('click', () => openLightbox(index));
      
      const img = div.querySelector('img');
      img.onload = () => div.classList.add('visible');
      img.onerror = () => div.style.display = 'none';
      if(img.complete) setTimeout(() => div.classList.add('visible'), 50);

      galleryGrid.appendChild(div);
    });
  }

  function getLabel(cat) {
    const labels = { total: 'Covering Total', partiel: 'Covering Partiel', vitrage: 'Vitrage Teinté', protection: 'Protection PPF' };
    return labels[cat] || 'Réalisation';
  }

  if(filterBtns) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        renderGallery();
      });
    });
  }

  // LIGHTBOX
  const lightbox = document.getElementById('lightbox');
  const lbImg = document.getElementById('lightbox-img');
  const lbTitle = document.getElementById('lightbox-title');
  const lbCat = document.getElementById('lightbox-category');
  const lbClose = document.getElementById('lightbox-close');
  const lbPrev = document.getElementById('lightbox-prev');
  const lbNext = document.getElementById('lightbox-next');
  let currentIndex = 0;

  function openLightbox(index) {
    currentIndex = index;
    updateLightboxUI();
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }

  function updateLightboxUI() {
    const item = filteredData[currentIndex];
    if (!item) return;
    lbImg.src = item.src;
    lbTitle.textContent = item.title;
    lbCat.textContent = getLabel(item.category);
  }

  if(lbClose) lbClose.addEventListener('click', closeLightbox);
  if(lightbox) lightbox.addEventListener('click', (e) => { if(e.target === lightbox) closeLightbox(); });
  
  if(lbNext) lbNext.addEventListener('click', (e) => {
    e.stopPropagation();
    currentIndex = (currentIndex + 1) % filteredData.length;
    updateLightboxUI();
  });

  if(lbPrev) lbPrev.addEventListener('click', (e) => {
    e.stopPropagation();
    currentIndex = (currentIndex - 1 + filteredData.length) % filteredData.length;
    updateLightboxUI();
  });
  
  document.addEventListener('keydown', (e) => {
    if (lightbox && lightbox.classList.contains('active')) {
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowRight') lbNext.click();
        if (e.key === 'ArrowLeft') lbPrev.click();
    }
  });
});