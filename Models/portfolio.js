const mongoose = require('mongoose');
const { isEmail } = require('validator');
const bcrypt = require('bcrypt');

const portfolioSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    portfolioName: {
        type: String,
        required: true,
        unique: true
    },
    portfolioAmount: {
        type: Number,
        default: 0,
    },
    portfolioArray: [
        {
            currency: { type: String, required: true },
            totalCoin: { type: Number, required: true },//total per coin, so 3 = 3 bitcoin
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });


module.exports = mongoose.model('Portfolio', portfolioSchema); 
