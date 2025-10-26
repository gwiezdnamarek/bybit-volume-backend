require('dotenv').config();
const express = require('express');
const BinanceScalperFixed = require('../src/binance-scalper-fixed');

const app = express();
const tracker = new BinanceScalperFixed();

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

// PEŁNY INTERFEJS Z WYKRESAMI - SKOPIOWANY Z ORYGINALNEGO app.js
app.get('/', (req, res) => {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Volume Tracker - AKTUALNE DANE BYBIT</title>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <style>
            body { font-family: Arial; margin: 0; padding: 20px; background: #0f1419; color: white; }
            .container { max-width: 1200px; margin: 0 auto; }
            .header { background: #1e2328; padding: 25px; border-radius: 15px; margin-bottom: 25px; text-align: center; }
            .price { font-size: 36px; font-weight: bold; color: #28a745; margin: 10px 0; }
            .ratio-display { display: flex; justify-content: center; gap: 30px; margin: 30px 0; }
            .ratio-box { padding: 25px; border-radius: 12px; text-align: center; min-width: 200px; }
            .long { background: linear-gradient(135deg, #28a745, #20c997); }
            .short { background: linear-gradient(135deg, #dc3545, #e83e8c); }
            .ratio-value { font-size: 32px; font-weight: bold; margin: 10px 0; }
            .timeframe-buttons { text-align: center; margin: 25px 0; }
            button { padding: 12px 20px; margin: 8px; border: none; background: #2a2e35; color: white; border-radius: 8px; cursor: pointer; font-size: 16px; }
            button:hover { background: #3a3e45; }
            button.active { background: #007bff; }
            .chart-container { background: #1e2328; padding: 25px; border-radius: 15px; margin: 25px 0; }
            .info { text-align: center; margin: 20px 0; color: #6c757d; }
            .source-badge { background: #17a2b8; padding: 5px 10px; border-radius: 20px; font-size: 12px; }
            .data-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
            .card { background: #2a2e35; padding: 15px; border-radius: 8px; text-align: center; }
            .card-value { font-size: 20px; font-weight: bold; color: #28a745; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📊 Volume Tracker - NEAR/USDT</h1>
                <div class="price" id="currentPrice">$--</div>
                <div class="source-badge">🔥 AKTUALNE DANE BYBIT API</div>
            </div>

            <div class="ratio-display">
                <div class="ratio-box long">
                    <div style="font-size: 18px;">LONG POSITIONS</div>
                    <div class="ratio-value" id="longRatio">--%</div>
                    <div id="longVolume">-- NEAR</div>
                </div>
                <div class="ratio-box short">
                    <div style="font-size: 18px;">SHORT POSITIONS</div>
                    <div class="ratio-value" id="shortRatio">--%</div>
                    <div id="shortVolume">-- NEAR</div>
                </div>
            </div>

            <div class="timeframe-buttons">
                <button onclick="selectTimeframe('1m')" class="active">1 Minuta</button>
                <button onclick="selectTimeframe('5m')">5 Minut</button>
                <button onclick="selectTimeframe('15m')">15 Minut</button>
                <button onclick="selectTimeframe('30m')">30 Minut</button>
                <button onclick="selectTimeframe('1h')">1 Godzina</button>
            </div>

            <div class="data-cards">
                <div class="card">
                    <div>Volume NEAR</div>
                    <div class="card-value" id="volumeNear">--</div>
                </div>
                <div class="card">
                    <div>Volume USDT</div>
                    <div class="card-value" id="volumeUSDT">--</div>
                </div>
                <div class="card">
                    <div>Timeframe</div>
                    <div class="card-value" id="timeframe">--</div>
                </div>
            </div>

            <div class="chart-container">
                <canvas id="volumeChart" width="400" height="200"></canvas>
            </div>

            <div class="info">
                <div>Źródło: <span id="dataSource">Bybit Real API</span></div>
                <div>Następne odświeżenie za: <span id="countdown">30</span> sekund</div>
                <div id="lastUpdate">Ostatnia aktualizacja: --</div>
                <div id="status" style="margin-top: 10px; font-weight: bold;"></div>
            </div>
        </div>

        <script>
            let currentData = null;
            let currentTimeframe = '1m';
            let countdown = 30;
            let volumeChart = null;

            loadData();
            startCountdown();

            function startCountdown() {
                setInterval(() => {
                    countdown--;
                    document.getElementById('countdown').textContent = countdown;
                    
                    if (countdown <= 0) {
                        countdown = 30;
                        loadData();
                    }
                }, 1000);
            }

            async function loadData() {
                document.getElementById('status').textContent = '🔄 Ładowanie danych...';
                document.getElementById('status').style.color = '#ffc107';
                
                try {
                    const response = await fetch('/api/volume/near');
                    const result = await response.json();
                    
                    if (result.success) {
                        currentData = result.data;
                        updateDisplay();
                        document.getElementById('status').textContent = '✅ Dane załadowane';
                        document.getElementById('status').style.color = '#28a745';
                        document.getElementById('lastUpdate').textContent = 'Ostatnia aktualizacja: ' + new Date().toLocaleString();
                    }
                } catch (error) {
                    document.getElementById('status').textContent = '❌ Błąd ładowania danych';
                    document.getElementById('status').style.color = '#dc3545';
                }
            }

            function selectTimeframe(timeframe) {
                currentTimeframe = timeframe;
                document.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
                event.target.classList.add('active');
                updateDisplay();
            }

            function updateDisplay() {
                if (!currentData || !currentData[currentTimeframe]) return;

                const data = currentData[currentTimeframe];
                
                // Aktualne dane
                document.getElementById('currentPrice').textContent = '$' + data.price;
                document.getElementById('longRatio').textContent = (data.longRatio * 100).toFixed(1) + '%';
                document.getElementById('shortRatio').textContent = (data.shortRatio * 100).toFixed(1) + '%';
                document.getElementById('longVolume').textContent = Math.round(data.longVolume).toLocaleString() + ' NEAR';
                document.getElementById('shortVolume').textContent = Math.round(data.shortVolume).toLocaleString() + ' NEAR';
                
                // Data cards
                document.getElementById('volumeNear').textContent = Math.round(data.totalVolume).toLocaleString() + ' NEAR';
                document.getElementById('volumeUSDT').textContent = '$' + Math.round(data.totalVolume * data.price).toLocaleString();
                document.getElementById('timeframe').textContent = data.interval;

                // Pojedynczy wykres słupkowy dla aktualnego timeframe'u
                if (volumeChart) volumeChart.destroy();
                const volumeCtx = document.getElementById('volumeChart').getContext('2d');
                volumeChart = new Chart(volumeCtx, {
                    type: 'bar',
                    data: {
                        labels: ['Long Volume', 'Short Volume'],
                        datasets: [{
                            label: 'Volume NEAR - ' + currentTimeframe,
                            data: [data.longVolume, data.shortVolume],
                            backgroundColor: ['#28a745', '#dc3545']
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            title: {
                                display: true,
                                text: 'Aktualny Volume Long/Short - ' + currentTimeframe,
                                color: 'white',
                                font: { size: 16 }
                            },
                            legend: {
                                labels: { color: 'white' }
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: { color: 'white' },
                                grid: { color: '#2a2e35' },
                                title: {
                                    display: true,
                                    text: 'Volume (NEAR)',
                                    color: 'white'
                                }
                            },
                            x: {
                                ticks: { color: 'white' },
                                grid: { color: '#2a2e35' }
                            }
                        }
                    }
                });
            }
        </script>
    </body>
    </html>
    `;
    res.send(html);
});

// EKSPORT dla Vercel - BEZ app.listen!
module.exports = app;
