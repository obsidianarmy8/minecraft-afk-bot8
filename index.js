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
