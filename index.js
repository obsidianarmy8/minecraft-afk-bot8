const bedrock = require('bedrock-protocol');
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

// ========== CONFIG ==========
const CONFIG = {
  host: 'donutsmp.net',
  port: 19132,
  username: 'minecart-afk-bot8',          // bot name
  version: '1.26.40',                     // matches your client
  offline: false,                         // DonutSMP requires Microsoft account
  homeCommand: '/home water bucket farm', // CHANGE THIS to your exact home name
  antiAfkInterval: 45_000,                // jump every 45 seconds
  reconnectDelay: 10_000
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
  if (logs.length > 200) logs.shift();
  broadcast({ type: 'log', message: line });
}

function broadcast(data) {
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
    lastSpawn: lastSpawn,
    uptime: lastSpawn ? Date.now() - lastSpawn : 0
  });
}

// ========== BOT ==========
function connect() {
  if (client) {
    try { client.close(); } catch {}
  }

  log(`Connecting to \( {CONFIG.host}: \){CONFIG.port} as ${CONFIG.username}...`);

  client = bedrock.createClient({
    host: CONFIG.host,
    port: CONFIG.port,
    username: CONFIG.username,
    version: CONFIG.version,
    offline: CONFIG.offline,
    skipPing: true,
    // profilesFolder: './auth-cache',   // uncomment if you want persistent tokens
    onMsaCode: (data) => {
      log(`=== MICROSOFT LOGIN REQUIRED ===`);
      log(`Go to: ${data.verification_uri}`);
      log(`Enter code: ${data.user_code}`);
      log(`================================`);
    }
  });

  client.on('error', (err) => {
    log(`Error: ${err.message}`);
    isConnected = false;
    sendStatus();
    scheduleReconnect();
  });

  client.on('kick', (packet) => {
    log(`Kicked: ${packet.message}`);
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

    // Go to home after a short delay
    setTimeout(() => {
      if (isConnected) {
        log(`Running: ${CONFIG.homeCommand}`);
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
    }, 3000);

    // Simple anti-AFK: jump + look around
    const antiAfk = setInterval(() => {
      if (!isConnected || !client) {
        clearInterval(antiAfk);
        return;
      }
      try {
        // Jump
        client.queue('player_auth_input', {
          pitch: 0,
          yaw: Math.random() * 360,
          position: { x: 0, y: 0, z: 0 }, // relative – library handles
          move_vector: { x: 0, z: 0 },
          head_yaw: 0,
          input_data: { jump: true },
          input_mode: 'mouse',
          play_mode: 'normal',
          interaction_model: 'touch',
          tick: BigInt(Date.now()),
          delta: { x: 0, y: 0.42, z: 0 } // small upward for jump feel
        });
        log('Anti-AFK action (jump/look)');
      } catch (e) {
        // some versions need different packet shape – ignore if fails
      }
    }, CONFIG.antiAfkInterval);
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
    logs: logs.slice(-50)
  });
});

wss.on('connection', (ws) => {
  sendStatus();
  logs.slice(-30).forEach(l => ws.send(JSON.stringify({ type: 'log', message: l })));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  log(`Dashboard running on port ${PORT}`);
  connect();
});
