require('dotenv').config();
const { RestClientV5 } = require('bybit-api');

const client = new RestClientV5({
    key: process.env.BYBIT_API_KEY,
    secret: process.env.BYBIT_API_SECRET,
    testnet: false
});

async function debugTimeframes() {
    console.log('🔍 Debugowanie timeframeów Bybit...\n');

    const timeframes = ['1m', '5m', '15m', '30m', '1h', '4h'];
    
    for (const tf of timeframes) {
        try {
            console.log(`Testing ${tf}:`);
            const response = await client.getLongShortRatio({
                category: 'linear',
                symbol: 'NEARUSDT',
                period: tf,
                limit: 5
            });
            
            console.log(`✅ ${tf}: ${response.retCode === 0 ? 'DZIAŁA' : 'BŁĄD'}`);
            if (response.retCode === 0) {
                console.log(`   Dane: ${response.result.list.length} rekordów`);
            } else {
                console.log(`   Błąd: ${response.retMsg}`);
            }
            console.log('---');
            
        } catch (error) {
            console.log(`❌ ${tf}: ${error.message}`);
            console.log('---');
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
    }
}

debugTimeframes();
