const axios = require('axios');

class BinanceScalperFixed {
    constructor() {
        this.baseURL = 'https://fapi.binance.com';
    }

    // Użyjmy globalnego long/short ratio zamiast taker ratio
    async getGlobalLongShortRatio(symbol = 'NEARUSDT', period = '5m', limit = 10) {
        try {
            const response = await axios.get(`${this.baseURL}/fapi/v1/globalLongShortAccountRatio`, {
                params: { symbol, period, limit }
            });

            return response.data.map(item => ({
                timestamp: new Date(item.timestamp),
                longShortRatio: parseFloat(item.longShortRatio),
                longAccount: parseFloat(item.longAccount),
                shortAccount: parseFloat(item.shortAccount)
            }));
        } catch (error) {
            console.error(`❌ Global Ratio Error for ${period}:`, error.message);
            return [];
        }
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
                volume: parseFloat(k[5])
            }));
        } catch (error) {
            console.error(`❌ Kline Error for ${interval}:`, error.message);
            return [];
        }
    }

    async getReversalSignalsForTimeframe(symbol = 'NEARUSDT', timeframe = '5m') {
        try {
            const [ratioData, klineData] = await Promise.all([
                this.getGlobalLongShortRatio(symbol, timeframe, 15),
                this.getKlineData(symbol, timeframe, 15)
            ]);

            if (ratioData.length === 0 || klineData.length === 0) {
                throw new Error(`Brak danych dla ${timeframe}`);
            }

            const currentRatio = ratioData[0];
            const currentPrice = klineData[0];
            const previousPrice = klineData[1];

            const signals = {
                buySignal: currentRatio.longShortRatio < 1.0 && // Mniej long = możliwe odwrócenie w górę
                          currentPrice.close < previousPrice.close,
                
                sellSignal: currentRatio.longShortRatio > 1.0 && // Więcej long = możliwe odwrócenie w dół
                           currentPrice.close > previousPrice.close,

                strength: Math.abs(currentRatio.longShortRatio - 1),
                
                volumeSpike: currentPrice.volume > (previousPrice.volume * 1.5),
                
                data: {
                    longShortRatio: currentRatio.longShortRatio,
                    longAccounts: currentRatio.longAccount,
                    shortAccounts: currentRatio.shortAccount,
                    priceChange: ((currentPrice.close - previousPrice.close) / previousPrice.close * 100).toFixed(2),
                    currentPrice: currentPrice.close,
                    timestamp: new Date().toISOString()
                }
            };

            return signals;

        } catch (error) {
            console.error(`❌ Analysis Error for ${timeframe}:`, error.message);
            return {
                buySignal: false,
                sellSignal: false,
                strength: 0,
                volumeSpike: false,
                data: {
                    longShortRatio: 1,
                    longAccounts: 0.5,
                    shortAccounts: 0.5,
                    priceChange: '0',
                    currentPrice: 0,
                    timestamp: new Date().toISOString()
                }
            };
        }
    }

    async getAllTimeframes(symbol = 'NEARUSDT') {
        try {
            const timeframes = ['5m', '15m', '30m', '1h', '2h', '4h'];
            const results = {};

            for (const tf of timeframes) {
                console.log(`🔍 Analizuję timeframe: ${tf}`);
                const signals = await this.getReversalSignalsForTimeframe(symbol, tf);
                
                results[tf] = {
                    symbol: symbol,
                    interval: tf,
                    buySignal: signals.buySignal,
                    sellSignal: signals.sellSignal,
                    signalStrength: signals.strength.toFixed(3),
                    volumeSpike: signals.volumeSpike,
                    longShortRatio: signals.data.longShortRatio.toFixed(3),
                    longAccounts: (signals.data.longAccounts * 100).toFixed(1) + '%',
                    shortAccounts: (signals.data.shortAccounts * 100).toFixed(1) + '%',
                    price: signals.data.currentPrice,
                    priceChange: signals.data.priceChange + '%',
                    timestamp: signals.data.timestamp,
                    source: `Binance ${tf} Global Ratio 🚨`
                };
            }

            return results;

        } catch (error) {
            console.error('Błąd analizy:', error);
            throw error;
        }
    }
}

module.exports = BinanceScalperFixed;
