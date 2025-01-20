const express = require('express');
const dotenv = require('dotenv').config();
const render = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');

render.get('/login', async (req, res) => {
    try {
        res.render('login');
    } catch (err) {
        res.status(400).json(err);
    }
});

render.get('/register', async (req, res) => {
    try {
        res.render('register');
    } catch (err) {
        res.status(400).json(err);
    }
});
render.get('/forgotPassword', async (req, res) => {
    try {
        res.render('forgotPass');
    } catch (err) {
        res.status(400).json(err);
    }
});
render.get('/', requireAuth, async (req, res) => {
    try {
        res.render('home');
    } catch (err) {
        res.status(400).json(err);
    }
});
module.exports = render;
