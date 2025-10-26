const axios = require('axios');

class RealBinanceTracker {
    constructor() {
        this.baseURL = 'https://api.binance.com/api/v3';
    }

    async getTicker(symbol = 'NEARUSDT') {
        try {
            const response = await axios.get(`${this.baseURL}/ticker/24hr`, {
                params: { symbol },
                timeout: 10000
            });
            
            return {
                symbol: response.data.symbol,
                price: parseFloat(response.data.lastPrice),
                priceChange: parseFloat(response.data.priceChangePercent),
                volume: parseFloat(response.data.volume),
                high: parseFloat(response.data.highPrice),
                low: parseFloat(response.data.lowPrice),
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ Ticker Error:', error.message);
            throw error;
        }
    }

    async getKlines(symbol = 'NEARUSDT', interval = '5m', limit = 10) {
        try {
            const response = await axios.get(`${this.baseURL}/klines`, {
                params: { symbol, interval, limit },
                timeout: 10000
            });

            return response.data.map(k => ({
                timestamp: new Date(k[0]),
                open: parseFloat(k[1]),
                high: parseFloat(k[2]),
                low: parseFloat(k[3]),
                close: parseFloat(k[4]),
                volume: parseFloat(k[5])
            }));
        } catch (error) {
            console.error(`❌ Klines Error for ${interval}:`, error.message);
            throw error;
        }
    }

    async getAllTimeframes(symbol = 'NEARUSDT') {
        try {
            const timeframes = [
                { interval: '5m', display: '5m' },
                { interval: '15m', display: '15m' },
                { interval: '30m', display: '30m' },
                { interval: '1h', display: '1h' }
            ];

            const results = {};
            const tickerData = await this.getTicker(symbol);

            for (const tf of timeframes) {
                try {
                    const klineData = await this.getKlines(symbol, tf.interval, 5);
                    
                    if (klineData.length > 1) {
                        const current = klineData[0];
                        const previous = klineData[1];
                        
                        // Analiza trendu
                        const priceChange = ((current.close - previous.close) / previous.close * 100);
                        const trend = priceChange > 0 ? 'UP' : 'DOWN';
                        const volumeSpike = current.volume > (previous.volume * 1.5);
                        
                        results[tf.display] = {
                            symbol: symbol,
                            interval: tf.display,
                            price: current.close,
                            priceChange: priceChange.toFixed(2) + '%',
                            trend: trend,
                            volume: current.volume,
                            volumeSpike: volumeSpike,
                            high: current.high,
                            low: current.low,
                            timestamp: current.timestamp.toISOString(),
                            source: 'Binance Real Data 📊'
                        };
                    }
                } catch (error) {
                    console.log(`⚠️ Używam danych ticker dla ${tf.display}`);
                    // Fallback do danych ticker
                    results[tf.display] = {
                        symbol: symbol,
                        interval: tf.display,
                        price: tickerData.price,
                        priceChange: tickerData.priceChange.toFixed(2) + '%',
                        trend: tickerData.priceChange >= 0 ? 'UP' : 'DOWN',
                        volume: tickerData.volume,
                        volumeSpike: false,
                        high: tickerData.high,
                        low: tickerData.low,
                        timestamp: tickerData.timestamp,
                        source: 'Binance Ticker 📊'
                    };
                }
            }

            return results;

        } catch (error) {
            console.error('Błąd pobierania danych:', error);
            // Fallback do danych testowych jeśli Binance nie działa
            const TestDataTracker = require('./test-data-tracker');
            const fallback = new TestDataTracker();
            return fallback.getAllTimeframes(symbol);
        }
    }
}

module.exports = RealBinanceTracker;
