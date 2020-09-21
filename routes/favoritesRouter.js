const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const authenticate = require('../authenticate');

const User = require('../models/users');
const Dishes = require('../models/dishes');
const Favorite = require('../models/favorite');

const favoritesRouter = express.Router();

favoritesRouter.use(bodyParser.json());

// Allow a user to GET their favorite Dishes. 
favoritesRouter.route('/')
.get(authenticate.verifyUser, (req,res,next) => {
    Favorite.findOne({user: req.user._id})
    .populate('user')
    .populate('dishes')
    .then((favorite) => {
        res.status(200);
        res.setHeader('Content-Type', 'application/json');
        res.json(favorite);
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(authenticate.verifyUser, (req, res, next) => {
    res.status(403);
    res.end('POST operation not supported on /favorites without :dishId');
})
.put(authenticate.verifyUser, (req, res, next) => {
    res.status(403);
    res.end('PUT operation not supported on /favorites');
})
.delete(authenticate.verifyUser, (req, res, next) => {
    Favorite.findOne({user: req.user._id})
    .then((favorite) => {
        if(favorite != null) {
            while(favorite.dishes.length > 0) {
                var sub_dish = favorite.dishes.pop();
                console.log('Removed dish '+sub_dish._id);
            }
            favorite.save()
            .then((favorite) => {
                Favorite.findById(favorite._id)
                .populate('user')
                .then((favorite) => {
                    res.status(200);
                    res.setHeader('Content-Type', 'application/json');
                    res.json(favorite);
                }, (err) => next(err))
            }, (err) => next(err))
        }
        else {
            err = new Error('Dish ' + req.params.dishId + ' comment could not be POSTed.');
            err.status(404);
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));
});

favoritesRouter.route('/:dishId')
.get(authenticate.verifyUser, (req,res,next) => {
    Favorite.findOne({user: req.user._id})
    .then((favorite) => {
        if (favorite != null) {
            Dishes.findById(req.params.dishId)
            .then((dish) => {
                if (favorite.dishes.indexOf(dish._id) != -1) {
                    Favorite.findById(favorite._id)
                    .populate('user')
                    .populate('dishes')
                    res.status(200);
                    res.setHeader('Content-Type', 'application/json');
                    res.json(favorite);
                }
                else {
                    err = new Error('Dish supplied not found in favorites. Please POST to add to favorites for user '+req.user.username);
                    err.status(404);
                    return next(err);
                }
            }, (err) => next(err))
        }
        else {
            err = new Error('Favorite not found from dish ' + req.params.dishId + ', please POST to create a Favorite user dish.');
            err.status(404);
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(authenticate.verifyUser, (req, res, next) => {
    Dishes.findById(req.params.dishId)
    .then((dish) => {
        if (dish != null) {
            console.log('found a dish:'+dish._id);
            Favorite.findOne({ user: req.user._id})
            .then((favorite) => {
                if (favorite != null) {
                    console.log('we found a favorite '+favorite.user._id);
                    if (!favorite.dishes.includes(req.params.dishId)) {
                        console.log('added dish '+req.params.dishId+' to dishes array');
                        favorite.dishes.push(req.params.dishId);
                    }
                    favorite.save()
                    .then((favorite) => {
                        Favorite.findById(favorite._id)
                        .populate('user')
                        .populate('dishes')
                        .then((favorite) => {
                            res.status(200);
                            res.setHeader('Content-Type', 'application/json');
                            res.json(favorite);
                        }, (err) => next(err))
                    }, (err) => next(err))
                }
                else {
                    console.log('unable to find a favorite, must create one');
                    Favorite.create({ "user": req.user._id, "dishes": []})
                    .then((favorite) => {
                        if (favorite != null) {
                            console.log('Favorite created!');
                            if (!favorite.dishes.includes(req.params.dishId)) {
                                favorite.dishes.push(req.params.dishId);
                            }
                            favorite.save()
                            .then((favorite) => {
                                Favorite.findById(favorite._id)
                                .populate('user')
                                .populate('dishes')
                                .then((favorite) => {
                                    console.log('added dish '+req.params.dishId+' to dishes array');
                                    res.status(200);
                                    res.setHeader('Content-Type', 'application/json');
                                    res.json(favorite);
                                }, (err) => next(err))
                            }, (err) => next(err))
                        }
                        else {
                            console.log('Error when creating favorite, it is null');
                            err = new Error('Error when creating favorite, it is null');
                            err.status(500);
                            return next(err);
                        }
                        
                    }, (err) => next(err))
                    .catch((err) => next(err));
                }
            }, (err) => next(err));
        }
        else {
            err = new Error('Dish ' + req.params.dishId + ' comment could not be POSTed.');
            err.status(404);
            return next(err);
        }
    });
})
.put(authenticate.verifyUser, (req, res, next) => {
    res.status(403);
    res.end('PUT operation not supported on /favorites/:dishId');
})
.delete(authenticate.verifyUser, (req, res, next) => {
    Favorite.findOne({ user: req.user._id})
    .then((favorite) => {
        if (favorite != null) {
            var dish_index = favorite.dishes.indexOf(req.params.dishId);
            if (dish_index != -1) {
                var dish_obj = favorite.dishes.splice(dish_index, 1);
                console.log('Removed dish '+dish_obj+' from array');
            }
            else {
                console.log('Unable to find dish '+req.params.dishId+' from the array');
            }
            favorite.save()
            .then((favorite) => {
                res.status(200);
                res.setHeader('Content-Type', 'application/json');
                res.json(favorite);
            }, (err) => next(err))
            .catch((err) => next(err));
        }
        else {
            console.log('Unable to find a favorite object in the database from user '+ req.user._id);
        }
    }, (err) => next(err))
    .catch((err) => next(err));
});

module.exports = favoritesRouter;