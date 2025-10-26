require('dotenv').config();
const { RestClientV5 } = require('bybit-api');

const client = new RestClientV5({
    key: process.env.BYBIT_API_KEY,
    secret: process.env.BYBIT_API_SECRET,
    testnet: false
});

async function debugAPI() {
    console.log('🔍 Debugowanie Bybit API...\n');

    try {
        // Test 1: Long/Short Ratio
        console.log('1. Testing Long/Short Ratio:');
        const ratio = await client.getLongShortRatio({
            category: 'linear',
            symbol: 'NEARUSDT',
            period: '1h',
            limit: 1
        });
        console.log('Result:', JSON.stringify(ratio, null, 2));

        console.log('\n2. Testing BTC (dla porównania):');
        const ratioBTC = await client.getLongShortRatio({
            category: 'linear', 
            symbol: 'BTCUSDT',
            period: '1h',
            limit: 1
        });
        console.log('BTC Result:', JSON.stringify(ratioBTC, null, 2));

        console.log('\n3. Testing Available Symbols:');
        const symbols = await client.getInstrumentsInfo({
            category: 'linear'
        });
        console.log('Total symbols:', symbols.result.list.length);
        console.log('NEAR exists:', symbols.result.list.find(s => s.symbol === 'NEARUSDT'));
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

debugAPI();
