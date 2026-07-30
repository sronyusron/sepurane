// Sepurane Bot Dashboard - Localhost Version
const $ = id => document.getElementById(id);

function showToast(msg, type='info') {
  const c=$('toast-container'), t=document.createElement('div');
  t.className='toast '+type;
  const ic={success:'fa-check-circle',error:'fa-exclamation-circle',info:'fa-info-circle'};
  t.innerHTML=`<i class="fas ${ic[type]||ic.info}"></i><span>${msg}</span>`;
  c.appendChild(t);
  setTimeout(()=>{t.style.animation='slideOut 0.3s forwards';setTimeout(()=>t.remove(),300);},3000);
}

async function api(url, method='GET', body=null) {
  const opts={method, headers:{'Content-Type':'application/json'}};
  if(body) opts.body=JSON.stringify(body);
  try{const r=await fetch(url,opts);return await r.json();}
  catch(e){return{success:false,message:'Koneksi gagal: '+e.message};}
}

function esc(s){const d=document.createElement('div');d.textContent=s;return d.innerHTML;}

// Navigation
const titles={dashboard:'Dashboard',config:'Konfigurasi',datainput:'Data Pembeli',cookie:'Cookie (Hasil)',logs:'Log Bot'};
document.querySelectorAll('.sidebar-nav a').forEach(n=>n.addEventListener('click',e=>{
  e.preventDefault();switchSection(n.dataset.section);$('sidebar').classList.remove('open');
}));
function switchSection(name){
  document.querySelectorAll('.sidebar-nav a').forEach(n=>n.classList.remove('active'));
  document.querySelector(`[data-section="${name}"]`).classList.add('active');
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
  $('section-'+name).classList.add('active');
  $('page-title').textContent=titles[name]||'';
  if(name==='dashboard')loadDashboard();
  if(name==='config')loadConfig();
  if(name==='datainput')loadDataInput();
  if(name==='cookie')loadCookie();
  if(name==='logs')loadLogs();
}
$('menu-toggle').addEventListener('click',()=>$('sidebar').classList.toggle('open'));

// Dashboard
async function loadDashboard(){
  const st=await api('/api/bot/status');
  if(st.success){updateBotUI(st.running);const el=$('dash-log');
    if(st.logs&&st.logs.length){el.innerHTML=st.logs.slice(-8).map(l=>`<div class="log-line ${l.type==='error'?'error':l.type==='success'?'success':''}">[${l.time}] ${esc(l.msg)}</div>`).join('');}
    else{el.innerHTML='<p class="log-empty">Belum ada log.</p>';}}
  const di=await api('/api/datainput');
  if(di.success){const lines=di.data?di.data.split('\n').filter(l=>l.trim()):[];$('dash-buyers').textContent=lines.length+' pembeli';}
  const cfg=await api('/api/config');
  if(cfg.success&&cfg.data&&cfg.data[0]){const c=cfg.data[0];$('dash-config').textContent=(c.api_key&&c.api_key!=='capsolverkalian')?'Sudah diatur':'Belum diatur';}
  const ck=await api('/api/cookie');
  if(ck.success){$('dash-cookie').textContent=ck.data?'Ada':'Belum ada';}
}

// Config
async function loadConfig(){
  const r=await api('/api/config');
  if(r.success&&r.data&&r.data[0]){$('api_key').value=r.data[0].api_key||'';$('telegram_bot_token').value=r.data[0].telegram_bot_token||'';$('telegram_chat_id').value=r.data[0].telegram_chat_id||'';}
}
$('config-form').addEventListener('submit',async e=>{
  e.preventDefault();
  const r=await api('/api/config','POST',{api_key:$('api_key').value.trim(),telegram_bot_token:$('telegram_bot_token').value.trim(),telegram_chat_id:$('telegram_chat_id').value.trim()});
  showToast(r.message,r.success?'success':'error');
});

// Data Input
async function loadDataInput(){const r=await api('/api/datainput');if(r.success)$('datainput_textarea').value=r.data||'';}
$('datainput-form').addEventListener('submit',async e=>{
  e.preventDefault();
  const r=await api('/api/datainput','POST',{data:$('datainput_textarea').value});
  showToast(r.message,r.success?'success':'error');
});

// Add Buyer Modal
const bModal=$('modal-buyer');
$('btn-add-buyer').addEventListener('click',()=>bModal.classList.remove('hidden'));
$('close-buyer-modal').addEventListener('click',()=>bModal.classList.add('hidden'));
bModal.querySelector('.modal-bg').addEventListener('click',()=>bModal.classList.add('hidden'));
$('buyer-form').addEventListener('submit',e=>{
  e.preventDefault();
  const fn=$('b_fn').value.trim(),ln=$('b_ln').value.trim(),em=$('b_em').value.trim();
  const hp=$('b_hp').value.trim(),nik=$('b_nik').value.trim(),jk=$('b_jk').value,dob=$('b_dob').value;
  if(!fn||!ln||!em||!hp||!nik||!dob){showToast('Semua field harus diisi!','error');return;}
  const ta=$('datainput_textarea');
  ta.value=(ta.value.trim()?ta.value.trim()+'\n':'')+`${fn}|${ln}|${em}|${hp}|${nik}|${jk}|${dob}`;
  $('buyer-form').reset();bModal.classList.add('hidden');
  showToast('Ditambahkan! Klik Simpan.','success');
});

// Cookie (read-only)
async function loadCookie(){
  const r=await api('/api/cookie');const el=$('cookie-content');
  if(r.success&&r.data){el.textContent=r.data;el.className='cookie-display';}
  else{el.innerHTML='<span class="cookie-empty">Belum ada cookie. Jalankan bot dan tunggu order berhasil.</span>';}
}
$('btn-refresh-cookie').addEventListener('click',loadCookie);

// Logs
async function loadLogs(){
  const r=await api('/api/bot/logs');const el=$('log-container');
  if(r.success&&r.logs&&r.logs.length){el.innerHTML=r.logs.map(l=>`<div class="log-line ${l.type==='error'?'error':l.type==='success'?'success':''}">[${l.time}] ${esc(l.msg)}</div>`).join('');el.scrollTop=el.scrollHeight;}
  else{el.innerHTML='<p class="log-empty">Belum ada log.</p>';}
}
$('btn-clear-logs').addEventListener('click',async()=>{const r=await api('/api/bot/logs/clear','POST');if(r.success){$('log-container').innerHTML='<p class="log-empty">Log dibersihkan.</p>';showToast(r.message,'success');}});
$('btn-refresh-logs').addEventListener('click',loadLogs);

// Bot Control - Start Wizard
const modeModal=$('modal-mode');
$('btn-start').addEventListener('click', async()=>{
  modeModal.classList.remove('hidden');
  // Load buyer data into radio list
  const r = await api('/api/datainput');
  const listEl = $('s_buyers_list');
  if(r.success && r.data) {
    const lines = r.data.split('\n').filter(l=>l.trim());
    if(lines.length) {
      listEl.innerHTML = lines.map((line, i) => {
        const parts = line.split('|');
        const name = `${parts[0]||''} ${parts[1]||''}`.trim();
        const email = parts[2]||'';
        return `<div class="buyer-check-item">
          <input type="radio" name="buyer_select" id="buyer_chk_${i}" value="${i+1}" ${i===0?'checked':''}>
          <label for="buyer_chk_${i}"><strong>${name}</strong> - ${email}</label>
        </div>`;
      }).join('');
    } else {
      listEl.innerHTML = '<p class="text-muted" style="font-size:0.8rem;padding:12px;">Belum ada data pembeli. Tambahkan di halaman Data Pembeli.</p>';
    }
  }
});
$('close-mode-modal').addEventListener('click',()=>modeModal.classList.add('hidden'));
modeModal.querySelector('.modal-bg').addEventListener('click',()=>modeModal.classList.add('hidden'));

// Show/hide fields based on mode
$('s_mode').addEventListener('change', ()=>{
  const mode = $('s_mode').value;
  $('fg-link').classList.toggle('hidden', mode==='2');
  $('fg-domain').classList.toggle('hidden', mode!=='2');
  $('fg-clue').classList.toggle('hidden', mode!=='2');
  $('fg-day').classList.toggle('hidden', mode!=='2');
});

$('start-bot-form').addEventListener('submit', async(e)=>{
  e.preventDefault();
  
  // Get selected buyer (single radio)
  const selectedRadio = document.querySelector('#s_buyers_list input[type="radio"]:checked');
  if(!selectedRadio) {
    showToast('Pilih 1 data pembeli!', 'error');
    return;
  }
  const selectedBuyer = parseInt(selectedRadio.value);

  modeModal.classList.add('hidden');

  const answers = {
    mode: $('s_mode').value,
    captcha: $('s_captcha').value,
    selectedBuyer: selectedBuyer, // 1-based index of selected buyer
    totalTicket: $('s_total').value || '1',
    keyword: $('s_keyword').value,
    keywordCadangan: $('s_keyword2').value,
    kodeUndangan: $('s_kode').value,
    showVa: $('s_va').value,
    linkEvent: $('s_link').value,
    domain: $('s_domain').value,
    clue: $('s_clue').value,
    day: $('s_day').value,
    waktu: $('s_waktu').value,
    captchaBefore: $('s_captcha_before').value || '10'
  };

  showToast('Memulai bot...','info');
  const r = await api('/api/bot/start','POST',{answers});
  showToast(r.message, r.success?'success':'error');
  if(r.success) updateBotUI(true);
});

$('btn-stop').addEventListener('click',async()=>{
  const r=await api('/api/bot/stop','POST');
  showToast(r.message,r.success?'success':'error');
  if(r.success)updateBotUI(false);
});

function updateBotUI(running){
  $('btn-start').classList.toggle('hidden',running);
  $('btn-stop').classList.toggle('hidden',!running);
  $('sidebar-dot').classList.toggle('active',running);
  $('sidebar-status').textContent=running?'Bot Aktif':'Bot Mati';
  $('dash-status').textContent=running?'Aktif':'Tidak Aktif';
  $('dash-status').style.color=running?'var(--success)':'var(--danger)';
}

setInterval(async()=>{
  const r=await api('/api/bot/status');
  if(r.success){
    updateBotUI(r.running);
    // Auto-refresh logs when bot is running
    if(r.running && r.logs && r.logs.length){
      const el=$('dash-log');
      el.innerHTML=r.logs.slice(-8).map(l=>`<div class="log-line ${l.type==='error'?'error':l.type==='success'?'success':''}">[${l.time}] ${esc(l.msg)}</div>`).join('');
      // Also update full log if on logs page
      const logEl=$('log-container');
      if(!logEl.closest('.section').classList.contains('hidden')){
        logEl.innerHTML=r.logs.map(l=>`<div class="log-line ${l.type==='error'?'error':l.type==='success'?'success':''}">[${l.time}] ${esc(l.msg)}</div>`).join('');
        logEl.scrollTop=logEl.scrollHeight;
      }
    }
  }
},2000); // Poll every 2 seconds

// Init
loadDashboard();
