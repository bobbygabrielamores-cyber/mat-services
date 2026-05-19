/* ============================================
   MAT SERVICES — SCRIPTS
   ============================================ */

// --- Navbar scroll shadow ---
const navbar    = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('navLinks');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 20);
  highlightActiveNav();
}, { passive: true });

// --- Mobile menu toggle ---
hamburger.addEventListener('click', () => {
  const open = hamburger.classList.toggle('active');
  navLinks.classList.toggle('open', open);
  hamburger.setAttribute('aria-expanded', open);
});

// Close mobile menu when a link is clicked
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('active');
    navLinks.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
  });
});

// Close mobile menu on outside click
document.addEventListener('click', e => {
  if (!navbar.contains(e.target)) {
    hamburger.classList.remove('active');
    navLinks.classList.remove('open');
  }
});

// --- Active nav link on scroll ---
function highlightActiveNav() {
  const scrollPos = window.scrollY + 100;
  document.querySelectorAll('section[id]').forEach(section => {
    const link = document.querySelector(`.nav-links a[href="#${section.id}"]`);
    if (!link) return;
    const inView = scrollPos >= section.offsetTop &&
                   scrollPos < section.offsetTop + section.offsetHeight;
    link.classList.toggle('active', inView);
  });
}

// --- Smooth scroll for all anchor links ---
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const top = target.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

// --- FAQ Accordion ---
document.querySelectorAll('.faq-question').forEach(btn => {
  btn.addEventListener('click', () => {
    const item   = btn.closest('.faq-item');
    const answer = item.querySelector('.faq-answer');
    const isOpen = item.classList.contains('open');

    // Collapse all
    document.querySelectorAll('.faq-item').forEach(i => {
      i.classList.remove('open');
      i.querySelector('.faq-answer').classList.remove('open');
      i.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
    });

    // Expand clicked item if it was closed
    if (!isOpen) {
      item.classList.add('open');
      answer.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
    }
  });
});

// --- Scroll reveal (IntersectionObserver) ---
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target); // fire once
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('[data-aos]').forEach(el => revealObserver.observe(el));

// --- Contact form (demo handler) ---
document.getElementById('contactForm').addEventListener('submit', e => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  const original = btn.textContent;

  btn.textContent = '✓ Message Sent!';
  btn.style.background = 'var(--gold)';
  btn.disabled = true;

  setTimeout(() => {
    btn.textContent = original;
    btn.style.background = '';
    btn.disabled = false;
    e.target.reset();
  }, 3500);
});

// Run active-link check on load
highlightActiveNav();
