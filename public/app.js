// Sepurane - Loket Bot Dashboard (Vercel Edition)
// All data stored in localStorage

const KEYS = { config: 'sepurane_config', data: 'sepurane_datainput', cookie: 'sepurane_cookie' };
function save(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
function load(k, d) { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : d; } catch { return d; } }

// Toast
function showToast(msg, type='info') {
  const c = document.getElementById('toast-container'), t = document.createElement('div');
  t.className = 'toast ' + type;
  const icons = { success:'fa-check-circle', error:'fa-exclamation-circle', info:'fa-info-circle' };
  t.innerHTML = `<i class="fas ${icons[type]||icons.info}"></i><span>${msg}</span>`;
  c.appendChild(t);
  setTimeout(() => { t.style.animation='slideOut 0.3s forwards'; setTimeout(()=>t.remove(),300); }, 3000);
}

// Navigation
const navItems = document.querySelectorAll('.nav-item');
const sections = document.querySelectorAll('.section');
const titles = { dashboard:'Dashboard', config:'Konfigurasi', datainput:'Data Pembeli', cookie:'Cookie', export:'Export Config', help:'Bantuan' };

navItems.forEach(n => n.addEventListener('click', e => {
  e.preventDefault();
  switchSection(n.dataset.section);
  document.getElementById('sidebar').classList.remove('open');
}));

function switchSection(name) {
  navItems.forEach(n => n.classList.remove('active'));
  document.querySelector(`[data-section="${name}"]`).classList.add('active');
  sections.forEach(s => s.classList.remove('active'));
  document.getElementById('section-' + name).classList.add('active');
  document.getElementById('page-title').textContent = titles[name] || '';
  if (name === 'dashboard') refreshDash();
  if (name === 'config') loadConfig();
  if (name === 'datainput') loadDataInput();
  if (name === 'cookie') loadCookie();
}

document.getElementById('menu-toggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});


// Dashboard
function refreshDash() {
  const cfg = load(KEYS.config, {});
  const data = load(KEYS.data, '');
  const cookie = load(KEYS.cookie, '');
  document.getElementById('dash-config-status').textContent = (cfg.api_key && cfg.api_key !== 'capsolverkalian') ? 'Sudah diatur' : 'Belum diatur';
  const lines = data ? data.split('\n').filter(l=>l.trim()) : [];
  document.getElementById('dash-buyer-count').textContent = lines.length + ' pembeli';
  document.getElementById('dash-cookie-status').textContent = cookie ? 'Sudah diatur' : 'Belum diatur';
}

// Config
function loadConfig() {
  const c = load(KEYS.config, {});
  document.getElementById('api_key').value = c.api_key || '';
  document.getElementById('telegram_bot_token').value = c.telegram_bot_token || '';
  document.getElementById('telegram_chat_id').value = c.telegram_chat_id || '';
}

document.getElementById('config-form').addEventListener('submit', e => {
  e.preventDefault();
  save(KEYS.config, {
    api_key: document.getElementById('api_key').value.trim(),
    telegram_bot_token: document.getElementById('telegram_bot_token').value.trim(),
    telegram_chat_id: document.getElementById('telegram_chat_id').value.trim()
  });
  showToast('Konfigurasi disimpan!', 'success');
});

document.getElementById('btn-reset-config').addEventListener('click', () => {
  if (confirm('Reset konfigurasi?')) { localStorage.removeItem(KEYS.config); loadConfig(); showToast('Config direset.', 'info'); }
});


// Data Input
function loadDataInput() {
  const d = load(KEYS.data, '');
  document.getElementById('datainput_textarea').value = d;
  renderTable(d);
}

function renderTable(data) {
  const tbody = document.getElementById('buyer-table-body');
  const lines = data ? data.split('\n').filter(l=>l.trim()) : [];
  if (!lines.length) { tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">Belum ada data</td></tr>'; return; }
  tbody.innerHTML = lines.map((l,i) => {
    const p = l.split('|');
    return `<tr><td>${i+1}</td><td>${esc(p[0]||'')} ${esc(p[1]||'')}</td><td>${esc(p[2]||'')}</td><td>${esc(p[3]||'')}</td><td>${esc(p[4]||'')}</td><td>${p[5]==='1'?'L':'P'}</td><td>${esc(p[6]||'')}</td><td><button class="btn-icon" onclick="removeBuyer(${i})"><i class="fas fa-trash"></i></button></td></tr>`;
  }).join('');
}

document.getElementById('datainput-form').addEventListener('submit', e => {
  e.preventDefault();
  const d = document.getElementById('datainput_textarea').value;
  save(KEYS.data, d);
  renderTable(d);
  showToast('Data pembeli disimpan!', 'success');
});

document.getElementById('btn-clear-buyers').addEventListener('click', () => {
  if (confirm('Hapus semua data pembeli?')) { localStorage.removeItem(KEYS.data); document.getElementById('datainput_textarea').value=''; renderTable(''); showToast('Data dihapus.','info'); }
});

function removeBuyer(i) {
  const d = load(KEYS.data, '');
  const lines = d.split('\n').filter(l=>l.trim());
  lines.splice(i, 1);
  const nd = lines.join('\n');
  save(KEYS.data, nd);
  document.getElementById('datainput_textarea').value = nd;
  renderTable(nd);
  showToast('Pembeli dihapus.', 'info');
}

// Add Buyer Modal
const modal = document.getElementById('modal-add-buyer');
document.getElementById('btn-add-buyer').addEventListener('click', () => modal.classList.remove('hidden'));
document.getElementById('modal-close-buyer').addEventListener('click', () => modal.classList.add('hidden'));
modal.querySelector('.modal-overlay').addEventListener('click', () => modal.classList.add('hidden'));

document.getElementById('add-buyer-form').addEventListener('submit', e => {
  e.preventDefault();
  const fn=document.getElementById('buyer_first_name').value.trim(), ln=document.getElementById('buyer_last_name').value.trim();
  const em=document.getElementById('buyer_email').value.trim(), ph=document.getElementById('buyer_phone').value.trim();
  const nk=document.getElementById('buyer_nik').value.trim(), gn=document.getElementById('buyer_gender').value;
  const db=document.getElementById('buyer_dob').value;
  if (!fn||!ln||!em||!ph||!nk||!db) { showToast('Semua field harus diisi!','error'); return; }
  const line = `${fn}|${ln}|${em}|${ph}|${nk}|${gn}|${db}`;
  const ta = document.getElementById('datainput_textarea');
  ta.value = ta.value.trim() ? ta.value.trim()+'\n'+line : line;
  document.getElementById('add-buyer-form').reset();
  modal.classList.add('hidden');
  showToast('Pembeli ditambahkan! Klik Simpan.', 'success');
});


// Cookie
function loadCookie() { document.getElementById('cookie_textarea').value = load(KEYS.cookie, ''); }

document.getElementById('cookie-form').addEventListener('submit', e => {
  e.preventDefault();
  save(KEYS.cookie, document.getElementById('cookie_textarea').value);
  showToast('Cookie disimpan!', 'success');
});

document.getElementById('btn-clear-cookie').addEventListener('click', () => {
  if (confirm('Hapus cookie?')) { localStorage.removeItem(KEYS.cookie); document.getElementById('cookie_textarea').value=''; showToast('Cookie dihapus.','info'); }
});

// Export
function dlFile(name, content) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], {type:'text/plain'}));
  a.download = name; document.body.appendChild(a); a.click(); a.remove();
}

document.getElementById('btn-dl-config').addEventListener('click', () => {
  const c = load(KEYS.config, {api_key:'',telegram_bot_token:'',telegram_chat_id:''});
  dlFile('configloket.json', JSON.stringify([c], null, 4));
  showToast('configloket.json downloaded!', 'success');
});

document.getElementById('btn-dl-data').addEventListener('click', () => {
  const d = load(KEYS.data, '');
  if (!d) { showToast('Tidak ada data pembeli.','error'); return; }
  dlFile('datainput.txt', d);
  showToast('datainput.txt downloaded!', 'success');
});

document.getElementById('btn-dl-cookie').addEventListener('click', () => {
  const c = load(KEYS.cookie, '');
  if (!c) { showToast('Tidak ada cookie.','error'); return; }
  dlFile('cookieLoket.txt', c);
  showToast('cookieLoket.txt downloaded!', 'success');
});

document.getElementById('btn-dl-all').addEventListener('click', () => {
  document.getElementById('btn-dl-config').click();
  setTimeout(() => document.getElementById('btn-dl-data').click(), 500);
  setTimeout(() => document.getElementById('btn-dl-cookie').click(), 1000);
});

document.getElementById('btn-export-all').addEventListener('click', () => {
  document.getElementById('btn-dl-all').click();
});


// Import
const modalImport = document.getElementById('modal-import');
document.getElementById('btn-import').addEventListener('click', () => modalImport.classList.remove('hidden'));
document.getElementById('modal-close-import').addEventListener('click', () => modalImport.classList.add('hidden'));
modalImport.querySelector('.modal-overlay').addEventListener('click', () => modalImport.classList.add('hidden'));

document.getElementById('btn-do-import').addEventListener('click', () => {
  const type = document.getElementById('import-type').value;
  const file = document.getElementById('import-file').files[0];
  if (!file) { showToast('Pilih file!','error'); return; }
  const reader = new FileReader();
  reader.onload = e => {
    const content = e.target.result;
    try {
      if (type==='config') { const p = JSON.parse(content); save(KEYS.config, Array.isArray(p)?p[0]:p); }
      else if (type==='datainput') { save(KEYS.data, content.trim()); }
      else { save(KEYS.cookie, content.trim()); }
      showToast('Import berhasil!','success');
      modalImport.classList.add('hidden');
      refreshDash();
    } catch { showToast('Format file tidak valid.','error'); }
  };
  reader.readAsText(file);
});

// Utility
function esc(s) { const d=document.createElement('div'); d.textContent=s; return d.innerHTML; }

// Init
refreshDash();
