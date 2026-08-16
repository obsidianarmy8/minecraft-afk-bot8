const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const bedrock = require('bedrock-protocol');

// 1. Keep Render Web Service active
app.get('/', (req, res) => {
    res.send('Bedrock AFK Bot Web Service is Live!');
});
app.listen(PORT, () => {
    console.log(`Render monitoring active on port ${PORT}`);
});

// 2. Start Bedrock connection function
function startBedrockBot() {
    console.log("Connecting minecart-afk-bot8 to DonutSMP Bedrock...");

    const client = bedrock.createClient({
        host: 'donutsmp.net',      // DonutSMP Bedrock Host IP
        port: 19132,              // Bedrock Port
        username: 'minecart-afk-bot8', 
        offline: true,            // Toggle to false if using a paid Microsoft account
        version: '1.20.80'        // Matches the base server network version
    });

    // Handle home teleport command when safely inside the world
    client.on('spawn', () => {
        console.log("minecart-afk-bot8 successfully spawned in!");

        setTimeout(() => {
            // Quotes are mandatory for homes containing spaces so it doesn't break
            client.queue('text', {
                type: 'chat',
                needs_translation: false,
                source_name: 'minecart-afk-bot8',
                xuid: '',
                platform_chat_id: '',
                message: '/home "water bucket farm"' 
            });
            console.log("Sent split home teleport command.");
        }, 8000);
    });

    // Stop Render from going offline if the server rejects the connection
    client.on('error', (err) => {
        console.log('Bedrock Protocol Error: ', err.message);
    });

    client.on('close', () => {
        console.log('Connection closed. Re-entering queue in 20 seconds...');
        setTimeout(() => startBedrockBot(), 20000);
    });
}

startBedrockBot();
