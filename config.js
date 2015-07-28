exports.SessionOptions = {
    url: 'mongodb://localhost:27017/test', 
    secret: 'superTopSecret'
}

exports.OAuth2StrategyOptions = {
    authorizationURL: 'https://login.windows.net/common/oauth2/authorize',
    tokenURL: 'https://login.windows.net/common/oauth2/token',
    clientID: '<Insert clientId here>',
    clientSecret: '<Insert client secret here>',
    callbackURL: 'http://localhost:3000/auth/provider/callback',
    passReqToCallback: true
}

exports.GraphResource = 'https://graph.microsoft.com';