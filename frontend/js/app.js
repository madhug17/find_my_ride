/* ============================================================
   FIND MY RIDE — Shared UI & Location Helpers
   ============================================================ */

const CAMPUS_LOCATIONS = [
  { id: 'gate',    name: 'Main Gate',        lat: 17.5454, lng: 78.5718 },
  { id: 'library', name: 'Central Library',  lat: 17.5470, lng: 78.5730 },
  { id: 'hostelA', name: 'Hostel Block A',   lat: 17.5440, lng: 78.5745 },
  { id: 'cafe',    name: 'Cafeteria Hub',    lat: 17.5460, lng: 78.5725 },
  { id: 'csdept',  name: 'CS Department',    lat: 17.5480, lng: 78.5710 },
  { id: 'aud',     name: 'Auditorium',       lat: 17.5435, lng: 78.5705 },
  { id: 'mall',    name: 'City Mall',        lat: 17.5100, lng: 78.5500 },
  { id: 'station', name: 'Railway Station',  lat: 17.4950, lng: 78.5300 }
];

function locationById(id) {
  return CAMPUS_LOCATIONS.find(l => l.id === id);
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculateEstimatedFare(distKm) {
  if (!distKm || distKm <= 0) return 30;
  const baseFare = 30;
  const ratePerKm = 15;
  return Math.round(baseFare + (distKm * ratePerKm));
}

function toast(message, type = 'info') {
  let stack = document.querySelector('.toast-stack');
  if (!stack) {
    stack = document.createElement('div');
    stack.className = 'toast-stack';
    document.body.appendChild(stack);
  }
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `
    <span class="toast-dot ${type}"></span>
    <span class="toast-text">${escapeHtml(message)}</span>
  `;
  stack.appendChild(el);
  setTimeout(() => {
    el.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    el.style.opacity = '0';
    el.style.transform = 'translateY(-10px) scale(0.95)';
    setTimeout(() => el.remove(), 300);
  }, 3500);
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function statusBadge(status) {
  const s = String(status || '').toUpperCase();
  let badgeClass = 'badge-pending';
  let text = 'PENDING';

  if (s === 'ACCEPTED') {
    badgeClass = 'badge-accepted';
    text = 'ACCEPTED';
  } else if (s === 'STARTED' || s === 'ENROUTE') {
    badgeClass = 'badge-started';
    text = 'EN ROUTE';
  } else if (s === 'COMPLETED') {
    badgeClass = 'badge-completed';
    text = 'COMPLETED';
  } else if (s === 'CANCELLED') {
    badgeClass = 'badge-cancelled';
    text = 'CANCELLED';
  }

  return `<span class="status-badge ${badgeClass}">${text}</span>`;
}

function formatDateTime(isoString) {
  if (!isoString) return 'N/A';
  try {
    const d = new Date(isoString);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return isoString;
  }
}

function logout() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("user_email");
  localStorage.removeItem("user_role");
  toast("Logged out successfully", "info");
  setTimeout(() => {
    window.location.href = "index.html";
  }, 400);
}

window.logout = logout;
window.toast = toast;
window.statusBadge = statusBadge;