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
  return route.replace(/^#?\/?|\/$/g, '').toLowerCase();
}

function getCurrentRoute() {
  const hashRoute = normalizeRoute(window.location.hash);
  return hashRoute || 'inicio';
}

function setActivePage(route) {
  const targetRoute = route || 'inicio';
  const match = Array.from(pages).find((page) => page.dataset.route === targetRoute);
  const activeRoute = match ? targetRoute : '404';

  pages.forEach((page) => {
    page.classList.toggle('active', page.dataset.route === activeRoute);
  });

  navLinks.forEach((link) => {
    const linkRoute = normalizeRoute(link.getAttribute('href') || '');
    const normalizedLink = linkRoute || 'inicio';
    link.classList.toggle('active', normalizedLink === activeRoute);
  });
}

function navigateTo(url) {
  const route = normalizeRoute(url);
  const targetRoute = route || 'inicio';
  const hashRoute = targetRoute === 'inicio' ? '#/inicio' : `#/${targetRoute}`;
  if (window.location.hash !== hashRoute) {
    window.location.hash = hashRoute;
  }
  setActivePage(targetRoute);
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

window.addEventListener('hashchange', router);
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

