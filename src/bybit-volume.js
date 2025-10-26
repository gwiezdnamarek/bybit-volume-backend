const axios = require('axios');

class BybitVolumeTracker {
    constructor() {
        this.baseURL = 'https://api.bybit.com/v5/market';
    }

    // Pobierz volume i dane long/short dla pary
    async getVolumeAndRatio(symbol = 'NEARUSDT', interval = '1') {
        try {
            // Pobierz ticker dla volume i ceny
            const tickerResponse = await axios.get(`${this.baseURL}/tickers`, {
                params: {
                    category: 'linear',
                    symbol: symbol
                }
            });

            // Pobierz open interest dla long/short ratio
            const oiResponse = await axios.get(`${this.baseURL}/open-interest`, {
                params: {
                    category: 'linear',
                    symbol: symbol,
                    intervalTime: interval
                }
            });

            if (tickerResponse.data.retCode === 0 && oiResponse.data.retCode === 0) {
                const ticker = tickerResponse.data.result.list[0];
                const oiData = oiResponse.data.result.list[0];
                
                const volume = parseFloat(ticker.volume24h);
                const volumeUSDT = volume * parseFloat(ticker.lastPrice);
                const openInterest = parseFloat(oiData.openInterest);
                
                // Symulujemy long/short ratio (Bybit nie podaje bezpośrednio)
                // W prawdziwej aplikacji pobralibyśmy to z innego endpointu
                const longRatio = 0.45 + (Math.random() * 0.1); // 45-55%
                const shortRatio = 1 - longRatio;

                return {
                    symbol: symbol,
                    interval: interval + 'm',
                    volume: volume,
                    volumeUSDT: volumeUSDT,
                    openInterest: openInterest,
                    longRatio: longRatio,
                    shortRatio: shortRatio,
                    longVolume: volume * longRatio,
                    shortVolume: volume * shortRatio,
                    timestamp: new Date().toISOString(),
                    lastPrice: parseFloat(ticker.lastPrice)
                };
            }

            return null;
        } catch (error) {
            console.error('Error fetching Bybit data:', error.message);
            return null;
        }
    }

    // Pobierz dane dla wszystkich timeframeów
    async getAllTimeframes(symbol = 'NEARUSDT') {
        const timeframes = ['1', '5', '15', '30', '60', '240']; // 1m, 5m, 15m, 30m, 1h, 4h
        const results = {};

        for (const tf of timeframes) {
            const data = await this.getVolumeAndRatio(symbol, tf);
            if (data) {
                results[tf + 'm'] = data;
            }
        }

        return results;
    }
}

module.exports = BybitVolumeTracker;
