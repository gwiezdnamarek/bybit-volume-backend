require('dotenv').config();
const express = require('express');
const TestDataTracker = require('../src/test-data-tracker');

const app = express();
const tracker = new TestDataTracker();

app.use(express.json());

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
        
        console.log('🔄 Pobieram dane testowe...');
        const data = await tracker.getAllTimeframes('NEARUSDT');
        
        cachedData = {
            success: true,
            symbol: 'NEAR/USDT',
            data: data,
            timestamp: new Date().toISOString(),
            note: 'TEST DATA - DEVELOPMENT'
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

app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Volume Tracker</title>
        <style>
            body { font-family: Arial; margin: 20px; background: #0f1419; color: white; }
            .container { max-width: 800px; margin: 0 auto; }
            .header { background: #1e2328; padding: 20px; border-radius: 10px; margin-bottom: 20px; text-align: center; }
            .timeframe { display: inline-block; width: 23%; margin: 1%; background: #2a2e35; padding: 15px; border-radius: 8px; text-align: center; }
            .up { color: #28a745; }
            .down { color: #dc3545; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📊 Volume Tracker - NEAR/USDT</h1>
                <div>TEST DATA - DEVELOPMENT MODE</div>
            </div>
            
            <div id="timeframes">Ładowanie...</div>
            
            <div style="margin-top: 20px; text-align: center;">
                <div>Następne odświeżenie za: <span id="countdown">30</span> sekund</div>
                <div id="status">Status: Ładowanie...</div>
            </div>
        </div>

        <script>
            async function loadData() {
                try {
                    const response = await fetch('/api/volume/near');
                    const result = await response.json();
                    
                    if (result.success) {
                        document.getElementById('status').textContent = '✅ Dane załadowane: ' + new Date().toLocaleString();
                        displayTimeframes(result.data);
                    }
                } catch (error) {
                    document.getElementById('status').textContent = '❌ Błąd: ' + error.message;
                }
            }

            function displayTimeframes(data) {
                const container = document.getElementById('timeframes');
                let html = '';
                
                for (const [timeframe, info] of Object.entries(data)) {
                    const trendClass = info.trend === 'UP' ? 'up' : 'down';
                    html += '<div class="timeframe">';
                    html += '<div><strong>' + timeframe + '</strong></div>';
                    html += '<div class="' + trendClass + '">$' + info.price + '</div>';
                    html += '<div class="' + trendClass + '">' + info.priceChange + '</div>';
                    html += '<div>Volume: ' + info.volume.toLocaleString() + '</div>';
                    html += '<div>' + (info.trend === 'UP' ? '🟢' : '🔴') + ' ' + info.trend + '</div>';
                    html += '</div>';
                }
                
                container.innerHTML = html;
            }

            let countdown = 30;
            setInterval(() => {
                countdown--;
                document.getElementById('countdown').textContent = countdown;
                if (countdown <= 0) {
                    countdown = 30;
                    loadData();
                }
            }, 1000);

            loadData();
        </script>
    </body>
    </html>
    `);
});

module.exports = app;
