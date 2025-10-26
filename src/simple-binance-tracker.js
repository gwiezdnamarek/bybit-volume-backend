const axios = require('axios');

class SimpleBinanceTracker {
    constructor() {
        this.baseURL = 'https://api.binance.com/api/v3'; // Public API bez CORS
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
            const timeframes = ['5m', '15m', '30m', '1h'];
            const results = {};
            const tickerData = await this.getTicker(symbol);

            for (const tf of timeframes) {
                try {
                    const klineData = await this.getKlines(symbol, tf, 5);
                    
                    if (klineData.length > 1) {
                        const current = klineData[0];
                        const previous = klineData[1];
                        
                        // Prosta analiza trendu
                        const trend = current.close > previous.close ? 'UP' : 'DOWN';
                        const volumeSpike = current.volume > (previous.volume * 1.5);
                        const priceChange = ((current.close - previous.close) / previous.close * 100).toFixed(2);
                        
                        results[tf] = {
                            symbol: symbol,
                            interval: tf,
                            price: current.close,
                            priceChange: priceChange + '%',
                            trend: trend,
                            volume: current.volume,
                            volumeSpike: volumeSpike,
                            high: current.high,
                            low: current.low,
                            timestamp: current.timestamp.toISOString(),
                            source: 'Binance Public API 📊'
                        };
                    }
                } catch (error) {
                    console.log(`⚠️ Używam danych ticker dla ${tf}`);
                    // Fallback do danych ticker
                    results[tf] = {
                        symbol: symbol,
                        interval: tf,
                        price: tickerData.price,
                        priceChange: tickerData.priceChange + '%',
                        trend: tickerData.priceChange >= 0 ? 'UP' : 'DOWN',
                        volume: tickerData.volume,
                        volumeSpike: false,
                        high: tickerData.high,
                        low: tickerData.low,
                        timestamp: tickerData.timestamp,
                        source: 'Binance Ticker Fallback 📊'
                    };
                }
            }

            return results;

        } catch (error) {
            console.error('Błąd pobierania danych:', error);
            throw error;
        }
    }
}

module.exports = SimpleBinanceTracker;
