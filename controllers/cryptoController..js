const express = require('express');
const router = express.Router();
const axios = require('axios');
const { checkUser } = require('../middleware/authMiddleware');
const { sparkLine, getFavorite,exchangeRate } = require('../functions');
const favoriteSchema = require('../Models/portfolio');
const User = require('/Users/kiroragai/Desktop/Code/JS/Crypto/Models/user');

router.get('/latest', checkUser,async (req, res) => {
    const page = parseInt(req.query.page) || 1;//TODO:OPTOMIZE BY LOADING THE NEXT PAE IN THE BACKGROUND OVER AND OVER
    const limit = parseInt(req.query.limit) || 5 ;

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
        const user = res.locals.user
        const favCurrency = user.favCurrency
        const { coins } = response.data.data;
        const stats = response.data.data.stats.total;
        const totalPages = Math.ceil(stats / limit);
        const rate = await exchangeRate(favCurrency)

        const coinDetails = await Promise.all(
            coins.map(async (coin) => ({
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
        res.status(200).json({
            coins: coinDetails,
            //coins,
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

router.get('/marketCap', checkUser,async (req, res) => {
    try {
        const response = await axios.get(
            `https://api.coingecko.com/api/v3/global`,
            {
                headers: {
                    'x-access-token': process.env.GECKO_API
                }
            }
        );
        const user = res.locals.user
        const favCurrency = user.favCurrency
        const result = favCurrency.toLowerCase()
        const marketCap = response.data.data.total_market_cap[result]
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
            const user = res.locals.user;
            const favoritesDetails = await Promise.all(
                user.favorites.map(element => getFavorite(element, user))
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
    try {
        const result = await sparkLine("eth", "7d")
        res.status(200).json({ result });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
})

router.get('/exchange', async (req, res) => {
    try {
        const response = await axios.get(`https://v6.exchangerate-api.com/v6/${process.env.EXCHANGE_API}/latest/USD`);
        const { conversion_rates } = response.data
        
        console.log('Response Data:',conversion_rates.CAD);
        res.status(200).json({ response: conversion_rates });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ message: 'Failed to fetch exchange rates', error: error.message });
    }
});
router.get('/getCurrency', checkUser, async (req, res) => {
    const user = res.locals.user;
    if(!user){ 
        res.status(200).json({ status: 'Cant find user' });
    }
    try{
        res.status(200).json({ status: user.favCurrency });
    }catch(error){
        res.status(400).json({ message: error.message });
    }
})
router.put('/updateCurrency', checkUser, async (req, res) => {
    const { currency } = req.body;
    const user = res.locals.user;
    if(!user){
        res.status(200).json({ status: 'Cant find user' });
    }
    try{
        user.favCurrency = currency;
        await user.save();
        res.status(200).json({ status: user });
    }catch(error){
        res.status(400).json({ message: error.message });
    }
})
module.exports = router;
