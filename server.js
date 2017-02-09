var express = require('express');
var cookieParser = require('cookie-parser')
var bodyParser = require('body-parser')
var session = require('express-session')
var flash = require('connect-flash');
const users = require('./users');
var port = 8999;

var app = express();

function checkAuth (req, res, next) {
	if (req.url === '/manage' && (!req.session || !req.session.authenticated)) {
		res.render('unauthorised', { status: 403 });
		return;
	}

	next();
}
app.locals.users = users;
app.use(cookieParser())
app.set('trust proxy', 1) // trust first proxy
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}))
app.use(bodyParser());
app.use(flash());
app.use(checkAuth);
app.set('view engine', 'jade');
app.set('view options', { layout: false });


require('./lib/routes.js')(app);
/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});


var server = app.listen(port, '127.0.0.1');
console.log('Node listening on port %s', port);
