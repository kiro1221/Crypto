const dotenv = require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const port = process.env.PORT || 9000;
const app = express();
const authController = require('./controllers/authController');
const crypto = require('./controllers/cryptoController.');

app.use(express.json());
app.use(cookieParser());
app.use('/authentication', authController);
app.use('/crypto', crypto);

const connectDB = url => {
    return mongoose.connect(url);
};

const start = async () => {
    try {
        await connectDB(process.env.MONGO_URI);
        console.log('Connected to db...👾');
        app.listen(port, () => {
            console.log(`Listening on port ${port}...🤖`);
        });
    } catch (err) {
        console.log(err);
    }
};
start();
