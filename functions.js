
const axios = require('axios');

const getFavorite = async element => {
    console.log(element.currency);
    try {
        const response = await axios.get(
            `https://api.coinranking.com/v2/coins?search=${element.currency}`,
            {
                headers: {
                    'x-access-token': process.env.CRYPTO_API
                }
            }
        );
        const firstSuggestion = response.data.data.coins[0];

        const coinDetails = await Promise.all(
            [firstSuggestion].map(async (coin) => ({
                name: coin.name,
                price: coin.price,
                marketCap: coin.marketCap,
                rank: coin.rank,
                iconUrl: coin.iconUrl,
                symbol: coin.symbol,
                trend1h: await sparkLine(coin.name, '1h'),
                trend24h: await sparkLine(coin.name, '24h'),
                trend7d: await sparkLine(coin.name, '7d'),
            }))
        );
        return coinDetails; 
    } catch (error) {
        console.log(error);
    }
};
const sparkLine = async(currency, timePeriod) => {
    try {
        const response = await axios.get(
            `https://api.coinranking.com/v2/coins?search=${currency}&timePeriod=${timePeriod}`,
            {
                headers: {
                    'x-access-token': process.env.CRYPTO_API
                }
            }
        );
        const sparkLine = await response.data.data.coins[0].sparkline
        
        const startPrice = sparkLine[0];
        const lastPrice = sparkLine[sparkLine.length - 2];
        const trend = ((lastPrice - startPrice) / startPrice) * 100;
        return trend.toFixed(2)
    } catch (error) {
console.log(error)    }
};
module.exports = { sparkLine,getFavorite };