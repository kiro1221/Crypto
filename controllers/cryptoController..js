const express = require('express');
const dotenv = require('dotenv').config();
const router = express.Router();
const axios = require('axios');

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

module.exports = router;
