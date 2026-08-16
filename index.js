const bedrock = require('bedrock-protocol');
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const CONFIG = {
  host: 'donutsmp.net',
  port: 19132,
  username: 'minecart-afk-bot8',
  version: '1.26.40',
  offline: false,
  homeCommand: '/home waterbucketfarm',
  antiAfkInterval: 45000,
  reconnectDelay: 15000
};

let client = null;
let isConnected = false;
let lastSpawn = null;
let logs = [];
let reconnectTimer = null;
let wss;
let isConnecting = false;

function log(msg) {
  const time = new Date().toLocaleTimeString();
  const line = `[${time}] ${msg}`;
  console.log(line);
  logs.push(line);
  if (logs.length > 120) logs.shift();
  if (wss) {
    wss.clients.forEach(ws => {
      if (ws.readyState === 1) {
        ws.send(JSON.stringify({ type: 'log', message: line }));
      }
    });
  }
}

function sendStatus() {
  if (!wss) return;
  wss.clients.forEach(ws => {
    if (ws.readyState === 1) {
      ws.send(JSON.stringify({
        type: 'status',
        connected: isConnected,
        username: CONFIG.username
      }));
    }
  });
}

function connect() {
  if (isConnecting) return;
  isConnecting = true;

  if (client) {
    try {
      client.removeAllListeners();
      client.close();
    } catch (e) {}
    client = null;
  }

  // THIS LINE IS NOW FIXED
  log(`Connecting to \( {CONFIG.host}: \){CONFIG.port} as ${CONFIG.username}...`);

  try {
    client = bedrock.createClient({
      host: CONFIG.host,
      port: CONFIG.port,
      username: CONFIG.username,
      version: CONFIG.version,
      offline: false,
      skipPing: true,
      onMsaCode: (data) => {
        log('=== MICROSOFT LOGIN NEEDED ===');
        log('Open this link: https://www.microsoft.com/link');
        log('Enter this code: ' + data.user_code);
        log('==============================');
      }
    });
  } catch (err) {
    log('Failed to create client: ' + err.message);
    isConnecting = false;
    scheduleReconnect();
    return;
  }

  client.on('error', (err) => {
    log('Connection Error: ' + (err.message || err));
    isConnected = false;
    isConnecting = false;
    sendStatus();
    scheduleReconnect();
  });

  client.on('kick', (packet) => {
    log('Kicked from server: ' + (packet.message || 'No reason given'));
    isConnected = false;
    isConnecting = false;
    sendStatus();
    scheduleReconnect();
  });

  client.on('close', () => {
    log('Connection closed');
    isConnected = false;
    isConnecting = false;
    sendStatus();
    scheduleReconnect();
  });

  client.on('spawn', () => {
    isConnected = true;
    isConnecting = false;
    lastSpawn = Date.now();
    log('Spawned successfully!');
    sendStatus();

    setTimeout(() => {
      if (isConnected && client) {
        try {
          log('Running: ' + CONFIG.homeCommand);
          client.queue('text', {
            type: 'chat',
            needs_translation: false,
            source_name: client.username,
            xuid: '',
            platform_chat_id: '',
            filtered_message: '',
            message: CONFIG.homeCommand
          });
        } catch (e) {
          log('Failed to send home command: ' + e.message);
        }
      }
    }, 5000);
  });

  // Timeout safety
  setTimeout(() => {
    if (isConnecting && !isConnected) {
      log('Connection timed out');
      isConnecting = false;
      try { client.close(); } catch (e) {}
      scheduleReconnect();
    }
  }, 30000);
}

function scheduleReconnect() {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  reconnectTimer = setTimeout(() => {
    log('Trying to reconnect...');
    connect();
  }, CONFIG.reconnectDelay);
}

const app = express();
const server = http.createServer(app);
wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname, 'public')));

wss.on('connection', (ws) => {
  sendStatus();
  logs.slice(-25).forEach(l => {
    ws.send(JSON.stringify({ type: 'log', message: l }));
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  log('Dashboard started on port ' + PORT);
  connect();
});
