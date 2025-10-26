const axios = require('axios');

class BinanceWithProxy {
    constructor() {
        this.proxyURL = 'https://cors-anywhere.herokuapp.com/';
        this.binanceURL = 'https://fapi.binance.com';
    }

    async makeRequest(endpoint, params = {}) {
        try {
            const targetURL = `${this.binanceURL}${endpoint}?${new URLSearchParams(params)}`;
            const proxyURL = `${this.proxyURL}${targetURL}`;
            
            console.log(`🔗 Request via proxy: ${endpoint}`);
            const response = await axios.get(proxyURL, { 
                timeout: 15000,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            return response.data;
        } catch (error) {
            console.error(`❌ Proxy request failed:`, error.message);
            throw error;
        }
    }

    async getKlineData(symbol = 'NEARUSDT', interval = '5m', limit = 10) {
        try {
            const data = await this.makeRequest('/fapi/v1/klines', { symbol, interval, limit });
            return data.map(k => ({
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

    async getOpenInterest(symbol = 'NEARUSDT') {
        try {
            const data = await this.makeRequest('/fapi/v1/openInterest', { symbol });
            return {
                openInterest: parseFloat(data.openInterest),
                timestamp: new Date(data.time)
            };
        } catch (error) {
            console.error('❌ Open Interest Error:', error.message);
            return { openInterest: 0, timestamp: new Date() };
        }
    }

    async getAllTimeframes(symbol = 'NEARUSDT') {
        try {
            const timeframes = ['5m', '15m', '30m', '1h'];
            const results = {};

            for (const tf of timeframes) {
                console.log(`🔍 Pobieram via proxy dla: ${tf}`);
                const [klineData, oiData] = await Promise.all([
                    this.getKlineData(symbol, tf, 5),
                    this.getOpenInterest(symbol)
                ]);
                
                if (klineData.length > 1) {
                    const current = klineData[0];
                    const previous = klineData[1];
                    
                    // Prosta analiza price action
                    const buySignal = current.close > current.open && current.volume > previous.volume;
                    const sellSignal = current.close < current.open && current.volume > previous.volume;
                    
                    results[tf] = {
                        symbol: symbol,
                        interval: tf,
                        buySignal: buySignal,
                        sellSignal: sellSignal,
                        price: current.close,
                        priceChange: ((current.close - previous.close) / previous.close * 100).toFixed(2) + '%',
                        volume: current.volume,
                        volumeChange: ((current.volume - previous.volume) / previous.volume * 100).toFixed(1) + '%',
                        openInterest: oiData.openInterest,
                        timestamp: current.timestamp.toISOString(),
                        source: 'Binance + Proxy 🔄'
                    };
                } else {
                    results[tf] = {
                        symbol: symbol,
                        interval: tf,
                        buySignal: false,
                        sellSignal: false,
                        price: 0,
                        priceChange: '0%',
                        volume: 0,
                        volumeChange: '0%',
                        openInterest: 0,
                        timestamp: new Date().toISOString(),
                        source: 'No data ❌'
                    };
                }
            }

            return results;

        } catch (error) {
            console.error('Błąd proxy:', error);
            throw error;
        }
    }
}

module.exports = BinanceWithProxy;
