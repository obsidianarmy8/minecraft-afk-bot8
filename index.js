const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const packets = require('minecraft-protocol');

// 1. Render Keep-Alive Link
app.get('/', (req, res) => {
    res.send('minecart-afk-bot8 Bedrock service is awake!');
});
app.listen(PORT, () => {
    console.log(`Web portal listening on port ${PORT}`);
});

// 2. Start Bedrock Session
function joinDonutSMP() {
    console.log("Connecting minecart-afk-bot8 to DonutSMP...");

    const client = packets.createClient({
        host: 'donutsmp.net',
        port: 19132,
        username: 'minecart-afk-bot8',
        offline: true, // Switch to false if your bot uses a premium paid Microsoft account
        realms: false
    });

    client.on('spawn', () => {
        console.log("minecart-afk-bot8 successfully joined the server!");
        
        // Wait 8 seconds to load world completely, then jump to your farm
        setTimeout(() => {
            client.write('text', {
                type: 'chat',
                needs_translation: false,
                source_name: 'minecart-afk-bot8',
                xuid: '',
                platform_chat_id: '',
                message: '/home "water bucket farm"'
            });
            console.log("Sent split home teleport command safely.");
        }, 8000);
    });

    // Prevents Render from crashing entirely if the server drops your packet
    client.on('error', (err) => {
        console.log('Network Error: ', err.message);
    });

    client.on('close', () => {
        console.log('Disconnected. Retrying connection in 20 seconds...');
        setTimeout(() => joinDonutSMP(), 20000);
    });
}

joinDonutSMP();
