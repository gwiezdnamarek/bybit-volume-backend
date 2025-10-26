const axios = require('axios');

async function testAPIs() {
    console.log('🔍 TESTUJĘ DOSTĘPNE API...\n');

    // Test 1: Bybit Long/Short Ratio
    try {
        console.log('1. Bybit Long/Short Ratio:');
        const bybitResponse = await axios.get('https://api.bybit.com/v5/market/long-short-ratio', {
            params: {
                category: 'linear',
                symbol: 'BTCUSDT',
                period: '1h',
                limit: 1
            }
        });
        console.log('✅ DZIAŁA:', bybitResponse.data.retCode === 0 ? 'TAK' : 'NIE');
        if (bybitResponse.data.retCode === 0) {
            console.log('   Dane:', bybitResponse.data.result.list[0]);
        }
    } catch (error) {
        console.log('❌ BŁĄD:', error.message);
    }

    console.log('---');

    // Test 2: Binance Taker Buy/Sell Ratio
    try {
        console.log('2. Binance Taker Buy/Sell Ratio:');
        const binanceResponse = await axios.get('https://fapi.binance.com/fapi/v1/takerlongshortRatio', {
            params: {
                symbol: 'BTCUSDT',
                period: '5m'
            }
        });
        console.log('✅ DZIAŁA:', Array.isArray(binanceResponse.data) ? 'TAK' : 'NIE');
        if (Array.isArray(binanceResponse.data) && binanceResponse.data.length > 0) {
            console.log('   Dane:', binanceResponse.data[0]);
        }
    } catch (error) {
        console.log('❌ BŁĄD:', error.message);
    }

    console.log('---');

    // Test 3: CoinGlass
    try {
        console.log('3. CoinGlass Long/Short:');
        const coinglassResponse = await axios.get('https://fapi.coinglass.com/api/futures/longShortChart', {
            params: {
                symbol: 'BTC',
                timeType: 'h1'
            },
            headers: {
                'User-Agent': 'Mozilla/5.0'
            }
        });
        console.log('✅ DZIAŁA:', coinglassResponse.data.success ? 'TAK' : 'NIE');
        if (coinglassResponse.data.success) {
            console.log('   Symbol:', coinglassResponse.data.data.symbol);
        }
    } catch (error) {
        console.log('❌ BŁĄD:', error.message);
    }
}

testAPIs();
