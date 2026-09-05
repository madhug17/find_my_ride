/* ============================================================
   CAMPUS RIDES — shared UI helpers
   ============================================================ */

/* Fixed campus points used by the booking map. Coordinates are
   plotted in a 300x200 viewBox shared by every map render. */
const LOCATIONS = [
  { id: 'gate',    name: 'Main Gate',        x: 24,  y: 168 },
  { id: 'library', name: 'Library',          x: 92,  y: 58  },
  { id: 'hostelA', name: 'Hostel Block A',   x: 188, y: 152 },
  { id: 'cafe',    name: 'Cafeteria',        x: 142, y: 34  },
  { id: 'csdept',  name: 'CS Department',    x: 244, y: 92  },
  { id: 'aud',     name: 'Auditorium',       x: 58,  y: 118 },
  { id: 'mall',    name: 'City Mall',        x: 276, y: 170 },
  { id: 'station', name: 'Railway Station',  x: 258, y: 20  }
];
function locationById(id) { return LOCATIONS.find(l => l.id === id); }

function toast(message, type = 'info') {
  let stack = document.querySelector('.toast-stack');
  if (!stack) {
    stack = document.createElement('div');
    stack.className = 'toast-stack';
    document.body.appendChild(stack);
  }
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  stack.appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity .25s ease, transform .25s ease';
    el.style.opacity = '0';
    el.style.transform = 'translateY(-6px)';
    setTimeout(() => el.remove(), 250);
  }, 3200);
}

function requireStudent() {
  const student = API.currentStudent();
  if (!student) { window.location.href = 'login.html'; return null; }
  return student;
}
function requireDriver() {
  const driver = API.currentDriver();
  if (!driver) { window.location.href = 'driver-login.html'; return null; }
  return driver;
}

function initials(name) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
}

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  return `${h} hr ago`;
}

function money(n) { return `₹${n}`; }

const STATUS_LABEL = {
  searching: 'Finding a ride',
  accepted: 'Driver on the way',
  enroute: 'Trip in progress',
  arrived: 'Arrived at drop',
  completed: 'Completed',
  cancelled: 'Cancelled'
};
const STATUS_PILL_CLASS = {
  searching: 'pill-searching',
  accepted: 'pill-accepted',
  enroute: 'pill-enroute',
  arrived: 'pill-arrived',
  completed: 'pill-completed',
  cancelled: 'pill-cancelled'
};

function statusPill(status) {
  return `<span class="pill ${STATUS_PILL_CLASS[status] || ''}"><span class="pill-dot"></span>${STATUS_LABEL[status] || status}</span>`;
}

function wireLogoutButtons() {
  document.querySelectorAll('[data-logout]').forEach(btn => {
    btn.addEventListener('click', () => {
      API.logout();
      window.location.href = 'index.html';
    });
  });
}
document.addEventListener('DOMContentLoaded', wireLogoutButtons);