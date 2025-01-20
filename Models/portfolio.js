const mongoose = require('mongoose');
const { isEmail } = require('validator');
const bcrypt = require('bcrypt');

const favoriteSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    favorites: {
        type: [String], 
        validate: {
            validator: function (arr) {
                return arr.length === new Set(arr).size; 
            },
            message: 'Favorites must be unique.'
        }
    }
});


module.exports = mongoose.model('Favorite', favoriteSchema); 
