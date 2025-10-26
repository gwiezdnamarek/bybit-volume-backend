const axios = require('axios');

class BinanceVolumeTracker {
    constructor() {
        this.baseURL = 'https://api.binance.com/api/v3';
    }

    // Pobierz volume dla pary i timeframe
    async getVolume(symbol = 'NEARUSDT', interval = '1m') {
        try {
            const response = await axios.get(`${this.baseURL}/klines`, {
                params: {
                    symbol: symbol.toUpperCase(),
                    interval: interval,
                    limit: 2  // Ostatnie 2 świece
                }
            });

            if (response.data.length > 0) {
                const latestCandle = response.data[response.data.length - 1];
                // Struktura candle: [openTime, open, high, low, close, volume, ...]
                const volume = parseFloat(latestCandle[5]);
                const closePrice = parseFloat(latestCandle[4]);
                
                return {
                    symbol: symbol,
                    interval: interval,
                    volume: volume,
                    volumeUSDT: volume * closePrice,
                    timestamp: new Date(latestCandle[0]),
                    closePrice: closePrice
                };
            }

            return null;
        } catch (error) {
            console.error('Error fetching Binance data:', error.message);
            return null;
        }
    }

    // Pobierz volume dla wszystkich timeframeów
    async getAllTimeframes(symbol = 'NEARUSDT') {
        const timeframes = ['1m', '5m', '15m', '30m', '1h', '4h'];
        const results = {};

        for (const tf of timeframes) {
            const data = await this.getVolume(symbol, tf);
            if (data) {
                results[tf] = data;
            }
        }

        return results;
    }
}

module.exports = BinanceVolumeTracker;
