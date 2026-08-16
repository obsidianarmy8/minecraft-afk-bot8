const bedrock = require('bedrock-protocol');
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const CONFIG = {
  host: 'donutsmp.net',
  port: 19132,
  username: 'minecart-afk-bot8',
  version: '1.26.40.5',
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

function log(msg) {
  const time = new Date().toLocaleTimeString();
  const line = `[${time}] ${msg}`;
  console.log(line);
  logs.push(line);
  if (logs.length > 100) logs.shift();
  if (wss) {
    wss.clients.forEach(ws => {
      if (ws.readyState === 1) ws.send(JSON.stringify({ type: 'log', message: line }));
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
  if (client) {
    try { client.close(); } catch (e) {}
  }

  Connecting to donutsmp.net:19132 as minecart-afk-bot8...

  client = bedrock.createClient({
    host: CONFIG.donutsmp.net,
    port: CONFIG.port19132,
    username: CONFIG.minecart-afk-bot8,
    version: CONFIG.1.26.40.5,
    offline: false,
    skipPing: true,
    onMsaCode: (data) => {
      log('=== MICROSOFT LOGIN NEEDED ===');
      log('Open this link: https://www.microsoft.com/link');
      log('Enter this code: ' + data.user_code);
      log('==============================');
    }
  });

  client.on('error', (err) => {
    log('Error: ' + (err.message || err));
    isConnected = false;
    sendStatus();
    scheduleReconnect();
  });

  client.on('kick', (packet) => {
    log('Kicked: ' + (packet.message || 'Unknown'));
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
    log('Spawned successfully!');
    sendStatus();

    setTimeout(() => {
      if (isConnected) {
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
      }
    }, 5000);
  });
}

function scheduleReconnect() {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  reconnectTimer = setTimeout(() => {
    log('Reconnecting...');
    connect();
  }, CONFIG.reconnectDelay);
}

const app = express();
const server = http.createServer(app);
wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname, 'public')));

wss.on('connection', (ws) => {
  sendStatus();
  logs.slice(-20).forEach(l => {
    ws.send(JSON.stringify({ type: 'log', message: l }));
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  log('Dashboard started on port ' + PORT);
  connect();
});
