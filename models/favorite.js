const mongoose = require('mongoose');
const Dishes = require('./dishes')
const User = require('./users');
const Schema = mongoose.Schema;

var favoriteSchema = new Schema({
    user:  {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',   // or UserSchema ??
        required: true
    },
    dishes: 
      [
          {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Dish'
          }
      ]
}, {
    timestamps: true
});

var Favorites = mongoose.model('Favorite', favoriteSchema);

module.exports = Favorites;

