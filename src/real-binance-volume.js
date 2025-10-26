const axios = require('axios');

class RealBinanceVolume {
    constructor() {
        this.baseURL = 'https://api.binance.com/api/v3';
    }

    // Pobierz PRAWDZIWE dane volume z Binance
    async getRealVolume(symbol = 'NEARUSDT', interval = '1m') {
        try {
            const response = await axios.get(`${this.baseURL}/klines`, {
                params: {
                    symbol: symbol,
                    interval: interval,
                    limit: 10
                }
            });

            if (response.data.length > 0) {
                // Ostatnia kompletna świeca
                const latestCandle = response.data[response.data.length - 1];
                // Struktura: [openTime, open, high, low, close, volume, closeTime, ...]
                const volume = parseFloat(latestCandle[5]);
                const closePrice = parseFloat(latestCandle[4]);
                const volumeUSDT = volume * closePrice;
                
                return {
                    symbol: symbol,
                    interval: interval,
                    volume: volume,
                    volumeUSDT: volumeUSDT,
                    closePrice: closePrice,
                    timestamp: new Date(latestCandle[0]),
                    source: 'Binance Spot API'
                };
            }

            return null;
            
        } catch (error) {
            console.error('Error fetching real Binance data:', error.message);
            throw new Error('Nie można pobrać danych z Binance');
        }
    }

    // Pobierz PRAWDZIWE dane dla wszystkich timeframeów
    async getAllTimeframes(symbol = 'NEARUSDT') {
        const timeframes = ['1m', '5m', '15m', '30m', '1h', '4h'];
        const results = {};

        for (const tf of timeframes) {
            try {
                const data = await this.getRealVolume(symbol, tf);
                if (data) {
                    results[tf] = data;
                }
                // Małe opóźnienie żeby nie przeciążyć API
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
                console.error(`Error for ${tf}:`, error.message);
            }
        }

        return results;
    }
}

module.exports = RealBinanceVolume;
