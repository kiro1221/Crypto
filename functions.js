
const axios = require('axios');
const dotenv = require('dotenv').config();

const exchangeRate = async(favCurrency) => {
    try {
        const response = await axios.get(`https://v6.exchangerate-api.com/v6/${process.env.EXCHANGE_API}/latest/USD`);
        const { conversion_rates } = response.data
        return conversion_rates[favCurrency]
    } catch (error) {
        console.error('Error fetching data:', error);
        return null
    }
}
const getFavorite = async (element, user) => {
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
        const favCurrency = user.favCurrency
        const rate = await exchangeRate(favCurrency)

        const coinDetails = await Promise.all(
            [firstSuggestion].map(async (coin) => ({
                name: coin.name,
                price: coin.price * rate,
                marketCap: coin.marketCap * rate,
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

module.exports = { sparkLine,getFavorite,exchangeRate };