const bedrock = require('bedrock-protocol');
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

// ========== CONFIG ==========
const CONFIG = {
  host: 'donutsmp.net',
  port: 19132,
  username: 'minecart-afk-bot8',
  version: '1.26.40',
  offline: false,
  homeCommand: '/home waterbucketfarm',
  antiAfkInterval: 45_000,
  reconnectDelay: 12_000
};

// ========== STATE ==========
let client = null;
let isConnected = false;
let lastSpawn = null;
let logs = [];
let reconnectTimer = null;

function log(msg) {
  const time = new Date().toLocaleTimeString();
  const line = `[${time}] ${msg}`;
  console.log(line);
  logs.push(line);
  if (logs.length > 150) logs.shift();
  broadcast({ type: 'log', message: line });
}

function broadcast(data) {
  if (!wss) return;
  wss.clients.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  });
}

function sendStatus() {
  broadcast({
    type: 'status',
    connected: isConnected,
    username: CONFIG.username,
    lastSpawn: lastSpawn
  });
}

// ========== BOT ==========
function connect() {
  if (client) {
    try { client.close(); } catch (e) {}
  }

  log(`Connecting to \( {CONFIG.host}: \){CONFIG.port} as ${CONFIG.username}...`);

  client = bedrock.createClient({
    host: CONFIG.host,
    port: CONFIG.port,
    username: CONFIG.username,
    version: CONFIG.version,
    offline: CONFIG.offline,
    skipPing: true,
    onMsaCode: (data) => {
      log('=== MICROSOFT LOGIN NEEDED ===');
      log(`Open this link: ${data.verification_uri}`);
      log(`Enter this code: ${data.user_code}`);
      log('==============================');
    }
  });

  client.on('error', (err) => {
    log(`Error: ${err.message || err}`);
    isConnected = false;
    sendStatus();
    scheduleReconnect();
  });

  client.on('kick', (packet) => {
    log(`Kicked: ${packet.message || 'Unknown reason'}`);
    isConnected = false;
    sendStatus();
    scheduleReconnect();
  });

  client.on('close', () => {
    log('Connection closed');
    isConnected = false;
    sendStatus();
    scheduleReconnect();
  });

  client.on('spawn', () => {
    isConnected = true;
    lastSpawn = Date.now();
    log('✅ Spawned successfully!');
    sendStatus();

    // Go to home
    setTimeout(() => {
      if (isConnected && client) {
        log(`Running command: ${CONFIG.homeCommand}`);
        client.queue('text', {
          type: 'chat',
          needs_translation: false,
          source_name: client.username,
          xuid: '',
          platform_chat_id: '',
          filtered_message: '',
          message: CONFIG.homeCommand
        });
      }
    }, 4000);
  });

  client.on('text', (packet) => {
    if (packet.source_name && packet.message) {
      log(`CHAT <${packet.source_name}> ${packet.message}`);
    }
  });
}

function scheduleReconnect() {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  reconnectTimer = setTimeout(() => {
    log('Reconnecting...');
    connect();
  }, CONFIG.reconnectDelay);
}

// ========== WEB DASHBOARD ==========
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/status', (req, res) => {
  res.json({
    connected: isConnected,
    username: CONFIG.username,
    lastSpawn,
    logs: logs.slice(-40)
  });
});

wss.on('connection', (ws) => {
  sendStatus();
  logs.slice(-25).forEach(l => {
    ws.send(JSON.stringify({ type: 'log', message: l }));
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  log(`Dashboard started on port ${PORT}`);
  connect();
});
