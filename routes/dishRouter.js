const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const authenticate = require('../authenticate');

const Dishes = require('../models/dishes');

const dishRouter = express.Router();

dishRouter.use(bodyParser.json());

dishRouter.route('/')
.get((req,res,next) => {
    Dishes.find({})
    .populate('comments.author')
    .then((dishes) => {
        res.status(200);
        res.setHeader('Content-Type', 'application/json');
        res.json(dishes);
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(authenticate.verifyAdmin, (req, res, next) => {
    Dishes.create(req.body)
    .then((dish) => {
        console.log('Dish Created ', dish);
        res.status(200);
        res.setHeader('Content-Type', 'application/json');
        res.json(dish);
    }, (err) => next(err))
    .catch((err) => next(err));
})
.put(authenticate.verifyAdmin, (req, res, next) => {
    res.status(403);
    res.end('PUT operation not supported on /dishes');
})
.delete(authenticate.verifyAdmin, (req, res, next) => {
    Dishes.remove({})
    .then((resp) => {
        res.status(200);
        res.setHeader('Content-Type', 'application/json');
        res.json(resp);
    }, (err) => next(err))
    .catch((err) => next(err));    
});

dishRouter.route('/:dishId')
.get((req,res,next) => {
    Dishes.findById(req.params.dishId)
    .populate('comments.author')
    .then((dish) => {
        res.status(200);
        res.setHeader('Content-Type', 'application/json');
        res.json(dish);
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(authenticate.verifyAdmin, (req, res, next) => {
    res.status(403);
    res.end('POST operation not supported on /dishes/'+ req.params.dishId);
})
.put(authenticate.verifyAdmin, (req, res, next) => {
    Dishes.findByIdAndUpdate(req.params.dishId, {
        $set: req.body
    }, { new: true })
    .then((dish) => {
        res.status(200);
        res.setHeader('Content-Type', 'application/json');
        res.json(dish);
    }, (err) => next(err))
    .catch((err) => next(err));
})
.delete(authenticate.verifyAdmin, (req, res, next) => {
    Dishes.findByIdAndRemove(req.params.dishId)
    .then((resp) => {
        res.status(200);
        res.setHeader('Content-Type', 'application/json');
        res.json(resp);
    }, (err) => next(err))
    .catch((err) => next(err));
});

dishRouter.route('/:dishId/comments')
.get((req,res,next) => {
    Dishes.findById(req.params.dishId)
    .populate('comments.author')
    .then((dish) => {
        if (dish != null) {
            res.status(200);
            res.setHeader('Content-Type', 'application/json');
            res.json(dish.comments);
        }
        else {
            err = new Error('Dish ' + req.params.dishId + ' not found');
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
            console.log('dish is not null, author is:'+ req.user._id);
            console.log("rating is:" + req.body.rating);
            console.log("comment is:"+req.body.comment)
            var hash = { "rating": req.body.rating, "comment": req.body.comment, "author": req.user._id }
            req.body.author = req.user._id;
            console.log('the object now is:' + hash.rating + ' ' + hash.comment + ' ' + hash.author);
            dish.comments.push(hash);
            dish.save()
            .then((dish) => {
                Dishes.findById(dish._id)
                    .populate('comments.author')
                    .then((dish) => {
                        res.status(200);
                        res.setHeader('Content-Type', 'application/json');
                        res.json(dish);
                    })
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
    res.end('PUT operation not supported on /:dishId/comments');
})
.delete(authenticate.verifyAdmin, (req, res, next) => {
    Dishes.findById(req.params.dishId)
    .then((dish) => {
        if (dish != null) {
            for (var indx = (dish.comments.length - 1); indx >= 0; indx--) {
                console.log('indx '+indx);
                console.log('comment _id:' + dish.comments[indx]._id);
                console.log('comment:' + dish.comments.id(dish.comments[indx]._id));
                dish.comments.id(dish.comments[indx]._id).remove();
            }
            dish.save()
            .then((dish) => {
                res.status(200);
                res.setHeader('Content-Type', 'application/json');
                res.json(dish);
            }, (err) => next(err));
        }
        else {
            err = new Error('Error from dish ' + req.params.dishId + '.');
            err.status(400);
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));
});

dishRouter.route('/:dishId/comments/:commentId')
.get((req, res, next) => {
    Dishes.findById(req.params.dishId)
    .populate('comments.author')
    .then((dish) => {
        if (dish != null && dish.comments.id(req.params.commentId) != null) {
            res.status(200);
            res.setHeader('Content-Type', 'application/json');
            res.json(dish.comments.id(req.params.commentId));
        }
        else if (dish == null) {
            err = new Error('Dish ' + req.params.dishId + ' not found');
            err.status(404);
            return next(err);
        }
        else {
            err = new Error('Comment ' + req.params.commentId + ' not found');
            err.status(404);
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(authenticate.verifyUser, (req, res, next) => {
    res.status(403);
    res.end('POST operation not supported on /dishes/' + req.params.dishId + '/comments/' + req.params.commentId);
})
.put(authenticate.verifyUser, (req, res, next) => {   // cors.corsWithOptions, 
    Dishes.findById(req.params.dishId)
    .then((dish) => {
        if (dish != null && 
            dish.comments.id(req.params.commentId) != null && 
            dish.comments.id(req.params.commentId).author._id === req.user._id) {
            if (req.body.rating) {
                dish.comments.id(req.params.commentId).rating = req.body.rating;
            }
            if (req.body.comment) {
                dish.comments.id(req.params.commentId).comment = req.body.comment;
            }
            dish.save()
            .then((dish) => {
                Dishes.findById(dish._id)
                .populate('comments.author')
                .then((dish) => {
                    res.status(200);
                    res.setHeader('Content-Type', 'application/json');
                    res.json(dish);
                })
            }, (err) => next(err));
        }
        else if (dish == null) {
            err = new Error('Dish ' + req.params.dishId + ' not found');
            err.status(404);
            return next(err);
        }
        else {
            err = new Error('Comment ' + req.params.commentId + ' not found');
            err.status(404);
            return next(err);
        }
    })
})
.delete(authenticate.verifyUser, (req, res, next) => {   // cors.corsWithOptions, 
    Dishes.findById(req.params.dishId)
    .then((dish) => {
        if (dish != null && 
            dish.comments.id(req.params.commentId) != null && 
            dish.comments.id(req.params.commentId).author._id === req.user._id) {
            dish.comments.id(req.params.commentId).remove();
            dish.save()
            .then((dish) => {
                Dishes.findById(dish._id)
                .populate('comments.author')
                .then((dish) => {
                    res.status(200);
                    res.setHeader('Content-Type', 'application/json');
                    res.json(dish);
                })
            }, (err) => next(err));
        }
        else if (dish == null) {
            err = new Error('Dish ' + req.params.dishId + ' not found');
            err.status(404);
            return next(err);
        }
        else {
            err = new Error('Comment ' + req.params.commentId + ' not found');
            err.status(404);
            return next(err);
        }
    })
})

module.exports = dishRouter;
