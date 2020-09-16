var passport = require('passport');
var localStrategy = require('passport-local').Strategy;
var User = require('./models/users');
var JwtStrategy = require('passport-jwt').Strategy;
var ExtractJwt = require('passport-jwt').ExtractJwt;
var jwt = require('jsonwebtoken');

var config = require('./config');

passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

exports.getToken = function(user) {
    return jwt.sign(user, config.secretKey, 
        {expiresIn: 3600*12});
};

var opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = config.secretKey;

exports.jwtPassport = passport.use(new JwtStrategy(opts, 
    (jwt_payload, done) => {
        console.log("JWT payload: ", jwt_payload);
        User.findOne({_id: jwt_payload._id}, (err, user) => {
            if (err) {
                err.status(403);
                return done(err, false, false);
            }
            else if (user) {
                if (user.admin) {
                    return done(null, user, true);
                }
                else {
                    return done(null, user, false);
                }
            }
            else {
                return done(null, false, false);
            }
        });
    }));

exports.verifyUser = passport.authenticate('jwt', { session: false });

exports.verifyAdmin = passport.authenticate('jwt', { session: false });