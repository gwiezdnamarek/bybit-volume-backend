const { RestClientV5 } = require('bybit-api');

class BybitSimpleTracker {
    constructor() {
        this.client = new RestClientV5({
            key: process.env.BYBIT_API_KEY,
            secret: process.env.BYBIT_API_SECRET,
            testnet: false
        });
    }

    // Pobierz aktualne dane long/short dla różnych timeframe'ów
    async getCurrentLongShortData(symbol = 'NEARUSDT') {
        try {
            console.log('📡 Pobieram aktualne dane z Bybit...');
            
            // Używamy danych 1h (jedyny dostępny timeframe) i skalujemy dla innych
            const ratioResponse = await this.client.getLongShortRatio({
                category: 'linear',
                symbol: symbol,
                period: '1h',
                limit: 1
            });

            const tickerResponse = await this.client.getTickers({
                category: 'linear',
                symbol: symbol
            });

            if (ratioResponse.retCode === 0 && tickerResponse.retCode === 0) {
                const ratioData = ratioResponse.result.list[0];
                const ticker = tickerResponse.result.list[0];
                
                const longRatio = parseFloat(ratioData.buyRatio);
                const shortRatio = parseFloat(ratioData.sellRatio);
                const totalVolume24h = parseFloat(ticker.volume24h);
                const currentPrice = parseFloat(ticker.lastPrice);
                
                return {
                    symbol: symbol,
                    longRatio: longRatio,
                    shortRatio: shortRatio,
                    totalVolume24h: totalVolume24h,
                    currentPrice: currentPrice,
                    timestamp: new Date().toISOString(),
                    source: 'Bybit Real API 🔥'
                };
            }

            throw new Error('Błąd odpowiedzi API');

        } catch (error) {
            console.error('❌ Błąd Bybit API:', error.message);
            throw error;
        }
    }

    // Generuj dane dla różnych timeframe'ów na podstawie aktualnych
    async getAllTimeframes(symbol = 'NEARUSDT') {
        try {
            const baseData = await this.getCurrentLongShortData(symbol);
            const timeframes = ['1m', '5m', '15m', '30m', '1h'];
            const results = {};

            for (const tf of timeframes) {
                const timeFactor = this.getTimeFactor(tf);
                const volume = baseData.totalVolume24h * timeFactor;
                
                results[tf] = {
                    symbol: baseData.symbol,
                    interval: tf,
                    longRatio: baseData.longRatio,
                    shortRatio: baseData.shortRatio,
                    longVolume: volume * baseData.longRatio,
                    shortVolume: volume * baseData.shortRatio,
                    totalVolume: volume,
                    price: baseData.currentPrice,
                    timestamp: baseData.timestamp,
                    source: baseData.source
                };
            }

            return results;

        } catch (error) {
            console.error('Błąd pobierania danych:', error);
            throw error;
        }
    }

    getTimeFactor(timeframe) {
        const factors = {
            '1m': 0.008,
            '5m': 0.04,
            '15m': 0.12,
            '30m': 0.25,
            '1h': 1.0
        };
        return factors[timeframe] || 1;
    }
}

module.exports = BybitSimpleTracker;
