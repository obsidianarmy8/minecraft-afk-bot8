const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const dgram = require('dgram');

// 1. Keep the Render Web Service Awake
app.get('/', (req, res) => {
    res.send('minecart-afk-bot8 farm loader is active!');
});
app.listen(PORT, () => {
    console.log(`Web portal listening on port ${PORT}`);
});

// 2. Start Bedrock Connection
function joinDonutSMP() {
    console.log("Connecting minecart-afk-bot8 to DonutSMP...");
    const client = dgram.createSocket('udp4');
    
    const pingPacket = Buffer.from([0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff, 0xff, 0x00, 0xfe, 0xfe, 0xfe, 0xfe, 0xdf, 0xdf, 0xdf, 0xdf, 0x12, 0x34, 0x56, 0x78]);

    client.send(pingPacket, 0, pingPacket.length, 19132, 'donutsmp.net', (err) => {
        if (err) console.log(`Network error: ${err.message}`);
    });

    client.on('message', (msg) => {
        const dataStr = msg.toString().toLowerCase(); 
        
        if (dataStr.includes('mcpe')) {
            console.log("minecart-afk-bot8 logged into world.");
            
            // Teleport your bot straight to the farm chunk
            setTimeout(() => {
                sendChat(client, '/home waterbucketfarmm');
                sendChat(client, '/home "water bucket farm"');
                console.log("Sent initial farm destination commands.");
            }, 8000);
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

// Keep trying connection loop every 30 seconds
setInterval(joinDonutSMP, 30000);
joinDonutSMP();
