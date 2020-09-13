var express = require('express');
const bodyParser = require('body-parser');
var passport = require('passport');
const authenticate = require('../authenticate');
var User = require('../models/users');

var router = express.Router();
router.use(bodyParser.json());

router.get('/', (req, res, next) => {
  res.send('respond wiht a resource');
});

router.post('/signup', (req, res, next) => {
  console.log('req body: ' + req.body.username + ' ' + req.body.password);
  User.register(new User({username: req.body.username, password: req.body.password}), 
    req.body.password, (err, user) => {
    if(err) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.json({err: err});
    }
    else {
      passport.authenticate('local')(req, res, () => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json({success: true, status: 'Registration Successful!'});
      });
    }
  });
});

router.post('/login', passport.authenticate('local'), (req, res) => {
  var token = authenticate.getToken({ _id: req.user._id });
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.json({success: true, token: token, status: 'You are successfully logged in!'});
});

router.get('/logout', (req, res) => {
  if (req.session) {
    req.session.destroy();
    res.clearCookie('session-id');
    res.redirect('/');
  }
  else {
    var err = new Error('You are not logged in!');
    err.status = 403;
    next(err);
  }
});

module.exports = router;
