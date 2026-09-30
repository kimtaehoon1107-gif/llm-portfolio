const navToggle = document.getElementById('navToggle');
const navLinks = document.querySelector('.nav-links');

const setMenuOpen = (isOpen) => {
  navLinks.classList.toggle('open', isOpen);
  navToggle.setAttribute('aria-expanded', String(isOpen));
  navToggle.setAttribute('aria-label', isOpen ? '메뉴 닫기' : '메뉴 열기');
};

navToggle.addEventListener('click', () => {
  setMenuOpen(!navLinks.classList.contains('open'));
});

const revealSection = (hash) => {
  if (!hash || hash === '#') return;
  const section = document.querySelector(hash);
  if (!section) return;
  section.classList.add('is-visible');
  section.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
};

navLinks.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    setMenuOpen(false);
    revealSection(link.hash);
  });
});

const revealTargets = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  revealTargets.forEach((el) => observer.observe(el));
} else {
  revealTargets.forEach((el) => el.classList.add('is-visible'));
}

revealSection(window.location.hash);
window.addEventListener('hashchange', () => revealSection(window.location.hash));
