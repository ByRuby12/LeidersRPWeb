const navToggle = document.getElementById('navToggle');
const siteNav = document.getElementById('siteNav');
const navLinks = document.querySelectorAll('[data-link]');
const pages = document.querySelectorAll('.page');
const contactForm = document.getElementById('contactForm');
const formNote = document.getElementById('formNote');

navToggle.addEventListener('click', () => {
  siteNav.classList.toggle('open');
  const expanded = siteNav.classList.contains('open');
  navToggle.setAttribute('aria-expanded', expanded);
});

window.addEventListener('resize', () => {
  if (window.innerWidth > 780) {
    siteNav.classList.remove('open');
  }
});

function normalizeRoute(route) {
  if (!route) return '';
  return route.replace(/^\/|\/$/g, '');
}

function getCurrentRoute() {
  if (window.location.protocol === 'file:') {
    const hashRoute = normalizeRoute(window.location.hash.replace('#', ''));
    return hashRoute || '';
  }

  let route = normalizeRoute(window.location.pathname);
  if (route.endsWith('index.html')) {
    route = '';
  }
  return route;
}

function setActivePage(route) {
  let targetRoute = route;
  const match = Array.from(pages).find((page) => page.dataset.route === targetRoute);
  if (!match) {
    targetRoute = '404';
  }

  pages.forEach((page) => {
    page.classList.toggle('active', page.dataset.route === targetRoute);
  });

  navLinks.forEach((link) => {
    const linkRoute = normalizeRoute(link.getAttribute('href'));
    link.classList.toggle('active', linkRoute === targetRoute);
  });
}

function navigateTo(url) {
  const route = normalizeRoute(url.replace(location.origin, ''));
  if (window.location.protocol === 'file:') {
    window.location.hash = route || '#';
    setActivePage(route);
    return;
  }
  history.pushState(null, null, route ? `/${route}` : '/');
  setActivePage(route);
  siteNav.classList.remove('open');
}

function router() {
  const route = getCurrentRoute();
  setActivePage(route);
}

document.addEventListener('click', (event) => {
  const link = event.target.closest('[data-link]');
  if (!link) return;
  event.preventDefault();
  navigateTo(link.getAttribute('href'));
});

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

  prevButton.addEventListener('click', () => {
    updateStep(currentIndex - 1);
  });

  nextButton.addEventListener('click', () => {
    updateStep(currentIndex + 1);
  });

  updateStep(0);
}

window.addEventListener('popstate', router);
window.addEventListener('DOMContentLoaded', () => {
  router();
  initJoinCarousel();
});

if (contactForm && formNote) {
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

