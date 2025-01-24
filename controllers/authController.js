const express = require('express');
const dotenv = require('dotenv').config();
const User = require('/Users/kiroragai/Desktop/Code/JS/Crypto/Models/user');
const bcrypt = require('bcrypt');
const router = express.Router();
const { handleErrors } = require('../handleErrors');
const { checkUser } = require('../middleware/authMiddleware');

const jwt = require('jsonwebtoken');
const sessionLength = 5 * 24 * 60 * 60; //3 days
const createToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: sessionLength
    });
};

router.get('/hello', async (req, res) => {
    try {
        res.status(200).json({ message: 'Hello world!' });
    } catch (err) {
        res.status(400).json({ error: 'failed to fetch' });
    }
});
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, confirmPassword } = req.body;
        console.log('Request Body:', req.body);

        if (confirmPassword && password !== confirmPassword) {
            throw Error('Passwords do not match');
        }
        const user = new User({ username, email, password });
        await user.save();
        console.log('User saved:', user);

        if (!user) {
            res.status(404).json({ message: 'Error creating user' });
        }
        res.status(201).json(user);
    } catch (err) {
        const errors = handleErrors(err);
        res.status(400).json({ errors });
    }
});
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.login(username, password);
        const token = createToken(user._id);
        res.cookie('jwt', token, {
            httpOnly: true,
            maxAge: sessionLength * 1000
        });
        res.status(201).json({
            user: user._id,
            token: token,
            username: user.username
        });
    } catch (err) {
        const errors = handleErrors(err);
        res.status(400).json({ errors });
    }
});
router.post('/logout', (req, res) => {
    res.clearCookie('jwt');
    res.status(201).json({ loggedOut: 'User logged out' });
});
router.get('/user', checkUser, async (req, res) => {
    try {
        const user = res.locals.user;
        if (!user) {
            return res.status(200).json(null);
        }
        res.status(200).json(user);
    } catch (err) {
        console.error('Error in user route:', err.message);
        const errors = handleErrors(err) || {
            message: 'Unexpected error occurred'
        };
        res.status(400).json({ errors });
    }
});
router.post('/change-password', checkUser, async (req, res) => {
    const { oldPassword, newPassword, confirmPassword } = req.body;
    if (newPassword.length <= 4 || newPassword !== confirmPassword) {
        return res.status(400).json({
            message:
                'New password must be at least 4 characters and match confirmation'
        });
    }
    try {
        const user = res.locals.user;
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Incorrect old password' });
        }
        user.password = newPassword;
        await user.save();
        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        const errors = handleErrors(error);
        res.status(400).json({ errors });
    }
});
module.exports = router;
