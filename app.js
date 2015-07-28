'use strict';

var express = require('express');
var passport = require('passport');
var OAuth2Strategy = require('passport-oauth').OAuth2Strategy;
var syncRequest = require('sync-request');
var Session = require('connect-mongodb');
var path = require('path');
var config = require('./config');

var ensureAuthenticated = function (req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/auth/provider');
};

var app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(express.static(path.join(__dirname, 'public')));

app.use(express.cookieParser());

var session = express.session({
    store: new Session({
        url: config.SessionOptions.url, 
        maxAge: 300000
    }),
    secret: config.SessionOptions.secret
});
app.use(session);

app.use(passport.initialize());

passport.use(
    new OAuth2Strategy(
        config.OAuth2StrategyOptions,
        function (req, accessToken, refreshToken, profile, done) {
            req.session.accessToken = accessToken;
            console.log(req.session.accessToken);
            done(null, profile);
        }
    )
);

passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (id, done) {
    done(null, id);
});




// Route /
app.get('/', ensureAuthenticated, homePage);
function homePage(req, res, next) {
    console.log("home page");
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Welcome!\n');
    return next();
}

// Route /visualize
app.get('/visualize', visualizePage);
function visualizePage(req, res, next) {
    res.render('visualize');
}

// Route /loginFailed
app.get('/loginfailed', loginFailed);
function loginFailed(req, res, next) {
    console.log("Login failed");
    res.end('Login failed');
    return next();
}

// Route /loginSucceeded
app.get('/loginSucceeded', loginSucceeded);
function loginSucceeded(req, res, next) {
    console.log("Login succeeded");
    res.end('Login succeeded');
    return next();
}

// Route /getData
app.get('/getData', getData);
function getData(req, res, next) {
    console.log("Get data " + req.query.userId + ' ' + req.query.entityType + ' ' + req.query.entityId + ' ' + req.query.entityType2 + "\n");
    
    if (req.session.accessToken != null) {
        CallGraph(req.session.accessToken, req.query.userId, req.query.entityType, req.query.entityId, req.query.entityType2, function (response, statusCode) {
            res.writeHead(statusCode, { 'Content-Type': 'application/json' });
            res.write(response);
        });
    }
    else {
        res.writeHead(401);
        res.write("Not authorized");
    }
    
    res.end();
    return next();
}

// Route /auth/provider
app.get('/auth/provider', passport.authenticate('oauth2', { resource: config.GraphResource }));

// Route /auth/provider/callback
app.get('/auth/provider/callback',
  passport.authenticate(
    'oauth2', 
    { successRedirect: '/visualize', failureRedirect: '/loginfailed' }
));

app.listen(3000);




// Helper function
function CallGraph(accessToken, userId, entityType, entityId, entityType2, callback) {
    var headers = {
        'Authorization' : 'Bearer ' + accessToken,
    };
    
    var url = 'https://graph.microsoft-ppe.com/beta/microsoft.com/users';
    
    if (userId) {
        if (userId == "me") {
            url = 'https://graph.microsoft-ppe.com/beta/me';
        }
        else {
            url = url + '/' + userId;
            
            if (entityType) {
                url = url + '/' + entityType;
                
                if (entityId) {
                    url = url + '/' + entityId;
                    
                    if (entityType2) {
                        url = url + '/' + entityType2;
                    }
                }
            }
        }
    }
    
    var res = syncRequest('GET', url, { headers: headers });
    var json = JSON.parse(res.getBody());
    var response = JSON.stringify(json, null, 4);
    if (res.statusCode != 200) {
        process.stdout.write(response);
    }
    callback(response, res.statusCode);
}