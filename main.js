// ============================================================
// VENECIA — main.js (all public pages share this one file)
// Sections: i18n · nav · scroll reveal · packages · gallery · form
// ============================================================

/* ---------------- i18n (EN/ES toggle) ----------------
   How it works: any element with data-i18n="key" gets its text
   swapped from the STRINGS object. Choice saved to localStorage
   so it persists across pages. */
const STRINGS = {
  en: {
    nav_home: 'Home', nav_gallery: 'Gallery', nav_packages: 'Packages',
    nav_about: 'The Venue', nav_contact: 'Contact', nav_cta: 'Check availability',
    hero_eyebrow: 'Mesa · Arizona', hero_script: 'You are cordially invited to',
    hero_title: 'Celebrate life\u2019s biggest moments in elegance',
    hero_sub: 'Three beautiful party areas for weddings, quincea\u00f1eras, sweet 16s and every celebration in between — in the heart of Mesa.',
    hero_cta: 'Check your date',
    trust_areas: 'Party areas', trust_years: 'Years in Mesa', trust_guests: 'Guest capacity',
    events_eyebrow: 'Celebrations', events_title: 'Your event, your way',
    events_sub: 'Every celebration deserves its own stage. Explore what Venecia hosts.',
    ev_weddings: 'Weddings', ev_quince: 'Quincea\u00f1eras', ev_sweet16: 'Sweet 16',
    ev_baptism: 'Baptisms', ev_grad: 'Graduations', ev_private: 'Private parties',
    gallery_eyebrow: 'The venue', gallery_title: 'Inside Venecia',
    gallery_sub: 'Uplighting, elegant table settings and room for up to 300 of your favorite people.',
    gallery_cta: 'View full gallery',
    pkg_eyebrow: 'Packages', pkg_title: 'Packages for every budget',
    pkg_sub: 'Payment plans available · a deposit reserves your date',
    pkg_cta: 'See what\u2019s included', pkg_from: 'from',
    why_eyebrow: 'Why Venecia', why_title: 'Elegance, without the stress',
    why1_t: 'Three flexible party areas', why1_p: 'Intimate gatherings or grand celebrations of 300+ guests — there\u2019s a space that fits.',
    why2_t: 'Elegant & affordable', why2_p: 'Luxury looks without the luxury markup. Payment plans welcome.',
    why3_t: 'Family-owned since 2011', why3_p: 'Over 14 years hosting Mesa\u2019s most important celebrations.',
    quotes_eyebrow: 'Kind words', quotes_title: 'What families say',
    form_eyebrow: 'Reserve', form_script: 'Your celebration awaits',
    form_title: 'Check your date', form_sub: 'Tell us about your event — we\u2019ll call you within 24 hours. Se habla Espa\u00f1ol.',
    f_name: 'Name', f_phone: 'Phone', f_email: 'Email (optional)',
    f_type: 'Event type', f_date: 'Event date', f_guests: 'Estimated guests',
    f_msg: 'Tell us about your celebration', f_send: 'Send request',
    f_sending: 'Sending…', f_error: 'Something went wrong — please call us at 480-206-8626.',
    opt_select: 'Select…', opt_wedding: 'Wedding', opt_quince: 'Quincea\u00f1era',
    opt_sweet16: 'Sweet 16', opt_baptism: 'Baptism', opt_grad: 'Graduation', opt_other: 'Other',
    foot_visit: 'Visit us', foot_explore: 'Explore', foot_tag: 'Weddings · Quincea\u00f1eras · Sweet 16 · Baptisms · Graduations · Private events',
    cta_band_title: 'Ready to see it in person?', cta_band_btn: 'Schedule a visit'
  },
  es: {
    nav_home: 'Inicio', nav_gallery: 'Galer\u00eda', nav_packages: 'Paquetes',
    nav_about: 'El Sal\u00f3n', nav_contact: 'Contacto', nav_cta: 'Consultar disponibilidad',
    hero_eyebrow: 'Mesa · Arizona', hero_script: 'Est\u00e1s cordialmente invitado a',
    hero_title: 'Celebra los momentos m\u00e1s grandes de la vida con elegancia',
    hero_sub: 'Tres hermosos salones para bodas, quincea\u00f1eras, sweet 16 y toda celebraci\u00f3n — en el coraz\u00f3n de Mesa.',
    hero_cta: 'Consulta tu fecha',
    trust_areas: 'Salones', trust_years: 'A\u00f1os en Mesa', trust_guests: 'Capacidad',
    events_eyebrow: 'Celebraciones', events_title: 'Tu evento, a tu manera',
    events_sub: 'Cada celebraci\u00f3n merece su propio escenario. Descubre lo que Venecia ofrece.',
    ev_weddings: 'Bodas', ev_quince: 'Quincea\u00f1eras', ev_sweet16: 'Sweet 16',
    ev_baptism: 'Bautizos', ev_grad: 'Graduaciones', ev_private: 'Fiestas privadas',
    gallery_eyebrow: 'El sal\u00f3n', gallery_title: 'Dentro de Venecia',
    gallery_sub: 'Iluminaci\u00f3n elegante, mesas hermosas y espacio para 300 de tus personas favoritas.',
    gallery_cta: 'Ver galer\u00eda completa',
    pkg_eyebrow: 'Paquetes', pkg_title: 'Paquetes para cada presupuesto',
    pkg_sub: 'Planes de pago disponibles · un dep\u00f3sito reserva tu fecha',
    pkg_cta: 'Ver qu\u00e9 incluye', pkg_from: 'desde',
    why_eyebrow: 'Por qu\u00e9 Venecia', why_title: 'Elegancia, sin estr\u00e9s',
    why1_t: 'Tres salones flexibles', why1_p: 'Reuniones \u00edntimas o grandes celebraciones de 300+ invitados — hay un espacio para ti.',
    why2_t: 'Elegante y accesible', why2_p: 'Lujo sin precios de lujo. Aceptamos planes de pago.',
    why3_t: 'Negocio familiar desde 2011', why3_p: 'M\u00e1s de 14 a\u00f1os celebrando los momentos m\u00e1s importantes de Mesa.',
    quotes_eyebrow: 'Testimonios', quotes_title: 'Lo que dicen las familias',
    form_eyebrow: 'Reserva', form_script: 'Tu celebraci\u00f3n te espera',
    form_title: 'Consulta tu fecha', form_sub: 'Cu\u00e9ntanos de tu evento — te llamamos dentro de 24 horas.',
    f_name: 'Nombre', f_phone: 'Tel\u00e9fono', f_email: 'Correo (opcional)',
    f_type: 'Tipo de evento', f_date: 'Fecha del evento', f_guests: 'Invitados aproximados',
    f_msg: 'Cu\u00e9ntanos sobre tu celebraci\u00f3n', f_send: 'Enviar solicitud',
    f_sending: 'Enviando…', f_error: 'Algo sali\u00f3 mal — ll\u00e1manos al 480-206-8626.',
    opt_select: 'Seleccionar…', opt_wedding: 'Boda', opt_quince: 'Quincea\u00f1era',
    opt_sweet16: 'Sweet 16', opt_baptism: 'Bautizo', opt_grad: 'Graduaci\u00f3n', opt_other: 'Otro',
    foot_visit: 'Vis\u00edtanos', foot_explore: 'Explorar', foot_tag: 'Bodas · Quincea\u00f1eras · Sweet 16 · Bautizos · Graduaciones · Eventos privados',
    cta_band_title: '\u00bfListo para conocerlo en persona?', cta_band_btn: 'Agenda una visita'
  }
};

let lang = localStorage.getItem('venecia_lang') || 'en';

function applyLang() {
  const t = STRINGS[lang];
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (t[key]) el.textContent = t[key];
  });
  document.documentElement.lang = lang;
  const btn = document.getElementById('langToggle');
  if (btn) btn.textContent = lang === 'en' ? 'ES' : 'EN';
}

document.addEventListener('DOMContentLoaded', () => {
  applyLang();

  const langBtn = document.getElementById('langToggle');
  if (langBtn) langBtn.addEventListener('click', () => {
    lang = lang === 'en' ? 'es' : 'en';
    localStorage.setItem('venecia_lang', lang);
    applyLang();
    loadPackages(); // re-render dynamic content in new language
  });

  // mobile nav
  const burger = document.getElementById('burger');
  const navLinks = document.getElementById('navLinks');
  if (burger) burger.addEventListener('click', () => navLinks.classList.toggle('open'));

  // scroll reveal (respects prefers-reduced-motion via CSS)
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: .12 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  loadPackages();
  loadGallery();
  wireInquiryForm();
});

/* ---------------- packages (home teaser + packages page) ----------------
   Pulls live prices from Supabase so the site and the admin panel
   can never disagree. Falls back to static cards if DB not set up yet. */
const FALLBACK_PACKAGES = [
  { name: 'Paquete Plata', base_price: null, description: 'Everything you need for a beautiful celebration.', included_items: ['Hall rental', 'Tables & chairs', 'Basic linens', 'Setup & cleanup'], is_popular: false },
  { name: 'Paquete Oro', base_price: null, description: 'Our most popular package — elegance without the stress.', included_items: ['Hall rental', 'Tables & chairs', 'Premium linens', 'Centerpieces', 'DJ', 'Setup & cleanup'], is_popular: true },
  { name: 'Paquete Diamante', base_price: null, description: 'The full experience. You arrive, we handle the rest.', included_items: ['Largest hall', 'Premium decor', 'Centerpieces & uplighting', 'DJ', 'Catering', 'Setup & cleanup'], is_popular: false }
];

async function loadPackages() {
  const target = document.getElementById('pkgGrid');
  if (!target) return;
  let pkgs = FALLBACK_PACKAGES;

  if (db) {
    const { data, error } = await db.from('packages')
      .select('*').eq('active', true).order('sort_order');
    if (!error && data && data.length) pkgs = data;
  }

  const t = STRINGS[lang];
  target.innerHTML = pkgs.map(p => `
    <div class="pkg-card ${p.is_popular ? 'popular' : ''} reveal in">
      ${p.is_popular ? `<span class="pkg-badge">★ Popular</span>` : ''}
      <h3>${p.name}</h3>
      <div class="pkg-price">${t.pkg_from} <strong>${p.base_price ? '$' + Number(p.base_price).toLocaleString() : '$—'}</strong></div>
      <p class="pkg-desc">${p.description || ''}</p>
      <ul class="pkg-list">${(p.included_items || []).map(i => `<li>${i}</li>`).join('')}</ul>
      <a class="btn btn-ghost-dark" href="contact.html">${t.hero_cta}</a>
    </div>`).join('');
}

/* ---------------- gallery ---------------- */
const PLACEHOLDER_TILES = [
  { label: 'Ballroom', category: 'venue' }, { label: 'Table setting', category: 'weddings' },
  { label: 'Quince throne', category: 'quinceaneras' }, { label: 'Tiered cake', category: 'quinceaneras' },
  { label: 'Dance floor', category: 'venue' }, { label: 'Uplighting', category: 'weddings' },
  { label: 'Sweet 16 setup', category: 'sweet16' }, { label: 'Head table', category: 'weddings' }
];

let galleryItems = [];

async function loadGallery() {
  const target = document.getElementById('galleryGrid');
  if (!target) return;

  if (db) {
    const { data, error } = await db.from('gallery')
      .select('*').eq('active', true).order('sort_order');
    if (!error && data && data.length) galleryItems = data;
  }
  renderGallery('all');

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderGallery(btn.dataset.filter);
    });
  });
}

function renderGallery(filter) {
  const target = document.getElementById('galleryGrid');
  if (!target) return;

  if (galleryItems.length) {
    const items = filter === 'all' ? galleryItems : galleryItems.filter(g => g.category === filter);
    target.innerHTML = items.map(g =>
      `<div class="g-item"><img src="${g.image_url}" alt="${g.alt_text || 'Venecia Reception Hall event'}" loading="lazy"></div>`).join('');
  } else {
    const items = filter === 'all' ? PLACEHOLDER_TILES : PLACEHOLDER_TILES.filter(g => g.category === filter);
    target.innerHTML = items.map(g => `<div class="g-item"><div class="ph">${g.label}</div></div>`).join('');
  }

  // lightbox binding (real images only)
  target.querySelectorAll('img').forEach(img => {
    img.addEventListener('click', () => {
      const lb = document.getElementById('lightbox');
      if (!lb) return;
      lb.querySelector('img').src = img.src;
      lb.classList.add('open');
    });
  });
}

document.addEventListener('click', e => {
  const lb = document.getElementById('lightbox');
  if (lb && (e.target === lb || e.target.classList.contains('lightbox-close'))) lb.classList.remove('open');
});

/* ---------------- inquiry form ----------------
   Writes to Supabase `inquiries` (anonymous INSERT allowed by RLS),
   then redirects to gracias.html. Honeypot field blocks basic bots. */
function wireInquiryForm() {
  const form = document.getElementById('inquiryForm');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const msg = form.querySelector('.form-msg');
    const btn = form.querySelector('button[type=submit]');
    const t = STRINGS[lang];

    if (form.querySelector('.hp input').value) return; // bot caught

    const payload = {
      name: form.name.value.trim(),
      phone: form.phone.value.trim(),
      email: form.email.value.trim() || null,
      event_type: form.event_type.value || null,
      event_date: form.event_date.value || null,
      guest_count: form.guest_count.value ? parseInt(form.guest_count.value, 10) : null,
      message: form.message.value.trim() || null
    };

    btn.disabled = true; btn.textContent = t.f_sending;

    if (!db) { // Supabase not configured yet — still demo the flow
      window.location.href = 'gracias.html'; return;
    }

    const { error } = await db.from('inquiries').insert(payload);
    if (error) {
      msg.textContent = t.f_error; msg.classList.add('error');
      btn.disabled = false; btn.textContent = t.f_send;
    } else {
      window.location.href = 'gracias.html';
    }
  });
}