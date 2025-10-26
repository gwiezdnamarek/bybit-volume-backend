class TestDataTracker {
    async getAllTimeframes(symbol = 'NEARUSDT') {
        console.log('📊 Using TEST DATA for development');
        
        const timeframes = ['5m', '15m', '30m', '1h'];
        const results = {};
        
        const basePrice = 2.35;
        const baseVolume = 50000;
        
        timeframes.forEach((tf, index) => {
            const priceVariation = (Math.random() * 0.1) - 0.05;
            const volumeVariation = (Math.random() * 0.5) + 0.5;
            
            results[tf] = {
                symbol: symbol,
                interval: tf,
                price: (basePrice * (1 + priceVariation)).toFixed(3),
                priceChange: (priceVariation * 100).toFixed(2) + '%',
                trend: priceVariation > 0 ? 'UP' : 'DOWN',
                volume: Math.round(baseVolume * volumeVariation),
                volumeSpike: volumeVariation > 1.2,
                high: (basePrice * 1.02).toFixed(3),
                low: (basePrice * 0.98).toFixed(3),
                timestamp: new Date().toISOString(),
                source: 'TEST DATA 🧪'
            };
        });
        
        return results;
    }
}

module.exports = TestDataTracker;
