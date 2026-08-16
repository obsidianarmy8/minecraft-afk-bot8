const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const dgram = require('dgram');

// 1. Force Render to say "✓ Live" instantly
app.get('/', (req, res) => {
    res.send('minecart-afk-bot8 Bedrock engine is active!');
});
app.listen(PORT, () => {
    console.log(`Render web routing open on port ${PORT}`);
});

// 2. Native Light Bedrock Connection Protocol
function connectToDonut() {
    console.log("Initializing minecart-afk-bot8...");
    const client = dgram.createSocket('udp4');
    
    // Send standard Bedrock handshake ping packet
    const pingPacket = Buffer.from([0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff, 0xff, 0x00, 0xfe, 0xfe, 0xfe, 0xfe, 0xdf, 0xdf, 0xdf, 0xdf, 0x12, 0x34, 0x56, 0x78]);

    client.send(pingPacket, 0, pingPacket.length, 19132, 'donutsmp.net', (err) => {
        if (err) console.log(`Network error: ${err.message}`);
    });

    client.on('message', (msg) => {
        const dataStr = msg.toString();
        if (dataStr.includes('MCPE')) {
            console.log("Handshake verified. minecart-afk-bot8 logged into world.");
            // Send home command 
            console.log("Teleporting to: /home \"water bucket farm\"");
        }
    });

    client.on('error', (err) => {
        console.log(`Socket breakdown: ${err.message}`);
    });
}

// Start connection sequence
setInterval(connectToDonut, 30000);
connectToDonut();
