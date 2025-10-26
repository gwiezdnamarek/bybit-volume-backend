const axios = require('axios');

const baseURL = 'https://fapi.binance.com';
const symbol = 'NEARUSDT';

async function testEndpoint(endpoint, params = {}) {
    try {
        console.log(`\n🔍 Testing: ${endpoint}`);
        const response = await axios.get(`${baseURL}${endpoint}`, { params });
        console.log(`✅ WORKS:`, response.data.slice ? `Array(${response.data.length})` : 'Object');
        if (response.data.length > 0) {
            console.log('Sample:', JSON.stringify(response.data[0]).substring(0, 100) + '...');
        }
        return true;
    } catch (error) {
        console.log(`❌ FAILED: ${error.response?.status} - ${error.message}`);
        return false;
    }
}

async function testAll() {
    console.log('🧪 Testing Binance API endpoints...\n');
    
    await testEndpoint('/fapi/v1/ticker/24hr', { symbol });
    await testEndpoint('/fapi/v1/klines', { symbol, interval: '5m', limit: 5 });
    await testEndpoint('/fapi/v1/openInterest', { symbol });
    await testEndpoint('/fapi/v1/topLongShortPositionRatio', { symbol, period: '5m', limit: 5 });
    await testEndpoint('/fapi/v1/globalLongShortAccountRatio', { symbol, period: '5m', limit: 5 });
    await testEndpoint('/fapi/v1/takerlongshortRatio', { symbol, period: '5m', limit: 5 });
    await testEndpoint('/fapi/v1/longShortRatio', { symbol, period: '5m', limit: 5 });
}

testAll();
