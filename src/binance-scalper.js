const axios = require('axios');

class BinanceScalper {
    constructor() {
        this.baseURL = 'https://fapi.binance.com';
    }

    async getTakerRatio(symbol = 'NEARUSDT', period = '5m', limit = 10) {
        try {
            const response = await axios.get(`${this.baseURL}/fapi/v1/takerlongshortRatio`, {
                params: { symbol, period, limit }
            });

            return response.data.map(item => ({
                timestamp: new Date(item.timestamp),
                buySellRatio: parseFloat(item.buySellRatio),
                buyVol: parseFloat(item.buyVol),
                sellVol: parseFloat(item.sellVol)
            }));
        } catch (error) {
            console.error(`❌ Taker Ratio Error for ${period}:`, error.message);
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
            const [takerData, klineData] = await Promise.all([
                this.getTakerRatio(symbol, timeframe, 15),
                this.getKlineData(symbol, timeframe, 15)
            ]);

            if (takerData.length === 0 || klineData.length === 0) {
                throw new Error(`Brak danych dla ${timeframe}`);
            }

            const currentTaker = takerData[0];
            const currentPrice = klineData[0];
            const previousPrice = klineData[1];

            const signals = {
                buySignal: currentTaker.buySellRatio > 1.2 && 
                          currentPrice.close < previousPrice.close,
                
                sellSignal: currentTaker.buySellRatio < 0.8 && 
                           currentPrice.close > previousPrice.close,

                strength: Math.abs(currentTaker.buySellRatio - 1),
                
                volumeSpike: currentPrice.volume > (previousPrice.volume * 1.5),
                
                data: {
                    takerRatio: currentTaker.buySellRatio,
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
                    takerRatio: 1,
                    priceChange: '0',
                    currentPrice: 0,
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
                console.log(`🔍 Analizuję timeframe: ${tf}`);
                const signals = await this.getReversalSignalsForTimeframe(symbol, tf);
                
                results[tf] = {
                    symbol: symbol,
                    interval: tf,
                    buySignal: signals.buySignal,
                    sellSignal: signals.sellSignal,
                    signalStrength: signals.strength.toFixed(3),
                    volumeSpike: signals.volumeSpike,
                    takerRatio: signals.data.takerRatio.toFixed(3),
                    price: signals.data.currentPrice,
                    priceChange: signals.data.priceChange + '%',
                    timestamp: signals.data.timestamp,
                    source: `Binance ${tf} Signals 🚨`
                };
            }

            return results;

        } catch (error) {
            console.error('Błąd analizy:', error);
            throw error;
        }
    }
}

module.exports = BinanceScalper;
