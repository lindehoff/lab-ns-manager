const express = require('express');
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const session = require('express-session')
const flash = require('connect-flash');
const settings = require('./config/settings');
const port = 8999;

let app = express();

function checkAuth (req, res, next) {
	if (req.url === '/manage' && (!req.session || !req.session.authenticated)) {
		res.render('unauthorised', { status: 403 });
		return;
	}

	next();
}
app.locals.settings = settings;
app.use(cookieParser())
app.set('trust proxy', 1) // trust first proxy
app.use(session({
  secret: settings.sessionSecret,
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
    let err = new Error('Not Found');
    err.status = 404;
    next(err);
});


let server = app.listen(port, '127.0.0.1');
console.log('Node listening on port %s', port);
