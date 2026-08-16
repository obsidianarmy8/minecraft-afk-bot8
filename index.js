const bedrock = require('bedrock-protocol');
const http = require('http');

// Keeps the bot hosted completely for free on Render
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('ebos2209 Bot is running 24/7!\n');
}).listen(process.env.PORT || 10000);

// Connects securely to your new main account
const client = bedrock.createClient({
  host: process.env.MC_HOST || 'your.server.ip', 
  port: parseInt(process.env.MC_PORT) || 19132, 
  username: 'ebos2209@gmail.com', 
  auth: 'microsoft' 
});

client.on('join', () => {
  console.log('✅ Success! ebos2209 joined the server!');
  
  setInterval(() => {
    client.queue('text', {
      type: 'chat',
      needs_translation: false,
      source_name: client.username,
      xuid: '',
      platform_chat_id: '',
      message: 'ebos2209 AFK Loop'
    });
  }, 60000);
});

client.on('error', (err) => console.log(`⚠️ Client Error: ${err}`));
client.on('close', () => console.log('❌ Connection closed.'));
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

const mineflayer = require('mineflayer');
const { mineflayer: mineflayerViewer } = require('prismarine-viewer'); 

// 1. Setup the Bot connection
const bot = mineflayer.createBot({
    host: 'play.donutsmp.net',
    username: '', /minecraft-afk-bot8/ <-- Put your bot's Minecraft name here
    version: '1.20.4' 
});

// 2. Start the Live View when she spawns
bot.once('spawn', () => {
    console.log("Bot spawned on DonutSMP!");
    
    // This turns on the live screen viewer
    mineflayerViewer(bot, { 
        port: PORT, 
        firstPerson: true
    }); 
    
    // Teleport her to your farm automatically
    setTimeout(() => {
        bot.chat( /home 1 ); // <-- Change "farm" to your exact home name
    }, 5000);
});

// 3. Keep-alive route for Render
app.get('/status', (req, res) => {
    res.send('Bot web server is running!');
});
