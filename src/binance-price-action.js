const axios = require('axios');

class BinancePriceActionTracker {
    constructor() {
        this.baseURL = 'https://fapi.binance.com';
    }

    async getKlineData(symbol = 'NEARUSDT', interval = '5m', limit = 20) {
        try {
            const response = await axios.get(`${this.baseURL}/fapi/v1/klines`, {
                params: { symbol, interval, limit }
            });

            return response.data.map(k => ({
                timestamp: new Date(k[0]),
                open: parseFloat(k[1]),
                high: parseFloat(k[2]),
                low: parseFloat(k[3]),
                close: parseFloat(k[4]),
                volume: parseFloat(k[5]),
                trades: parseInt(k[8])
            }));
        } catch (error) {
            console.error(`❌ Kline Error for ${interval}:`, error.message);
            return [];
        }
    }

    async getOpenInterest(symbol = 'NEARUSDT') {
        try {
            const response = await axios.get(`${this.baseURL}/fapi/v1/openInterest`, {
                params: { symbol }
            });

            return {
                openInterest: parseFloat(response.data.openInterest),
                timestamp: new Date(response.data.time)
            };
        } catch (error) {
            console.error('❌ Open Interest Error:', error.message);
            return { openInterest: 0, timestamp: new Date() };
        }
    }

    async getTicker24hr(symbol = 'NEARUSDT') {
        try {
            const response = await axios.get(`${this.baseURL}/fapi/v1/ticker/24hr`, {
                params: { symbol }
            });

            return {
                price: parseFloat(response.data.lastPrice),
                priceChange: parseFloat(response.data.priceChangePercent),
                volume: parseFloat(response.data.volume),
                high: parseFloat(response.data.highPrice),
                low: parseFloat(response.data.lowPrice)
            };
        } catch (error) {
            console.error('❌ Ticker Error:', error.message);
            return { price: 0, priceChange: 0, volume: 0, high: 0, low: 0 };
        }
    }

    // Analiza price action dla sygnałów odwrócenia
    analyzePriceAction(klineData, oiData) {
        if (klineData.length < 3) return { buySignal: false, sellSignal: false };

        const current = klineData[0];
        const previous = klineData[1];
        const twoBack = klineData[2];

        // Oblicz RSI-like indicator
        const gains = klineData.slice(0, 5).filter(c => c.close > c.open).length;
        const losses = klineData.slice(0, 5).filter(c => c.close < c.open).length;
        const rsiLike = gains / (gains + losses);

        // Sygnały oparte na price action
        const signals = {
            // Sygnał KUPNA: wybicie dołka + duży volume
            buySignal: current.close > current.open && // zielona świeca
                      current.close > previous.low && // wybicie poprzedniego dołka
                      current.volume > (previous.volume * 1.3) && // volume spike
                      rsiLike < 0.3, // wyprzedanie

            // Sygnał SPRZEDAŻY: wybicie szczytu + duży volume  
            sellSignal: current.close < current.open && // czerwona świeca
                       current.close < previous.high && // wybicie poprzedniego szczytu
                       current.volume > (previous.volume * 1.3) && // volume spike
                       rsiLike > 0.7, // wykupienie

            // Siła sygnału
            strength: Math.max(
                Math.abs(current.close - previous.close) / previous.close,
                current.volume / previous.volume
            ),

            volumeSpike: current.volume > (previous.volume * 1.5),

            data: {
                rsiLike: (rsiLike * 100).toFixed(1),
                priceChange: ((current.close - previous.close) / previous.close * 100).toFixed(2),
                currentPrice: current.close,
                volumeChange: ((current.volume - previous.volume) / previous.volume * 100).toFixed(1),
                openInterest: oiData.openInterest,
                timestamp: new Date().toISOString()
            }
        };

        return signals;
    }

    async getReversalSignalsForTimeframe(symbol = 'NEARUSDT', timeframe = '5m') {
        try {
            const [klineData, oiData] = await Promise.all([
                this.getKlineData(symbol, timeframe, 10),
                this.getOpenInterest(symbol)
            ]);

            if (klineData.length === 0) {
                throw new Error(`Brak danych kline dla ${timeframe}`);
            }

            return this.analyzePriceAction(klineData, oiData);

        } catch (error) {
            console.error(`❌ Analysis Error for ${timeframe}:`, error.message);
            return {
                buySignal: false,
                sellSignal: false,
                strength: 0,
                volumeSpike: false,
                data: {
                    rsiLike: '50.0',
                    priceChange: '0',
                    currentPrice: 0,
                    volumeChange: '0',
                    openInterest: 0,
                    timestamp: new Date().toISOString()
                }
            };
        }
    }

    async getAllTimeframes(symbol = 'NEARUSDT') {
        try {
            const timeframes = ['5m', '15m', '30m', '1h'];
            const results = {};

            for (const tf of timeframes) {
                console.log(`🔍 Analizuję price action dla: ${tf}`);
                const signals = await this.getReversalSignalsForTimeframe(symbol, tf);
                
                results[tf] = {
                    symbol: symbol,
                    interval: tf,
                    buySignal: signals.buySignal,
                    sellSignal: signals.sellSignal,
                    signalStrength: signals.strength.toFixed(3),
                    volumeSpike: signals.volumeSpike,
                    rsiLike: signals.data.rsiLike + '%',
                    price: signals.data.currentPrice,
                    priceChange: signals.data.priceChange + '%',
                    volumeChange: signals.data.volumeChange + '%',
                    openInterest: signals.data.openInterest,
                    timestamp: signals.data.timestamp,
                    source: `Binance ${tf} Price Action 🚨`
                };
            }

            return results;

        } catch (error) {
            console.error('Błąd analizy price action:', error);
            throw error;
        }
    }
}

module.exports = BinancePriceActionTracker;
