const express = require('express');
const dotenv = require('dotenv').config();
const router = express.Router();
const axios = require('axios');
const { checkUser } = require('../middleware/authMiddleware');
const favoriteSchema = require('../Models/portfolio');
const User = require('/Users/kiroragai/Desktop/Code/JS/Crypto/Models/user');

router.get('/hello', async (req, res) => {
    try {
        res.status(200).json({ message: 'Hello world!' });
    } catch (err) {
        res.status(400).json({ error: 'failed to fetch' });
    }
});

router.get('/latest', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
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

        res.status(200).json({
            coins,
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
//TODO: add to favorites
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
