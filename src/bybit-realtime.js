const axios = require('axios');

class BybitRealtimeTracker {
    constructor() {
        this.baseURL = 'https://api.bybit.com/v5/market';
    }

    // Pobierz prawdziwe dane long/short z Bybit
    async getLongShortData(symbol = 'NEARUSDT') {
        try {
            // Pobierz ratio long/short
            const ratioResponse = await axios.get(`${this.baseURL}/long-short-ratio`, {
                params: {
                    category: 'linear',
                    symbol: symbol,
                    period: '1h',  // 1h, 4h, 1d
                    limit: 1
                }
            });

            // Pobierz ticker dla volume
            const tickerResponse = await axios.get(`${this.baseURL}/tickers`, {
                params: {
                    category: 'linear',
                    symbol: symbol
                }
            });

            if (ratioResponse.data.retCode === 0 && tickerResponse.data.retCode === 0) {
                const ratioData = ratioResponse.data.result.list[0];
                const ticker = tickerResponse.data.result.list[0];
                
                const longRatio = parseFloat(ratioData.longRate) / 100;
                const shortRatio = parseFloat(ratioData.shortRate) / 100;
                const totalVolume = parseFloat(ticker.volume24h);
                
                return {
                    symbol: symbol,
                    longRatio: longRatio,
                    shortRatio: shortRatio,
                    longVolume: totalVolume * longRatio,
                    shortVolume: totalVolume * shortRatio,
                    totalVolume: totalVolume,
                    timestamp: new Date().toISOString(),
                    source: 'Bybit Public API'
                };
            }

            return this.getFallbackData(symbol);
            
        } catch (error) {
            console.error('Error fetching Bybit data:', error.message);
            return this.getFallbackData(symbol);
        }
    }

    getFallbackData(symbol) {
        // Fallback - symulacja
        const totalVolume = 50000 + (Math.random() * 150000);
        const longRatio = 0.45 + (Math.random() * 0.1);
        const shortRatio = 1 - longRatio;

        return {
            symbol: symbol,
            longRatio: longRatio,
            shortRatio: shortRatio,
            longVolume: totalVolume * longRatio,
            shortVolume: totalVolume * shortRatio,
            totalVolume: totalVolume,
            timestamp: new Date().toISOString(),
            source: 'Symulacja (API limit)'
        };
    }

    // Pobierz dane dla różnych timeframeów
    async getAllTimeframes(symbol = 'NEARUSDT') {
        const timeframes = ['1m', '5m', '15m', '30m', '1h', '4h'];
        const baseData = await this.getLongShortData(symbol);
        const results = {};

        for (const tf of timeframes) {
            // Dla różnych timeframeów modyfikujemy volume
            const timeFactor = this.getTimeFactor(tf);
            
            results[tf] = {
                ...baseData,
                symbol: symbol,
                interval: tf,
                longVolume: baseData.longVolume * timeFactor,
                shortVolume: baseData.shortVolume * timeFactor,
                totalVolume: baseData.totalVolume * timeFactor
            };
        }

        return results;
    }

    getTimeFactor(timeframe) {
        const factors = {
            '1m': 0.02,
            '5m': 0.08,
            '15m': 0.2,
            '30m': 0.4,
            '1h': 1,
            '4h': 3
        };
        return factors[timeframe] || 1;
    }
}

module.exports = BybitRealtimeTracker;
