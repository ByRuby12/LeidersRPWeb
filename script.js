const navToggle = document.getElementById('navToggle');
const siteNav = document.getElementById('siteNav');
const navLinks = document.querySelectorAll('[data-link]');
const app = document.getElementById('app');

const currentScript = document.currentScript || document.querySelector('script[src$="script.js"]');
const basePath = (() => {
  const scriptUrl = currentScript ? new URL(currentScript.src, window.location.origin) : new URL(window.location.href);
  return scriptUrl.pathname.replace(/\/script\.js$/, '').replace(/\/$/, '');
})();

let routes = [];
const viewCache = new Map();

async function fetchJson(path) {
  const response = await fetch(path, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Error cargando ${path}: ${response.status}`);
  }
  return await response.json();
}

function normalizeRoute(route) {
  if (!route) return '';
  if (typeof route !== 'string') {
    return '';
  }

  let path = route;
  if (route.startsWith('#')) {
    path = route.slice(1);
    return path.replace(/^\/+|\/+$/g, '').toLowerCase();
  }

  try {
    const url = new URL(route, window.location.origin);
    path = url.pathname;
  } catch (error) {
    // Ignore invalid URL and keep raw route string.
  }

  if (basePath && path.startsWith(basePath)) {
    path = path.slice(basePath.length);
  }

  return path.replace(/^\/+|\/+$/g, '').toLowerCase();
}

function makeRoutePath(route) {
  const normalizedRoute = normalizeRoute(route) || 'inicio';
  return `#${normalizedRoute}`;
}

function updateLinkPaths() {
  document.querySelectorAll('[data-link][data-route]').forEach((link) => {
    const route = normalizeRoute(link.dataset.route || '');
    if (!route) return;
    link.setAttribute('href', makeRoutePath(route));
  });
}

async function ensureRoutes() {
  if (routes.length === 0) {
    routes = await fetchJson('data/routes.json');
  }
}

function getRouteConfig(route) {
  const targetRoute = normalizeRoute(route) || 'inicio';
  const match = routes.find((entry) => entry.route === targetRoute);
  return match || routes.find((entry) => entry.route === '404');
}

async function loadView(route) {
  await ensureRoutes();
  const config = getRouteConfig(route);
  if (!config) {
    app.innerHTML = '<section class="page" data-route="404"><div class="container section-header"><span class="eyebrow">404</span><h2>Página no encontrada</h2><p>La ruta solicitada no existe.</p><a class="btn btn-primary" href="#" data-link data-route="inicio">Volver al inicio</a></div></section>';
    updateLinkPaths();
    updateNavActive('404');
    return;
  }

  if (!viewCache.has(config.route)) {
    const response = await fetch(`views/${config.file}`, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Error cargando vista ${config.file}`);
    }
    const html = await response.text();
    viewCache.set(config.route, html);
  }

  app.innerHTML = viewCache.get(config.route);
  updateLinkPaths();
  const page = app.querySelector('.page');
  if (page) {
    page.classList.add('active');
  }
  updateNavActive(config.route);
  const targetPath = makeRoutePath(config.route);
  const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (currentUrl !== targetPath) {
    history.replaceState(null, '', targetPath);
  }
  initPageFeatures(config.route);
}

function navigateTo(route) {
  const targetRoute = normalizeRoute(route) || 'inicio';
  const path = makeRoutePath(targetRoute);

  if (window.location.hash !== path) {
    window.location.hash = path;
    siteNav.classList.remove('open');
    document.body.classList.remove('nav-open');
    return;
  }

  loadView(targetRoute).catch((error) => console.error(error));
  siteNav.classList.remove('open');
  document.body.classList.remove('nav-open');
}

function getCurrentRoute() {
  const hash = window.location.hash;
  if (hash) {
    const normalizedHash = normalizeRoute(hash);
    if (normalizedHash) {
      return normalizedHash;
    }
  }

  const params = new URLSearchParams(window.location.search);
  const routeParam = params.get('route');
  if (routeParam) {
    return normalizeRoute(routeParam) || 'inicio';
  }

  let pathname = window.location.pathname;
  if (basePath && pathname.startsWith(basePath)) {
    pathname = pathname.slice(basePath.length);
  }
  return normalizeRoute(pathname) || 'inicio';
}

function updateNavActive(route) {
  navLinks.forEach((link) => {
    const linkRoute = normalizeRoute(link.dataset.route || link.getAttribute('href') || '');
    const normalizedLink = linkRoute || 'inicio';
    link.classList.toggle('active', normalizedLink === route);
  });
}

function initJoinCarousel() {
  const carousel = document.getElementById('joinCarousel');
  if (!carousel) return;

  const prevButton = carousel.querySelector('.carousel-prev');
  const nextButton = carousel.querySelector('.carousel-next');
  const pageIndicator = carousel.querySelector('.carousel-page');
  const panels = Array.from(carousel.querySelectorAll('.step-text'));
  if (!prevButton || !nextButton || panels.length === 0) return;

  let currentIndex = 0;
  function updateStep(index) {
    if (index < 0) {
      currentIndex = panels.length - 1;
    } else if (index >= panels.length) {
      currentIndex = 0;
    } else {
      currentIndex = index;
    }

    panels.forEach((panel, panelIndex) => {
      panel.classList.toggle('active', panelIndex === currentIndex);
    });

    if (pageIndicator) {
      pageIndicator.textContent = `Paso ${currentIndex + 1} / ${panels.length}`;
    }
  }

  prevButton.addEventListener('click', () => updateStep(currentIndex - 1));
  nextButton.addEventListener('click', () => updateStep(currentIndex + 1));
  updateStep(0);
}

async function initNewsPagination() {
  const newsCardsContainer = document.getElementById('newsCards');
  if (!newsCardsContainer) return;

  const newsPagination = document.querySelector('.news-pagination');
  const prevButton = document.querySelector('.news-prev');
  const nextButton = document.querySelector('.news-next');
  if (!prevButton || !nextButton || !newsPagination) return;

  const newsItems = await fetchJson('data/news.json');
  const pageSize = 2;
  let currentPage = 0;
  const pageCount = Math.ceil(newsItems.length / pageSize);

  if (newsItems.length <= 2) {
    newsPagination.style.display = 'none';
  }

  function renderPage() {
    const currentItems = newsItems.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
    newsCardsContainer.innerHTML = currentItems
      .map((item) => `
        <article class="news-card">
          <img src="${item.image}" alt="${item.alt}">
          <div class="news-card-body">
            <span class="eyebrow">${item.date}</span>
            <h3>${item.title}</h3>
            <p>${item.description}</p>
          </div>
        </article>
      `)
      .join('');

    prevButton.disabled = currentPage === 0;
    nextButton.disabled = currentPage === pageCount - 1;
  }

  prevButton.addEventListener('click', () => {
    currentPage = Math.max(0, currentPage - 1);
    renderPage();
  });

  nextButton.addEventListener('click', () => {
    currentPage = Math.min(pageCount - 1, currentPage + 1);
    renderPage();
  });

  renderPage();
}

async function initNormativas() {
  const norms = await fetchJson('data/normativas.json');
  const container = document.getElementById('normsGrid');
  const pagination = document.querySelector('.norm-pagination');
  if (!container) return;

  const pageSize = 3;
  let currentPage = 0;
  const pageCount = Math.max(1, Math.ceil(norms.length / pageSize));

  const renderPage = () => {
    const currentItems = norms.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
    container.innerHTML = currentItems
      .map((item) => `
        <article class="norm-card">
          <div>
            <h3>${item.title}</h3>
            <p>${item.description}</p>
          </div>
          <div class="norm-actions">
            ${item.viewUrl && item.viewUrl !== '#' ? `<a class="btn btn-primary" href="${item.viewUrl}" target="_blank" rel="noreferrer">Ver</a>` : ''}
            ${item.downloadUrl && item.downloadUrl !== '#' ? `<a class="btn btn-secondary" href="${item.downloadUrl}" target="_blank" rel="noreferrer">Descargar</a>` : ''}
          </div>
        </article>
      `)
      .join('');

    if (pagination) {
      const prevButton = pagination.querySelector('.norm-prev');
      const nextButton = pagination.querySelector('.norm-next');
      const pageIndicator = pagination.querySelector('.norm-page');

      if (prevButton) prevButton.disabled = currentPage === 0;
      if (nextButton) nextButton.disabled = currentPage === pageCount - 1;
      if (pageIndicator) pageIndicator.textContent = `${currentPage + 1}/${pageCount}`;
    }
  };

  if (pagination) {
    const prevButton = pagination.querySelector('.norm-prev');
    const nextButton = pagination.querySelector('.norm-next');

    if (prevButton) {
      prevButton.addEventListener('click', () => {
        currentPage = Math.max(0, currentPage - 1);
        renderPage();
      });
    }

    if (nextButton) {
      nextButton.addEventListener('click', () => {
        currentPage = Math.min(pageCount - 1, currentPage + 1);
        renderPage();
      });
    }
  }

  renderPage();
}

async function initTrabajos() {
  const jobs = await fetchJson('data/trabajos.json');
  const container = document.getElementById('jobsGrid');
  const pagination = document.querySelector('.job-pagination');
  if (!container) return;

  const pageSize = 3;
  let currentPage = 0;
  const pageCount = Math.max(1, Math.ceil(jobs.length / pageSize));

  const renderPage = () => {
    const currentJobs = jobs.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
    container.innerHTML = currentJobs
      .map((job) => `
        <article class="feature-card">
          <h3>${job.title}</h3>
          <p>${job.description}</p>
          <a class="btn btn-secondary" href="${job.ctaUrl}" target="_blank" rel="noreferrer">${job.ctaLabel}</a>
        </article>
      `)
      .join('');

    if (pagination) {
      const prevButton = pagination.querySelector('.job-prev');
      const nextButton = pagination.querySelector('.job-next');
      const pageIndicator = pagination.querySelector('.job-page');

      if (prevButton) prevButton.disabled = currentPage === 0;
      if (nextButton) nextButton.disabled = currentPage === pageCount - 1;
      if (pageIndicator) pageIndicator.textContent = `${currentPage + 1}/${pageCount}`;
    }
  };

  if (pagination) {
    const prevButton = pagination.querySelector('.job-prev');
    const nextButton = pagination.querySelector('.job-next');

    if (prevButton) {
      prevButton.addEventListener('click', () => {
        currentPage = Math.max(0, currentPage - 1);
        renderPage();
      });
    }

    if (nextButton) {
      nextButton.addEventListener('click', () => {
        currentPage = Math.min(pageCount - 1, currentPage + 1);
        renderPage();
      });
    }
  }

  renderPage();
}

async function initCommands() {
  const commands = await fetchJson('data/comandos.json');
  const container = document.getElementById('commandsGrid');
  const pagination = document.querySelector('.command-pagination');
  if (!container) return;

  const pageSize = 6;
  let currentPage = 0;
  const pageCount = Math.max(1, Math.ceil(commands.length / pageSize));

  const renderPage = () => {
    const currentItems = commands.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
    container.innerHTML = currentItems
      .map((cmd) => `
        <article class="command-card">
          <h4>${cmd.command}</h4>
          ${cmd.description ? `<p>${cmd.description}${cmd.example ? `<br>➜ Ejemplo: <strong>${cmd.example}</strong>.` : ''}</p>` : ''}
        </article>
      `)
      .join('');

    if (pagination) {
      const prevButton = pagination.querySelector('.command-prev');
      const nextButton = pagination.querySelector('.command-next');
      const pageIndicator = pagination.querySelector('.command-page');

      if (prevButton) prevButton.disabled = currentPage === 0;
      if (nextButton) nextButton.disabled = currentPage === pageCount - 1;
      if (pageIndicator) pageIndicator.textContent = `${currentPage + 1}/${pageCount}`;
    }
  };

  renderPage();

  if (pagination) {
    const prevButton = pagination.querySelector('.command-prev');
    const nextButton = pagination.querySelector('.command-next');

    if (prevButton) {
      prevButton.addEventListener('click', () => {
        currentPage = Math.max(0, currentPage - 1);
        renderPage();
      });
    }

    if (nextButton) {
      nextButton.addEventListener('click', () => {
        currentPage = Math.min(pageCount - 1, currentPage + 1);
        renderPage();
      });
    }
  }
}

async function initStaff() {
  const members = await fetchJson('data/staff.json');
  const container = document.getElementById('staffGrid');
  if (!container) return;
  container.innerHTML = members
    .map((member) => `
      <article class="team-card">
        <div class="team-header">
          <img src="${member.avatar}" alt="${member.name}" class="team-avatar">
          <div>
            <h4>${member.name}</h4>
            <p class="team-role">${member.role}</p>
            <p class="team-note">${member.note}</p>
          </div>
        </div>
        <div class="team-rating">${'⭐'.repeat(member.rating || 5)}</div>
      </article>
    `)
    .join('');
}

function initContactForm() {
  const contactForm = document.getElementById('contactForm');
  const formNote = document.getElementById('formNote');
  if (!contactForm || !formNote) return;

  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = event.target.name.value.trim();
    const email = event.target.email.value.trim();
    const message = event.target.message.value.trim();

    if (!name || !email || !message) {
      formNote.textContent = 'Por favor completa todos los campos.';
      return;
    }

    formNote.textContent = 'Mensaje enviado. ¡Gracias! Nos pondremos en contacto pronto.';
    contactForm.reset();
  });
}

function initPageFeatures(route) {
  if (route === 'unirse') {
    initJoinCarousel();
  }

  if (route === 'noticias') {
    initNewsPagination().catch((error) => console.error(error));
  }

  if (route === 'normativas') {
    initNormativas().catch((error) => console.error(error));
  }

  if (route === 'trabajos') {
    initTrabajos().catch((error) => console.error(error));
  }

  if (route === 'comandos') {
    initCommands().catch((error) => console.error(error));
  }

  if (route === 'staff') {
    initStaff().catch((error) => console.error(error));
  }

  initContactForm();
}

function router() {
  const route = getCurrentRoute();
  loadView(route).catch((error) => console.error(error));
}

navToggle.addEventListener('click', () => {
  siteNav.classList.toggle('open');
  const expanded = siteNav.classList.contains('open');
  navToggle.setAttribute('aria-expanded', expanded);
  document.body.classList.toggle('nav-open', expanded);
});

window.addEventListener('resize', () => {
  if (window.innerWidth > 780) {
    siteNav.classList.remove('open');
    document.body.classList.remove('nav-open');
  }
});

window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', () => {
  updateLinkPaths();
  router();
});

document.addEventListener('click', (event) => {
  const link = event.target.closest('[data-link]');
  if (!link) return;

  event.preventDefault();
  navigateTo(link.dataset.route || link.getAttribute('href'));
});

document.addEventListener('contextmenu', function (e) {
  e.preventDefault();
});

document.addEventListener('keydown', function (e) {
  const key = e.key.toUpperCase();
  if (
    key === 'F12' ||
    (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(key)) ||
    (e.ctrlKey && key === 'U') ||
    (e.ctrlKey && key === 'S') ||
    (e.ctrlKey && key === 'A')
  ) {
    e.preventDefault();
    e.stopPropagation();
  }
});

