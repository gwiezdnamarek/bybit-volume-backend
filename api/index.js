require('dotenv').config();
const express = require('express');
const BybitSimpleTracker = require('../src/bybit-simple-tracker');

const app = express();
const tracker = new BybitSimpleTracker();

app.use(express.json());

// Cache danych
let cachedData = null;
let lastUpdate = null;

app.get('/api/volume/near', async (req, res) => {
    try {
        if (cachedData && (Date.now() - lastUpdate) < 30000) {
            return res.json({
                ...cachedData,
                cached: true,
                cacheTime: Math.floor((Date.now() - lastUpdate) / 1000) + 's ago'
            });
        }
        
        console.log('🔄 Pobieram aktualne dane z Bybit...');
        const data = await tracker.getAllTimeframes('NEARUSDT');
        
        cachedData = {
            success: true,
            symbol: 'NEAR/USDT',
            data: data,
            timestamp: new Date().toISOString(),
            note: 'AKTUALNE DANE LONG/SHORT Z BYBIT API'
        };
        lastUpdate = Date.now();
        
        res.json(cachedData);
        
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Strona główna
app.get('/', (req, res) => {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Volume Tracker - AKTUALNE DANE BYBIT</title>
        <meta charset="UTF-8">
    </head>
    <body>
        <h1>🚀 BYBIT VOLUME TRACKER DZIAŁA!</h1>
        <p>Aplikacja została poprawnie wdrożona na Vercel</p>
        <p><a href="/api/volume/near">Sprawdź dane volume</a></p>
    </body>
    </html>
    `;
    res.send(html);
});

// EKSPORT dla Vercel - TO JEST KLUCZOWE!
module.exports = app;
