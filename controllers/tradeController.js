const express = require('express');
const router = express.Router();
const axios = require('axios');
const { checkUser, requireAuth } = require('../middleware/authMiddleware');
const User = require('/Users/kiroragai/Desktop/Code/JS/Crypto/Models/user');
const Portfolio = require('/Users/kiroragai/Desktop/Code/JS/Crypto/Models/portfolio');
const { sparkLine, getFavorite,exchangeRate } = require('../functions');

router.post('/buy', requireAuth, checkUser, async (req, res) => {
    const user = res.locals.user;
    const { portfolioName, portfolioAmount, portfolioArray } = req.body;
    try {
        const userId = user._id;
        if (!userId || !portfolioName || !Array.isArray(portfolioArray)) {
            return res.status(400).json({ error: 'Invalid input' });
        }
        let findPortfolio = await Portfolio.findOne({ userId, portfolioName });

        if (findPortfolio) {
            for (const newCurrency of portfolioArray) {
                if (!newCurrency.currency || typeof newCurrency.totalCoin !== "number") {
                    return res.status(400).json({ error: "Invalid currency or total" });
                }
                const existingCurrency = findPortfolio.portfolioArray.find(
                    (c) => c.currency === newCurrency.currency
                );

                if (existingCurrency) {
                    await Portfolio.updateOne(
                        { userId, portfolioName, "portfolioArray.currency": newCurrency.currency },
                        { $inc: { "portfolioArray.$.totalCoin": newCurrency.totalCoin } }//$inc: increase
                    );
                } else {
                    await Portfolio.updateOne(
                        { userId, portfolioName },
                        { $push: { portfolioArray: { currency: newCurrency.currency, totalCoin: newCurrency.totalCoin } } }
                    );
                }
            }
            findPortfolio = await Portfolio.findOne({ userId, portfolioName });
            return res.status(200).json(findPortfolio);
        } else {
            const newPortfolio = new Portfolio({
                userId,
                portfolioName,
                portfolioAmount,
                portfolioArray: portfolioArray.map(currency => ({
                    currency: currency.currency,
                    totalCoin: currency.totalCoin ?? 0 
                })),
            });
            const savedPortfolio = await newPortfolio.save();
            return res.status(200).json(savedPortfolio);
        }
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
});

router.get('/portfolio', requireAuth, checkUser ,async (req, res) => {//TODO: SIMILAR TO THE FAV FUNCTION, SEND THE REQUEST USING THE NAME
    const user = res.locals.user;
    try {
        if(!user){
            res.status(400).json({ message: 'User not found' });
        }
        getFavorite()

    }catch (error) {
        res.status(400).json({ message: error.message });
    }
})

module.exports = router;
