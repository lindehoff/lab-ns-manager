const express = require('express');
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const session = require('express-session')
const flash = require('connect-flash');
const settings = require('./config/settings');


let app = express();

function checkAuth (req, res, next) {
	let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
	if (req.url === '/manage' && (!req.session || !req.session.authenticated)) {
		res.render('unauthorised', { status: 403 });
		console.log("[%s] Unauthorised", ip)
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

let server = app.listen(settings.serverPort, settings.serverIP);
console.log('Node listening on http://%s:%s',  settings.serverIP,  settings.serverPort);
