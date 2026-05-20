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

// Contact form handler (kept for compatibility; booking widget is the primary CTA)
document.getElementById('contactForm')?.addEventListener('submit', e => {
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
//   CUSTOM BOOKING WIDGET
// ============================================

(function () {
  // ── Google Sheets backend ──────────────────────────────────────────────────
  const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz9Ta4pWjqBqlec3XsF9tMLSYDwXFmc_JY45o8J_dYkLQq1kdCIL_VGVsl_jFC7xoTM/exec';

  // ── Constants ──────────────────────────────────────────────────────────────
  const MONTHS_LONG  = ['January','February','March','April','May','June',
                        'July','August','September','October','November','December'];
  const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun',
                        'Jul','Aug','Sep','Oct','Nov','Dec'];
  const DAYS_SHORT   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  // All available time slots (Mon–Fri)
  const ALL_SLOTS = [
    '8:00 AM','9:00 AM','10:00 AM','11:00 AM',
    '1:00 PM','2:00 PM','3:00 PM','4:00 PM'
  ];

  // ── State ──────────────────────────────────────────────────────────────────
  let bkState = {
    service    : '',        // selected service name
    serviceDesc: '',        // service description
    calDate    : new Date(),// month being shown in the calendar
    selectedDate: null,     // Date object of chosen day
    selectedTime: '',       // e.g. "10:00 AM"
    bookedSlots : {}        // { "YYYY-MM-DD": ["10:00 AM", ...] }
  };
  bkState.calDate.setDate(1);

  // ── DOM references ─────────────────────────────────────────────────────────
  const widget        = document.getElementById('bkWidget');
  if (!widget) return; // guard: only run when widget exists

  const steps         = widget.querySelectorAll('.bk-step');
  const svcBtns       = widget.querySelectorAll('.bk-svc-btn');
  const backBtns      = widget.querySelectorAll('.bk-back-btn');
  const calGrid       = document.getElementById('bkCalGrid');
  const calMonthLabel = document.getElementById('bkCalMonth');
  const calPrev       = document.getElementById('bkCalPrev');
  const calNext       = document.getElementById('bkCalNext');
  const svcLabel2     = document.getElementById('bkSvcLabel');
  const svcLabel3     = document.getElementById('bkSvcLabel3');
  const dateLabel     = document.getElementById('bkDateLabel');
  const timesEl       = document.getElementById('bkTimes');
  const summaryEl     = document.getElementById('bkSummary');
  const bkForm        = document.getElementById('bkForm');
  const confirmedEl   = document.getElementById('bkConfirmedDetails');
  const newBookingBtn = document.getElementById('bkNewBooking');

  // ── Helpers ────────────────────────────────────────────────────────────────
  function goToStep(n) {
    steps.forEach(s => s.classList.remove('active'));
    const target = document.getElementById(`bkStep${n}`);
    if (target) {
      target.classList.add('active');
      // Scroll widget into view nicely on mobile
      widget.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  function dateKey(d) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  function formatDateLong(d) {
    return `${DAYS_SHORT[d.getDay()]}, ${MONTHS_LONG[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }

  // ── Fetch ALL booked slots once on page load ───────────────────────────────
  let slotsLoadedPromise = null; // awaited before rendering time slots

  async function fetchAllBookedSlots() {
    try {
      const res  = await fetch(APPS_SCRIPT_URL);
      const data = await res.json();
      if (data.slots && typeof data.slots === 'object') {
        Object.assign(bkState.bookedSlots, data.slots);
      }
    } catch (err) { /* silently fail — all slots show as available */ }
  }

  // Per-date fetch (no-op — data already loaded on init)
  function fetchBookedSlots(isoDate) {
    return Promise.resolve();
  }

  // ── Step 1 → Step 2: service selection ────────────────────────────────────
  svcBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      bkState.service     = btn.dataset.service;
      bkState.serviceDesc = btn.dataset.desc;
      // Reset downstream selections
      bkState.selectedDate = null;
      bkState.selectedTime = '';

      // Update service labels shown in later steps
      if (svcLabel2) svcLabel2.textContent = bkState.service;
      if (svcLabel3) svcLabel3.textContent = bkState.service;

      renderBkCalendar();
      goToStep(2);
    });
  });

  // ── Back buttons ───────────────────────────────────────────────────────────
  backBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = parseInt(btn.dataset.target, 10);
      goToStep(target);
    });
  });

  // ── Calendar rendering ─────────────────────────────────────────────────────
  function renderBkCalendar() {
    if (!calGrid || !calMonthLabel) return;

    calMonthLabel.textContent =
      MONTHS_LONG[bkState.calDate.getMonth()] + ' ' + bkState.calDate.getFullYear();

    // Remove old day cells (keep the 7 header dname cells)
    calGrid.querySelectorAll('.bk-cal-day').forEach(d => d.remove());

    const today      = new Date(); today.setHours(0,0,0,0);
    const year       = bkState.calDate.getFullYear();
    const month      = bkState.calDate.getMonth();
    const firstDow   = new Date(year, month, 1).getDay();
    const daysInMo   = new Date(year, month + 1, 0).getDate();
    const selKey     = bkState.selectedDate ? dateKey(bkState.selectedDate) : '';

    // Blank offset cells
    for (let i = 0; i < firstDow; i++) {
      const blank = document.createElement('div');
      blank.className = 'bk-cal-day';
      blank.setAttribute('aria-hidden', 'true');
      calGrid.appendChild(blank);
    }

    for (let d = 1; d <= daysInMo; d++) {
      const thisDate = new Date(year, month, d);
      const dow      = thisDate.getDay();
      const key      = dateKey(thisDate);
      const isPast   = thisDate < today;
      const isWeekend = dow === 0 || dow === 6;
      const isToday  = thisDate.toDateString() === today.toDateString();

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'bk-cal-day';
      btn.textContent = d;

      if (isToday)  btn.classList.add('bk-today');
      if (key === selKey) btn.classList.add('bk-selected');

      if (isPast || isWeekend) {
        btn.disabled = true;
        btn.classList.add('bk-disabled');
      } else {
        btn.addEventListener('click', async () => {
          calGrid.querySelectorAll('.bk-cal-day').forEach(b => b.classList.remove('bk-selected'));
          btn.classList.add('bk-selected');
          bkState.selectedDate = thisDate;
          bkState.selectedTime = '';

          // Go to step 3 immediately with loading state
          if (dateLabel) dateLabel.textContent = formatDateLong(thisDate);
          if (svcLabel3) svcLabel3.textContent = bkState.service;
          if (timesEl) timesEl.innerHTML = '<p class="bk-loading">Checking availability…</p>';
          goToStep(3);

          // Wait for the initial slot fetch to finish (handles race condition on fast clicks)
          await slotsLoadedPromise;
          renderTimeSlots();
        });
      }

      calGrid.appendChild(btn);
    }
  }

  // Prev / Next month
  calPrev?.addEventListener('click', () => {
    const today = new Date(); today.setDate(1); today.setHours(0,0,0,0);
    const prev  = new Date(bkState.calDate.getFullYear(), bkState.calDate.getMonth() - 1, 1);
    if (prev >= today) { bkState.calDate = prev; renderBkCalendar(); }
  });
  calNext?.addEventListener('click', () => {
    bkState.calDate = new Date(bkState.calDate.getFullYear(), bkState.calDate.getMonth() + 1, 1);
    renderBkCalendar();
  });

  // ── Time slots ─────────────────────────────────────────────────────────────

  // One reliable PHT helper using Intl formatToParts + UTC+8 fallback
  function getPHTInfo() {
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone : 'Asia/Manila',
        year     : 'numeric', month  : '2-digit', day   : '2-digit',
        hour     : '2-digit', minute : '2-digit', hour12: false
      }).formatToParts(new Date())
        .reduce((a, p) => { a[p.type] = p.value; return a; }, {});
      const h = parts.hour === '24' ? 0 : parseInt(parts.hour, 10);
      return {
        dateStr: `${parts.year}-${parts.month}-${parts.day}`,
        hour   : h,
        minute : parseInt(parts.minute, 10)
      };
    } catch (_) {
      // Fallback: manually shift UTC → UTC+8 and read UTC fields
      const pht = new Date(Date.now() + 8 * 3600000);
      return {
        dateStr: `${pht.getUTCFullYear()}-${String(pht.getUTCMonth()+1).padStart(2,'0')}-${String(pht.getUTCDate()).padStart(2,'0')}`,
        hour   : pht.getUTCHours(),
        minute : pht.getUTCMinutes()
      };
    }
  }

  function slotHour(timeStr) {
    // Converts "8:00 AM" / "1:00 PM" → 24h integer
    const [hhmm, period] = timeStr.split(' ');
    let h = parseInt(hhmm.split(':')[0], 10);
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return h;
  }

  function renderTimeSlots() {
    if (!timesEl) return;
    timesEl.innerHTML = '';

    const key    = bkState.selectedDate ? dateKey(bkState.selectedDate) : '';
    const booked = bkState.bookedSlots[key] || [];

    // Is the selected date today in PHT? (Intl-based, correct on any device timezone)
    const pht      = getPHTInfo();
    const isToday  = key === pht.dateStr;
    const phtHour  = pht.hour;
    const phtMin   = pht.minute;

    ALL_SLOTS.forEach(time => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'bk-time-btn';
      btn.textContent = time;

      const h = slotHour(time);
      // Grey out if: already booked OR (today and slot hour has passed or is current hour with no buffer)
      const isPast   = isToday && (h < phtHour || (h === phtHour && phtMin > 0));
      const isBooked = booked.includes(time);

      if (isPast || isBooked) {
        btn.disabled = true;
        btn.classList.add('bk-booked');
        btn.title = isPast ? 'This time has already passed' : 'Already booked';
      } else {
        btn.addEventListener('click', () => {
          timesEl.querySelectorAll('.bk-time-btn').forEach(t => t.classList.remove('bk-time-selected'));
          btn.classList.add('bk-time-selected');
          bkState.selectedTime = time;

          // Brief delay for visual feedback, then advance
          setTimeout(() => {
            buildSummary();
            goToStep(4);
          }, 180);
        });
      }

      timesEl.appendChild(btn);
    });
  }

  // ── Step 4 summary card ────────────────────────────────────────────────────
  function buildSummary() {
    if (!summaryEl || !bkState.selectedDate) return;
    summaryEl.innerHTML = `
      <div class="bk-summary-row">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
        <span>${formatDateLong(bkState.selectedDate)} · ${bkState.selectedTime}</span>
      </div>
      <div class="bk-summary-row">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
        <span>${bkState.service} · 1 hr · Google Meet / Zoom</span>
      </div>
    `;
  }

  // ── Form submission → Step 5 ───────────────────────────────────────────────
  bkForm?.addEventListener('submit', e => {
    e.preventDefault();

    const fname  = document.getElementById('bkFname').value.trim();
    const lname  = document.getElementById('bkLname').value.trim();
    const email  = document.getElementById('bkEmail').value.trim();
    const notes  = document.getElementById('bkNotes').value.trim();

    // Basic validation
    if (!fname || !lname || !email) {
      // Highlight empty required fields
      [document.getElementById('bkFname'), document.getElementById('bkLname'), document.getElementById('bkEmail')]
        .forEach(inp => {
          if (!inp.value.trim()) inp.classList.add('bk-input-error');
          else inp.classList.remove('bk-input-error');
        });
      return;
    }

    const submitBtn = bkForm.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Submitting…';
    submitBtn.disabled = true;

    // Mark the slot as booked locally so it greys out if they come back
    const key = bkState.selectedDate ? dateKey(bkState.selectedDate) : '';
    if (key) {
      if (!bkState.bookedSlots[key]) bkState.bookedSlots[key] = [];
      bkState.bookedSlots[key].push(bkState.selectedTime);
    }

    // Populate confirmation card
    if (confirmedEl) {
      confirmedEl.innerHTML = `
        <div class="bk-conf-row"><strong>Name</strong><span>${fname} ${lname}</span></div>
        <div class="bk-conf-row"><strong>Email</strong><span>${email}</span></div>
        <div class="bk-conf-row"><strong>Service</strong><span>${bkState.service}</span></div>
        <div class="bk-conf-row"><strong>Date &amp; Time</strong><span>${bkState.selectedDate ? formatDateLong(bkState.selectedDate) : ''} · ${bkState.selectedTime}</span></div>
        <div class="bk-conf-row"><strong>Duration</strong><span>1 hour · Google Meet / Zoom</span></div>
        ${notes ? `<div class="bk-conf-row"><strong>Notes</strong><span>${notes}</span></div>` : ''}
      `;
    }

    // Send booking to Google Sheets
    fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        fname,
        lname,
        email,
        notes,
        service : bkState.service,
        date    : bkState.selectedDate ? formatDateLong(bkState.selectedDate) : '',
        isoDate : bkState.selectedDate ? dateKey(bkState.selectedDate) : '',
        time    : bkState.selectedTime
      })
    })
    .catch(() => {}) // silently handle network errors — booking still confirms
    .finally(() => {
      submitBtn.textContent = 'Confirm Booking';
      submitBtn.disabled = false;
      bkForm.reset();
      bkForm.querySelectorAll('.bk-input-error').forEach(el => el.classList.remove('bk-input-error'));
      goToStep(5);
    });
  });

  // Clear error styling on input
  ['bkFname','bkLname','bkEmail'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', function () {
      this.classList.remove('bk-input-error');
    });
  });

  // ── "Book Another Session" ─────────────────────────────────────────────────
  newBookingBtn?.addEventListener('click', () => {
    bkState.service      = '';
    bkState.serviceDesc  = '';
    bkState.selectedDate = null;
    bkState.selectedTime = '';
    bkState.calDate      = new Date(); bkState.calDate.setDate(1);
    goToStep(1);
  });

  // ── Initial calendar render + preload all booked slots ────────────────────
  renderBkCalendar();
  slotsLoadedPromise = fetchAllBookedSlots(); // store promise so date clicks can await it

})(); // end IIFE
