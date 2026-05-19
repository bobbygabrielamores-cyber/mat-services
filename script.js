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

// ============================================
//   BOOKING CALENDAR & TIME SLOTS
// ============================================

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];
const TIME_SLOTS = [
  '8:00 AM','9:00 AM','10:00 AM','11:00 AM',
  '1:00 PM','2:00 PM','3:00 PM','4:00 PM'
];

let calCurrent = new Date();
calCurrent.setDate(1);

function renderCalendar() {
  const label  = document.getElementById('calMonthLabel');
  const grid   = document.getElementById('calGrid');
  if (!label || !grid) return;

  label.textContent = MONTHS[calCurrent.getMonth()] + ' ' + calCurrent.getFullYear();

  // Remove previously rendered day buttons (keep the 7 day-name headers)
  grid.querySelectorAll('.cal-day').forEach(d => d.remove());

  const today      = new Date(); today.setHours(0,0,0,0);
  const firstDay   = new Date(calCurrent.getFullYear(), calCurrent.getMonth(), 1).getDay();
  const daysInMonth = new Date(calCurrent.getFullYear(), calCurrent.getMonth() + 1, 0).getDate();
  const selected   = document.getElementById('selectedDate').value;

  // Empty offset cells
  for (let i = 0; i < firstDay; i++) {
    const blank = document.createElement('div');
    blank.className = 'cal-day';
    blank.style.visibility = 'hidden';
    grid.appendChild(blank);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const btn     = document.createElement('button');
    const thisDate = new Date(calCurrent.getFullYear(), calCurrent.getMonth(), d);
    const dateStr  = `${thisDate.getFullYear()}-${String(thisDate.getMonth()+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dow      = thisDate.getDay(); // 0=Sun, 6=Sat

    btn.type      = 'button';
    btn.className = 'cal-day';
    btn.textContent = d;

    if (thisDate < today || dow === 0 || dow === 6) {
      btn.disabled = true;
      if (dow === 0 || dow === 6) btn.classList.add('weekend');
    }
    if (thisDate.toDateString() === today.toDateString()) btn.classList.add('today');
    if (dateStr === selected) btn.classList.add('selected');

    btn.addEventListener('click', () => {
      grid.querySelectorAll('.cal-day').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      document.getElementById('selectedDate').value = dateStr;

      // Show time slots, reset any prior selection
      const group = document.getElementById('timeSlotsGroup');
      group.style.display = 'block';
      group.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      document.getElementById('selectedTime').value = '';
      document.querySelectorAll('.time-slot').forEach(t => t.classList.remove('selected'));
    });

    grid.appendChild(btn);
  }
}

// Prev / Next month navigation
document.getElementById('calPrev')?.addEventListener('click', () => {
  const today = new Date(); today.setDate(1); today.setHours(0,0,0,0);
  const prev  = new Date(calCurrent.getFullYear(), calCurrent.getMonth() - 1, 1);
  if (prev >= today) { calCurrent = prev; renderCalendar(); }
});
document.getElementById('calNext')?.addEventListener('click', () => {
  calCurrent = new Date(calCurrent.getFullYear(), calCurrent.getMonth() + 1, 1);
  renderCalendar();
});

// Render time slot buttons
const timeSlotsEl = document.getElementById('timeSlots');
if (timeSlotsEl) {
  TIME_SLOTS.forEach(time => {
    const btn = document.createElement('button');
    btn.type      = 'button';
    btn.className = 'time-slot';
    btn.textContent = time;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.time-slot').forEach(t => t.classList.remove('selected'));
      btn.classList.add('selected');
      document.getElementById('selectedTime').value = time;
    });
    timeSlotsEl.appendChild(btn);
  });
}

// Initial render
renderCalendar();
