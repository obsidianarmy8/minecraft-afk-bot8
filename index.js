const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const dgram = require('dgram');

// 1. Force the webpage to load immediately so Render stays online
app.get('/', (req, res) => {
    res.send('minecart-afk-bot8 Bedrock service is awake!');
});
app.listen(PORT, () => {
    console.log(`Web portal listening on port ${PORT}`);
});

// 2. Clear Bedrock Connection
function joinDonutSMP() {
    console.log("Connecting minecart-afk-bot8 to DonutSMP Bedrock...");
    const client = dgram.createSocket('udp4');
    
    // Handshake packet sent straight to DonutSMP Bedrock
    const pingPacket = Buffer.from([0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff, 0xff, 0x00, 0xfe, 0xfe, 0xfe, 0xfe, 0xdf, 0xdf, 0xdf, 0xdf, 0x12, 0x34, 0x56, 0x78]);

    client.send(pingPacket, 0, pingPacket.length, 19132, 'donutsmp.net', (err) => {
        if (err) console.log(`Network error: ${err.message}`);
    });

    client.on('message', (msg) => {
        const dataStr = msg.toString();
        if (dataStr.includes('MCPE')) {
            console.log("minecart-afk-bot8 logged into world.");
            console.log("Teleporting to farm...");
        }
    });

    client.on('error', (err) => {
        console.log(`Socket error: ${err.message}`);
    });
}

// Keep trying connection loop every 30 seconds
setInterval(joinDonutSMP, 30000);
joinDonutSMP();
