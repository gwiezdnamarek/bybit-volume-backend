const fs = require('fs');

let content = fs.readFileSync('api/index.js', 'utf8');

// Napraw updateDisplay function - dostosuj do nowej struktury danych
content = content.replace(
`function updateDisplay() {
                if (!currentData || !currentData[currentTimeframe]) return;

                const data = currentData[currentTimeframe];
                
                // Aktualne dane
                document.getElementById('currentPrice').textContent = '$' + data.price;
                document.getElementById('longRatio').textContent = (data.data.trend === "UP" ? "🟢 BULLISH" : "🔴 BEARISH").toFixed(1) + '%';
                document.getElementById('shortRatio').textContent = (data.data.volumeSpike ? "📈 HIGH" : "📉 NORMAL").toFixed(1) + '%';
                document.getElementById('longVolume').textContent = Math.round(data.longVolume).toLocaleString() + ' NEAR';
                document.getElementById('shortVolume').textContent = Math.round(data.shortVolume).toLocaleString() + ' NEAR';
                
                // Data cards
                document.getElementById('volumeNear').textContent = Math.round(data.totalVolume).toLocaleString() + ' NEAR';
                document.getElementById('volumeUSDT').textContent = '$' + Math.round(data.totalVolume * data.price).toLocaleString();
                document.getElementById('timeframe').textContent = data.interval;`,
`function updateDisplay() {
                if (!currentData || !currentData[currentTimeframe]) return;

                const data = currentData[currentTimeframe];
                
                // Aktualne dane
                document.getElementById('currentPrice').textContent = '$' + data.price;
                document.getElementById('longRatio').textContent = data.trend === "UP" ? "🟢 BULLISH" : "🔴 BEARISH";
                document.getElementById('shortRatio').textContent = data.volumeSpike ? "📈 HIGH VOLUME" : "📉 NORMAL VOLUME";
                document.getElementById('longVolume').textContent = data.priceChange;
                document.getElementById('shortVolume').textContent = data.volumeChange || '--';
                
                // Data cards
                document.getElementById('volumeNear').textContent = Math.round(data.volume).toLocaleString() + ' NEAR';
                document.getElementById('volumeUSDT').textContent = '$' + Math.round(data.volume * data.price).toLocaleString();
                document.getElementById('timeframe').textContent = data.interval;`
);

// Napraw wykres - użyj price trend zamiast long/short
content = content.replace(
`                // Pojedynczy wykres słupkowy dla aktualnego timeframe'u
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
                    },`,
`                // Wykres ceny i volume
                if (volumeChart) volumeChart.destroy();
                const volumeCtx = document.getElementById('volumeChart').getContext('2d');
                volumeChart = new Chart(volumeCtx, {
                    type: 'bar',
                    data: {
                        labels: ['Price', 'Volume'],
                        datasets: [{
                            label: 'Metrics - ' + currentTimeframe,
                            data: [data.price, data.volume / 1000], // Volume podzielone przez 1000 dla skali
                            backgroundColor: ['#007bff', '#28a745']
                        }]
                    },`
);

// Napraw tytuł wykresu
content = content.replace(
`                            title: {
                                display: true,
                                text: 'Aktualny Volume Long/Short - ' + currentTimeframe,`,
`                            title: {
                                display: true,
                                text: 'Price & Volume - ' + currentTimeframe,`
);

// Napraw oś Y
content = content.replace(
`                                title: {
                                    display: true,
                                    text: 'Volume (NEAR)',
                                    color: 'white'
                                }`,
`                                title: {
                                    display: true,
                                    text: 'Price ($) / Volume (K)',
                                    color: 'white'
                                }`
);

fs.writeFileSync('api/index.js', content);
console.log('✅ Kod naprawiony!');
