const express = require('express');
const dotenv = require('dotenv').config();
const router = express.Router();
const axios = require('axios');
const { checkUser } = require('../middleware/authMiddleware');
const favoriteSchema = require('../Models/portfolio');
const User = require('/Users/kiroragai/Desktop/Code/JS/Crypto/Models/user');

// const sparkline = [
//     34250.5,
//     34300.2,
//     34400.1,
//     34350.3,
//     34200.6,
//     34100.8,
//     34280.7,
//     34450.9,
//     34320.4,
//     34210.3
// ];
// const timePeriod = '1h';

const sparkLine =  (sparkline,timePeriod) => {
    //sparkline = [];
    try {
        // const response = await axios.get(
        //     `https://api.coinranking.com/v2/coins?timePeriod=${timePeriod}`,
        //     {
        //         headers: {
        //             'X-CMC_PRO_API_KEY': process.env.CRYPTO_API
        //         }
        //     }
        // );

        //const sparkLine = response.data.data.coins[0].sparkline;
        const startPrice = sparkline[0];
        const lastPrice = sparkline[sparkline.length - 2];
        // const startPrice = '94890.3929713267';
        // const lastPrice = '107864.81746433847'
        console.log(sparkLine);
        console.log(startPrice);
        console.log(lastPrice);

        const trend = ((lastPrice - startPrice) / startPrice) * 100;
        console.log(trend.toFixed(2));
        return trend.toFixed(2);
    } catch (error) {
        console.log(error);
    }
};

router.get('/latest', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const timePeriod = '1h';
    try {
        const response = await axios.get(
            `https://api.coinranking.com/v2/coins`,
            {
                headers: {
                    'X-CMC_PRO_API_KEY': process.env.CRYPTO_API
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
        const coinDetails = coins.map(coin => ({
            name: coin.name,
            price: coin.price,
            marketCap: coin.marketCap,
            rank: coin.rank,
            iconUrl: coin.iconUrl,
            symbol: coin.symbol,
            //sparkLine: coin.sparkline,
            trend1h: sparkLine(coin.sparkline,'1h'),
            trend24h: sparkLine(coin.sparkline,'24h'),
            trend7d: sparkLine(coin.sparkline,'7d'),
            trend1y: sparkLine(coin.sparkline,'1y')
        }));
        // const sparkline = coins[0].sparkline;
        // console.log(sparkline)
        // //const trend = sparkLine(sparkline, timePeriod);

        res.status(200).json({
            coins: coinDetails,
            //trend,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems: stats
            }
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
                    'X-CMC_PRO_API_KEY': process.env.CRYPTO_API
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
module.exports = router;
