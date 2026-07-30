// DOM Elements
const navItems = document.querySelectorAll('.nav-item');
const sections = document.querySelectorAll('.section');
const pageTitle = document.getElementById('page-title');
const btnStartBot = document.getElementById('btn-start-bot');
const btnStopBot = document.getElementById('btn-stop-bot');
const sidebarStatusDot = document.getElementById('sidebar-status-dot');
const sidebarStatusText = document.getElementById('sidebar-status-text');
const menuToggle = document.getElementById('menu-toggle');
const sidebar = document.querySelector('.sidebar');

// Section titles
const sectionTitles = {
  dashboard: 'Dashboard',
  config: 'Konfigurasi',
  datainput: 'Data Pembeli',
  cookie: 'Cookie',
  logs: 'Log Bot'
};

// Navigation
navItems.forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    const section = item.dataset.section;
    switchSection(section);
    // Close sidebar on mobile
    sidebar.classList.remove('open');
  });
});

function switchSection(sectionName) {
  // Update nav
  navItems.forEach(nav => nav.classList.remove('active'));
  document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

  // Update sections
  sections.forEach(sec => sec.classList.remove('active'));
  document.getElementById(`section-${sectionName}`).classList.add('active');

  // Update title
  pageTitle.textContent = sectionTitles[sectionName] || 'Dashboard';

  // Load section data
  loadSectionData(sectionName);
}

function loadSectionData(section) {
  switch(section) {
    case 'dashboard':
      loadDashboard();
      break;
    case 'config':
      loadConfig();
      break;
    case 'datainput':
      loadDataInput();
      break;
    case 'cookie':
      loadCookie();
      break;
    case 'logs':
      loadLogs();
      break;
  }
}

// Mobile menu toggle
menuToggle.addEventListener('click', () => {
  sidebar.classList.toggle('open');
});

// Toast notifications
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icons = {
    success: 'fas fa-check-circle',
    error: 'fas fa-exclamation-circle',
    info: 'fas fa-info-circle'
  };

  toast.innerHTML = `
    <i class="${icons[type] || icons.info}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// API Helper
async function apiRequest(url, method = 'GET', body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (body) options.body = JSON.stringify(body);

  try {
    const response = await fetch(url, options);
    return await response.json();
  } catch (err) {
    return { success: false, message: 'Koneksi ke server gagal: ' + err.message };
  }
}

// Dashboard
async function loadDashboard() {
  // Load bot status
  const statusRes = await apiRequest('/api/bot/status');
  if (statusRes.success) {
    updateBotUI(statusRes.running);

    // Update mini log
    const miniLog = document.getElementById('dashboard-mini-log');
    if (statusRes.logs && statusRes.logs.length > 0) {
      miniLog.innerHTML = statusRes.logs.slice(-10).map(log =>
        `<div class="log-line ${log.includes('[ERROR]') ? 'error' : ''}">${escapeHtml(log)}</div>`
      ).join('');
    } else {
      miniLog.innerHTML = '<p class="log-empty">Belum ada log. Jalankan bot untuk melihat aktivitas.</p>';
    }
  }

  // Load data input count
  const dataRes = await apiRequest('/api/datainput');
  if (dataRes.success && dataRes.data) {
    const lines = dataRes.data.split('\n').filter(l => l.trim());
    document.getElementById('dashboard-buyer-count').textContent = `${lines.length} pembeli`;
  }

  // Load config status
  const configRes = await apiRequest('/api/config');
  if (configRes.success && configRes.data && configRes.data[0]) {
    const cfg = configRes.data[0];
    const isConfigured = cfg.api_key && cfg.api_key !== 'capsolverkalian';
    document.getElementById('dashboard-config-status').textContent =
      isConfigured ? 'Sudah dikonfigurasi' : 'Belum dikonfigurasi';
  }

  // Load cookie status
  const cookieRes = await apiRequest('/api/cookie');
  if (cookieRes.success) {
    document.getElementById('dashboard-cookie-status').textContent =
      cookieRes.data ? 'Sudah diatur' : 'Belum diatur';
  }
}

// Config
async function loadConfig() {
  const res = await apiRequest('/api/config');
  if (res.success && res.data && res.data[0]) {
    const cfg = res.data[0];
    document.getElementById('api_key').value = cfg.api_key || '';
    document.getElementById('telegram_bot_token').value = cfg.telegram_bot_token || '';
    document.getElementById('telegram_chat_id').value = cfg.telegram_chat_id || '';
  }
}

document.getElementById('config-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = {
    api_key: document.getElementById('api_key').value,
    telegram_bot_token: document.getElementById('telegram_bot_token').value,
    telegram_chat_id: document.getElementById('telegram_chat_id').value
  };

  const res = await apiRequest('/api/config', 'POST', data);
  if (res.success) {
    showToast(res.message, 'success');
  } else {
    showToast(res.message, 'error');
  }
});

// Data Input
async function loadDataInput() {
  const res = await apiRequest('/api/datainput');
  if (res.success) {
    document.getElementById('datainput_textarea').value = res.data || '';
  }
}

document.getElementById('datainput-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = document.getElementById('datainput_textarea').value;

  const res = await apiRequest('/api/datainput', 'POST', { data });
  if (res.success) {
    showToast(res.message, 'success');
  } else {
    showToast(res.message, 'error');
  }
});

// Add buyer modal
const modalAddBuyer = document.getElementById('modal-add-buyer');
const btnAddBuyer = document.getElementById('btn-add-buyer');
const modalCloseBuyer = document.getElementById('modal-close-buyer');

btnAddBuyer.addEventListener('click', () => {
  modalAddBuyer.classList.remove('hidden');
});

modalCloseBuyer.addEventListener('click', () => {
  modalAddBuyer.classList.add('hidden');
});

modalAddBuyer.querySelector('.modal-overlay').addEventListener('click', () => {
  modalAddBuyer.classList.add('hidden');
});

document.getElementById('add-buyer-form').addEventListener('submit', (e) => {
  e.preventDefault();

  const firstName = document.getElementById('buyer_first_name').value.trim();
  const lastName = document.getElementById('buyer_last_name').value.trim();
  const email = document.getElementById('buyer_email').value.trim();
  const phone = document.getElementById('buyer_phone').value.trim();
  const nik = document.getElementById('buyer_nik').value.trim();
  const gender = document.getElementById('buyer_gender').value;
  const dob = document.getElementById('buyer_dob').value;

  if (!firstName || !lastName || !email || !phone || !nik || !dob) {
    showToast('Semua field harus diisi!', 'error');
    return;
  }

  const line = `${firstName}|${lastName}|${email}|${phone}|${nik}|${gender}|${dob}`;
  const textarea = document.getElementById('datainput_textarea');
  const currentData = textarea.value.trim();
  textarea.value = currentData ? `${currentData}\n${line}` : line;

  // Reset form and close modal
  document.getElementById('add-buyer-form').reset();
  modalAddBuyer.classList.add('hidden');
  showToast('Data pembeli berhasil ditambahkan!', 'success');
});

// Cookie
async function loadCookie() {
  const res = await apiRequest('/api/cookie');
  if (res.success) {
    document.getElementById('cookie_textarea').value = res.data || '';
  }
}

document.getElementById('cookie-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = document.getElementById('cookie_textarea').value;

  const res = await apiRequest('/api/cookie', 'POST', { data });
  if (res.success) {
    showToast(res.message, 'success');
  } else {
    showToast(res.message, 'error');
  }
});

// Logs
async function loadLogs() {
  const res = await apiRequest('/api/bot/logs');
  if (res.success) {
    const container = document.getElementById('log-container');
    if (res.logs && res.logs.length > 0) {
      container.innerHTML = res.logs.map(log =>
        `<div class="log-line ${log.includes('[ERROR]') ? 'error' : ''}">${escapeHtml(log)}</div>`
      ).join('');
      container.scrollTop = container.scrollHeight;
    } else {
      container.innerHTML = '<p class="log-empty">Belum ada log. Jalankan bot untuk melihat aktivitas.</p>';
    }
  }
}

document.getElementById('btn-clear-logs').addEventListener('click', async () => {
  const res = await apiRequest('/api/bot/logs/clear', 'POST');
  if (res.success) {
    document.getElementById('log-container').innerHTML =
      '<p class="log-empty">Log telah dibersihkan.</p>';
    showToast(res.message, 'success');
  }
});

document.getElementById('btn-refresh-logs').addEventListener('click', () => {
  loadLogs();
});

// Bot Control
btnStartBot.addEventListener('click', async () => {
  const res = await apiRequest('/api/bot/start', 'POST');
  if (res.success) {
    showToast(res.message, 'success');
    updateBotUI(true);
  } else {
    showToast(res.message, 'error');
  }
});

btnStopBot.addEventListener('click', async () => {
  const res = await apiRequest('/api/bot/stop', 'POST');
  if (res.success) {
    showToast(res.message, 'success');
    updateBotUI(false);
  } else {
    showToast(res.message, 'error');
  }
});

function updateBotUI(isRunning) {
  if (isRunning) {
    btnStartBot.classList.add('hidden');
    btnStopBot.classList.remove('hidden');
    sidebarStatusDot.classList.add('active');
    sidebarStatusText.textContent = 'Bot Aktif';
    document.getElementById('dashboard-bot-status').textContent = 'Aktif';
    document.getElementById('dashboard-bot-status').style.color = 'var(--success)';
  } else {
    btnStartBot.classList.remove('hidden');
    btnStopBot.classList.add('hidden');
    sidebarStatusDot.classList.remove('active');
    sidebarStatusText.textContent = 'Bot Tidak Aktif';
    document.getElementById('dashboard-bot-status').textContent = 'Tidak Aktif';
    document.getElementById('dashboard-bot-status').style.color = 'var(--danger)';
  }
}

// Auto-refresh bot status every 5 seconds
setInterval(async () => {
  const res = await apiRequest('/api/bot/status');
  if (res.success) {
    updateBotUI(res.running);
  }
}, 5000);

// Utility
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initial load
loadDashboard();
