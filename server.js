const express = require('express');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Store bot process reference
let botProcess = null;
let botLogs = [];
const MAX_LOGS = 500;

// Helper: Read config file
function readConfig() {
  try {
    const data = fs.readFileSync(path.join(__dirname, 'configloket.json'), 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [{ api_key: '', telegram_bot_token: '', telegram_chat_id: '' }];
  }
}

// Helper: Write config file
function writeConfig(config) {
  fs.writeFileSync(
    path.join(__dirname, 'configloket.json'),
    JSON.stringify(config, null, 4),
    'utf8'
  );
}

// Helper: Read data input file
function readDataInput() {
  try {
    const data = fs.readFileSync(path.join(__dirname, 'datainput.txt'), 'utf8');
    return data.trim();
  } catch (err) {
    return '';
  }
}

// Helper: Write data input file
function writeDataInput(data) {
  fs.writeFileSync(path.join(__dirname, 'datainput.txt'), data, 'utf8');
}

// Helper: Read cookie file
function readCookie() {
  try {
    const data = fs.readFileSync(path.join(__dirname, 'cookieLoket.txt'), 'utf8');
    return data.trim();
  } catch (err) {
    return '';
  }
}

// Helper: Write cookie file
function writeCookie(data) {
  fs.writeFileSync(path.join(__dirname, 'cookieLoket.txt'), data, 'utf8');
}

// API: Get configuration
app.get('/api/config', (req, res) => {
  const config = readConfig();
  res.json({ success: true, data: config });
});

// API: Save configuration
app.post('/api/config', (req, res) => {
  try {
    const { api_key, telegram_bot_token, telegram_chat_id } = req.body;
    const config = [{
      api_key: api_key || '',
      telegram_bot_token: telegram_bot_token || '',
      telegram_chat_id: telegram_chat_id || ''
    }];
    writeConfig(config);
    res.json({ success: true, message: 'Konfigurasi berhasil disimpan!' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal menyimpan konfigurasi: ' + err.message });
  }
});

// API: Get data input
app.get('/api/datainput', (req, res) => {
  const data = readDataInput();
  res.json({ success: true, data });
});

// API: Save data input
app.post('/api/datainput', (req, res) => {
  try {
    const { data } = req.body;
    writeDataInput(data || '');
    res.json({ success: true, message: 'Data input berhasil disimpan!' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal menyimpan data input: ' + err.message });
  }
});

// API: Get cookie
app.get('/api/cookie', (req, res) => {
  const data = readCookie();
  res.json({ success: true, data });
});

// API: Save cookie
app.post('/api/cookie', (req, res) => {
  try {
    const { data } = req.body;
    writeCookie(data || '');
    res.json({ success: true, message: 'Cookie berhasil disimpan!' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal menyimpan cookie: ' + err.message });
  }
});

// API: Get bot status
app.get('/api/bot/status', (req, res) => {
  const isRunning = botProcess !== null && !botProcess.killed;
  res.json({
    success: true,
    running: isRunning,
    logs: botLogs.slice(-100)
  });
});

// API: Get bot logs
app.get('/api/bot/logs', (req, res) => {
  res.json({ success: true, logs: botLogs.slice(-200) });
});

// API: Clear bot logs
app.post('/api/bot/logs/clear', (req, res) => {
  botLogs = [];
  res.json({ success: true, message: 'Log berhasil dibersihkan!' });
});

// API: Start bot
app.post('/api/bot/start', (req, res) => {
  if (botProcess && !botProcess.killed) {
    return res.json({ success: false, message: 'Bot sudah berjalan!' });
  }

  try {
    botLogs = [];
    const timestamp = new Date().toLocaleString('id-ID');
    botLogs.push(`[${timestamp}] Bot dimulai...`);

    botProcess = spawn('node', ['loketbot.js'], {
      cwd: __dirname,
      env: { ...process.env }
    });

    botProcess.stdout.on('data', (data) => {
      const lines = data.toString().split('\n').filter(l => l.trim());
      lines.forEach(line => {
        const ts = new Date().toLocaleString('id-ID');
        botLogs.push(`[${ts}] ${line}`);
        if (botLogs.length > MAX_LOGS) botLogs.shift();
      });
    });

    botProcess.stderr.on('data', (data) => {
      const lines = data.toString().split('\n').filter(l => l.trim());
      lines.forEach(line => {
        const ts = new Date().toLocaleString('id-ID');
        botLogs.push(`[${ts}] [ERROR] ${line}`);
        if (botLogs.length > MAX_LOGS) botLogs.shift();
      });
    });

    botProcess.on('close', (code) => {
      const ts = new Date().toLocaleString('id-ID');
      botLogs.push(`[${ts}] Bot berhenti dengan kode: ${code}`);
      botProcess = null;
    });

    botProcess.on('error', (err) => {
      const ts = new Date().toLocaleString('id-ID');
      botLogs.push(`[${ts}] [ERROR] Gagal menjalankan bot: ${err.message}`);
      botProcess = null;
    });

    res.json({ success: true, message: 'Bot berhasil dijalankan!' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal menjalankan bot: ' + err.message });
  }
});

// API: Stop bot
app.post('/api/bot/stop', (req, res) => {
  if (!botProcess || botProcess.killed) {
    return res.json({ success: false, message: 'Bot tidak sedang berjalan!' });
  }

  try {
    botProcess.kill('SIGTERM');
    const ts = new Date().toLocaleString('id-ID');
    botLogs.push(`[${ts}] Bot dihentikan oleh pengguna.`);
    botProcess = null;
    res.json({ success: true, message: 'Bot berhasil dihentikan!' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal menghentikan bot: ' + err.message });
  }
});

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
