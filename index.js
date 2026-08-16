const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const dgram = require('dgram');

// --- FIXED TARGET SETTING ---
const TARGET_USER = ".Theobsidianarmy";

// 1. Render Keep-Alive Link
app.get('/', (req, res) => {
    res.send('minecart-afk-bot8 anti-kick protocol is active!');
});
app.listen(PORT, () => {
    console.log(`Web portal listening on port ${PORT}`);
});

// 2. Start Bedrock Session
function joinDonutSMP() {
    console.log("Connecting minecart-afk-bot8 to DonutSMP...");
    const client = dgram.createSocket('udp4');
    
    const pingPacket = Buffer.from([0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff, 0xff, 0x00, 0xfe, 0xfe, 0xfe, 0xfe, 0xdf, 0xdf, 0xdf, 0xdf, 0x12, 0x34, 0x56, 0x78]);

    client.send(pingPacket, 0, pingPacket.length, 19132, 'donutsmp.net', (err) => {
        if (err) console.log(`Network error: ${err.message}`);
    });

    client.on('message', (msg) => {
        const dataStr = msg.toString().toLowerCase(); 
        const checkUser = TARGET_USER.toLowerCase();
        
        if (dataStr.includes('mcpe')) {
            console.log("minecart-afk-bot8 logged into world.");
            
            // Auto-teleport the bot to your farm chunk right away
            setTimeout(() => {
                sendChat(client, '/home waterbucketfarmm');
                sendChat(client, '/home "water bucket farm"');
                console.log("Sent initial farm destination commands.");
            }, 8000);

            // --- ANTI-KICK MOVEMENT PACKET LOOP ---
            // Sends a minor physics update packet every 4 seconds so the server keeps it online
            setInterval(() => {
                const movePacket = Buffer.from(JSON.stringify({ type: 'move', x: 0, y: 0.1, z: 0, yaw: 1, pitch: 1 }));
                client.send(movePacket, 0, movePacket.length, 19132, 'donutsmp.net');
            }, 4000);
        }

        // --- SPECIFIC TPA ACCEPT FOR TARGET ---
        const isRequest = dataStr.includes('tpa') || dataStr.includes('teleport request') || dataStr.includes('requested to teleport');

        if (isRequest && dataStr.includes(checkUser)) {
            console.log(`Detected request from ${TARGET_USER}! Running accept command...`);
            
            setTimeout(() => {
                sendChat(client, `/tpaccept ${TARGET_USER}`);
                console.log(`Successfully sent: /tpaccept ${TARGET_USER}`);
            }, 1000); 
        }
    });

    client.on('error', (err) => {
        console.log(`Socket error: ${err.message}`);
    });
}

// Helper function to send chat text/commands over UDP packets
function sendChat(socketClient, messageText) {
    const chatPacket = Buffer.from(JSON.stringify({
        type: 'chat',
        message: messageText,
        source_name: 'minecart-afk-bot8'
    }));
    socketClient.send(chatPacket, 0, chatPacket.length, 19132, 'donutsmp.net');
}

// Keep connection alive or reconnect every 30 seconds
setInterval(joinDonutSMP, 30000);
joinDonutSMP();
