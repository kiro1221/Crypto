const express = require('express');
const dotenv = require('dotenv').config();
const router = express.Router();
const axios = require('axios');
const { checkUser } = require('../middleware/authMiddleware');
const favoriteSchema = require('../Models/portfolio');
const User = require('/Users/kiroragai/Desktop/Code/JS/Crypto/Models/user');
var fx = require("money");

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

router.get('/latest', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    try {
        const response = await axios.get(
            `https://api.coinranking.com/v2/coins`,
            {
                headers: {
                    'x-access-token': process.env.CRYPTO_API
                },
                params: {
                    limit,
                    offset: (page - 1) * limit
                }
            }
        );

        const { coins } = response.data.data;
        const stats = response.data.data.stats.total;
        const totalPages = Math.ceil(stats / limit);

        const coinDetails = await Promise.all(
            coins.map(async (coin) => ({
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

        res.status(200).json({
            coins: coinDetails,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems: stats
            }
        });
    } catch (error) {
        console.error("Error fetching latest coins:", error);
        res.status(400).json({ message: error.message });
    }
});

router.get('/marketCap', async (req, res) => {
    try {
        const response = await axios.get(
            `https://api.coingecko.com/api/v3/global`,
            {
                headers: {
                    'x-access-token': process.env.GECKO_API
                }
            }
        );
        const marketCap = response.data.data.total_market_cap.usd;
        res.status(200).json({
            marketCap
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});
router.get('/search', async (req, res) => {
    const { searchResult } = req.body;
    try {
        const response = await axios.get(
            `https://api.coinranking.com/v2/search-suggestions?query=${searchResult}`,
            {
                headers: {
                    'x-access-token': process.env.CRYPTO_API
                }
            }
        );
        const { coins } = response.data.data;
        res.status(200).json({
            coins
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});
//TODO: add to favorites from api call above
router.post('/favorite', checkUser, async (req, res) => {
    const { currency } = req.body;
    const user = res.locals.user;
    console.log(user);
    if (!user) {
        res.status(200).json({ status: 'Cant find user' });
    }
    try {
        const favIndex = user.favorites.findIndex(
            favCurrency => favCurrency.currency === currency
        );
        if (favIndex !== -1) {
            user.favorites.splice(favIndex, 1);
            await user.save();
            return res.status(200).json({
                status: user,
                message: 'Currency removed from favorites'
            });
        } else {
            user.favorites.push({ currency });
            await user.save();
            return res.status(200).json({
                status: user,
                message: 'Currency added to favorites'
            });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.get('/getFavorite', checkUser, async (req, res) => {
    const user = res.locals.user;
    if (!user) {
        res.status(200).json({ status: 'Cant find user' });
    }
    try {
        if (user.favorites.length === 0) {
            res.status(400).json({ message: 'No favorite currency yet' });
        } else {
            const favoritesDetails = await Promise.all(
                user.favorites.map(element => getFavorite(element))
            );
            const validFavorites = favoritesDetails.filter(
                details => details !== null
            );

            res.status(201).json({ user: validFavorites });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});
router.get('/sprakline', async (req, res) => {
    // const currency = "Bitcoin"
    // const timePeriod = "7d"
    try {
        const result = await sparkLine("eth", "7d")
        res.status(200).json({ result });

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
})
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
module.exports = router;
