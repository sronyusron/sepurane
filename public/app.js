// ============================================================
// Sepurane - Loket Bot Dashboard (Vercel Edition)
// All data stored in localStorage - no backend needed
// ============================================================

// --- Storage Keys ---
const STORAGE_KEYS = {
  config: 'sepurane_config',
  datainput: 'sepurane_datainput',
  cookie: 'sepurane_cookie'
};

// --- Storage Helpers ---
function saveData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function loadData(key, defaultValue = null) {
  const raw = localStorage.getItem(key);
  if (!raw) return defaultValue;
  try { return JSON.parse(raw); }
  catch { return defaultValue; }
}


// --- Toast Notification ---
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = { success: 'fas fa-check-circle', error: 'fas fa-exclamation-circle', info: 'fas fa-info-circle' };
  toast.innerHTML = `<i class="${icons[type] || icons.info}"></i><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// --- Navigation ---
const navItems = document.querySelectorAll('.nav-item');
const sections = document.querySelectorAll('.section');
const pageTitle = document.getElementById('page-title');
const sectionTitles = {
  dashboard: 'Dashboard', config: 'Konfigurasi',
  datainput: 'Data Pembeli', cookie: 'Cookie',
  export: 'Export Config', help: 'Bantuan'
};

navItems.forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    switchSection(item.dataset.section);
    document.getElementById('sidebar').classList.remove('open');
  });
});

function switchSection(name) {
  navItems.forEach(n => n.classList.remove('active'));
  document.querySelector(`[data-section="${name}"]`).classList.add('active');
  sections.forEach(s => s.classList.remove('active'));
  document.getElementById(`section-${name}`).classList.add('active');
  pageTitle.textContent = sectionTitles[name] || 'Dashboard';
  if (name === 'dashboard') refreshDashboard();
  if (name === 'config') loadConfigForm();
  if (name === 'datainput') loadDataInputForm();
  if (name === 'cookie') loadCookieForm();
}

// Mobile menu
document.getElementById('menu-toggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});


// --- Dashboard ---
function refreshDashboard() {
  const config = loadData(STORAGE_KEYS.config);
  const datainput = loadData(STORAGE_KEYS.datainput, '');
  const cookie = loadData(STORAGE_KEYS.cookie, '');

  // Config status
  const configOk = config && config.api_key && config.api_key !== 'capsolverkalian';
  document.getElementById('dash-config-status').textContent = configOk ? 'Sudah diatur' : 'Belum diatur';

  // Buyer count
  const lines = datainput ? datainput.split('\n').filter(l => l.trim()) : [];
  document.getElementById('dash-buyer-count').textContent = `${lines.length} pembeli`;

  // Cookie status
  document.getElementById('dash-cookie-status').textContent = cookie ? 'Sudah diatur' : 'Belum diatur';
}

// --- Config Form ---
function loadConfigForm() {
  const config = loadData(STORAGE_KEYS.config, { api_key: '', telegram_bot_token: '', telegram_chat_id: '' });
  document.getElementById('api_key').value = config.api_key || '';
  document.getElementById('telegram_bot_token').value = config.telegram_bot_token || '';
  document.getElementById('telegram_chat_id').value = config.telegram_chat_id || '';
}

document.getElementById('config-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const config = {
    api_key: document.getElementById('api_key').value.trim(),
    telegram_bot_token: document.getElementById('telegram_bot_token').value.trim(),
    telegram_chat_id: document.getElementById('telegram_chat_id').value.trim()
  };
  saveData(STORAGE_KEYS.config, config);
  showToast('Konfigurasi berhasil disimpan!', 'success');
});

document.getElementById('btn-reset-config').addEventListener('click', () => {
  if (confirm('Yakin ingin mereset konfigurasi?')) {
    localStorage.removeItem(STORAGE_KEYS.config);
    loadConfigForm();
    showToast('Konfigurasi direset.', 'info');
  }
});


// --- Data Input ---
function loadDataInputForm() {
  const data = loadData(STORAGE_KEYS.datainput, '');
  document.getElementById('datainput_textarea').value = data;
  renderBuyerTable(data);
}

function renderBuyerTable(data) {
  const tbody = document.getElementById('buyer-table-body');
  const lines = data ? data.split('\n').filter(l => l.trim()) : [];

  if (lines.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">Belum ada data pembeli</td></tr>';
    return;
  }

  tbody.innerHTML = lines.map((line, i) => {
    const parts = line.split('|');
    const gender = parts[5] === '1' ? 'L' : 'P';
    return `<tr>
      <td>${i + 1}</td>
      <td>${esc(parts[0] || '')} ${esc(parts[1] || '')}</td>
      <td>${esc(parts[2] || '')}</td>
      <td>${esc(parts[3] || '')}</td>
      <td>${esc(parts[4] || '')}</td>
      <td>${gender}</td>
      <td>${esc(parts[6] || '')}</td>
      <td><button class="btn-icon" onclick="removeBuyer(${i})"><i class="fas fa-trash"></i></button></td>
    </tr>`;
  }).join('');
}

document.getElementById('datainput-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const data = document.getElementById('datainput_textarea').value;
  saveData(STORAGE_KEYS.datainput, data);
  renderBuyerTable(data);
  showToast('Data pembeli berhasil disimpan!', 'success');
});

document.getElementById('btn-clear-buyers').addEventListener('click', () => {
  if (confirm('Yakin ingin menghapus semua data pembeli?')) {
    localStorage.removeItem(STORAGE_KEYS.datainput);
    document.getElementById('datainput_textarea').value = '';
    renderBuyerTable('');
    showToast('Data pembeli dihapus.', 'info');
  }
});

function removeBuyer(index) {
  const data = loadData(STORAGE_KEYS.datainput, '');
  const lines = data.split('\n').filter(l => l.trim());
  lines.splice(index, 1);
  const newData = lines.join('\n');
  saveData(STORAGE_KEYS.datainput, newData);
  document.getElementById('datainput_textarea').value = newData;
  renderBuyerTable(newData);
  showToast('Pembeli dihapus.', 'info');
}


// --- Add Buyer Modal ---
const modalAddBuyer = document.getElementById('modal-add-buyer');
document.getElementById('btn-add-buyer').addEventListener('click', () => modalAddBuyer.classList.remove('hidden'));
document.getElementById('modal-close-buyer').addEventListener('click', () => modalAddBuyer.classList.add('hidden'));
modalAddBuyer.querySelector('.modal-overlay').addEventListener('click', () => modalAddBuyer.classList.add('hidden'));

document.getElementById('add-buyer-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const fn = document.getElementById('buyer_first_name').value.trim();
  const ln = document.getElementById('buyer_last_name').value.trim();
  const em = document.getElementById('buyer_email').value.trim();
  const ph = document.getElementById('buyer_phone').value.trim();
  const nk = document.getElementById('buyer_nik').value.trim();
  const gn = document.getElementById('buyer_gender').value;
  const db = document.getElementById('buyer_dob').value;

  if (!fn || !ln || !em || !ph || !nk || !db) {
    showToast('Semua field harus diisi!', 'error');
    return;
  }

  const line = `${fn}|${ln}|${em}|${ph}|${nk}|${gn}|${db}`;
  const textarea = document.getElementById('datainput_textarea');
  const current = textarea.value.trim();
  textarea.value = current ? `${current}\n${line}` : line;

  document.getElementById('add-buyer-form').reset();
  modalAddBuyer.classList.add('hidden');
  showToast('Pembeli ditambahkan! Jangan lupa klik Simpan.', 'success');
});

// --- Cookie ---
function loadCookieForm() {
  const cookie = loadData(STORAGE_KEYS.cookie, '');
  document.getElementById('cookie_textarea').value = cookie;
}

document.getElementById('cookie-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const data = document.getElementById('cookie_textarea').value;
  saveData(STORAGE_KEYS.cookie, data);
  showToast('Cookie berhasil disimpan!', 'success');
});

document.getElementById('btn-clear-cookie').addEventListener('click', () => {
  if (confirm('Yakin ingin menghapus cookie?')) {
    localStorage.removeItem(STORAGE_KEYS.cookie);
    document.getElementById('cookie_textarea').value = '';
    showToast('Cookie dihapus.', 'info');
  }
});


// --- Export Functions ---
function downloadFile(filename, content) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportConfigFile() {
  const config = loadData(STORAGE_KEYS.config, { api_key: '', telegram_bot_token: '', telegram_chat_id: '' });
  const content = JSON.stringify([config], null, 4);
  downloadFile('configloket.json', content);
  showToast('configloket.json berhasil di-download!', 'success');
}

function exportDataInputFile() {
  const data = loadData(STORAGE_KEYS.datainput, '');
  if (!data) { showToast('Tidak ada data pembeli untuk di-export.', 'error'); return; }
  downloadFile('datainput.txt', data);
  showToast('datainput.txt berhasil di-download!', 'success');
}

function exportCookieFile() {
  const data = loadData(STORAGE_KEYS.cookie, '');
  if (!data) { showToast('Tidak ada cookie untuk di-export.', 'error'); return; }
  downloadFile('cookieLoket.txt', data);
  showToast('cookieLoket.txt berhasil di-download!', 'success');
}

function exportAll() {
  exportConfigFile();
  setTimeout(() => exportDataInputFile(), 500);
  setTimeout(() => exportCookieFile(), 1000);
}

// Header buttons
document.getElementById('btn-export-all').addEventListener('click', exportAll);


// --- Import Function ---
const modalImport = document.getElementById('modal-import');
document.getElementById('btn-import').addEventListener('click', () => modalImport.classList.remove('hidden'));
document.getElementById('modal-close-import').addEventListener('click', () => modalImport.classList.add('hidden'));
modalImport.querySelector('.modal-overlay').addEventListener('click', () => modalImport.classList.add('hidden'));

document.getElementById('btn-do-import').addEventListener('click', () => {
  const type = document.getElementById('import-type').value;
  const fileInput = document.getElementById('import-file');
  const file = fileInput.files[0];

  if (!file) {
    showToast('Pilih file terlebih dahulu!', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const content = e.target.result;
    try {
      if (type === 'config') {
        const parsed = JSON.parse(content);
        const cfg = Array.isArray(parsed) ? parsed[0] : parsed;
        saveData(STORAGE_KEYS.config, cfg);
        showToast('Config berhasil di-import!', 'success');
      } else if (type === 'datainput') {
        saveData(STORAGE_KEYS.datainput, content.trim());
        showToast('Data pembeli berhasil di-import!', 'success');
      } else if (type === 'cookie') {
        saveData(STORAGE_KEYS.cookie, content.trim());
        showToast('Cookie berhasil di-import!', 'success');
      }
      modalImport.classList.add('hidden');
      fileInput.value = '';
      refreshDashboard();
    } catch (err) {
      showToast('Gagal import: format file tidak valid.', 'error');
    }
  };
  reader.readAsText(file);
});

// --- Utility ---
function esc(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// --- Init ---
refreshDashboard();
