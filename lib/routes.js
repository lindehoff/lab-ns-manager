var util = require('util');
const checkNameServers = require('../module/checkNameServers');
const password = require('../module/password');
const fs = require('fs');
const exec = require('child_process').exec;

module.exports = function (app) {

	app.get('/', function (req, res, next) {
    console.log(req.app.locals.users)
		res.render('index');
	});

	app.get('/manage', function (req, res, next) {
    userInfo = req.app.locals.users.find((user) => { return user.hasOwnProperty(req.session.userName)})[req.session.userName];
		res.render('manage', {
      error: [],
      style: 'info',
      domian: userInfo.domain,
      ns1: userInfo.ns1,
      ns2: userInfo.ns2
    });
	});
  app.post('/manage', function (req, res, next) {
    userInfo = req.app.locals.users.find((user) => { return user.hasOwnProperty(req.session.userName)})[req.session.userName];
    // you might like to do a database look-up or something more scalable here
    ipCheck = /^194\.47\.174\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    if (ipCheck.test(req.body.ns1) && ipCheck.test(req.body.ns2)) {
      checkNameServers(userInfo.domain, req.body.ns1, req.body.ns2, function(err, data) {
        if (err) {
          res.render('manage', {
            error: [util.format('<h4 style="color: red;">Your Nameservers are not correctly configured:</h4><pre>%s</pre', err)],
            style: 'danger',
            domian: userInfo.domain,
            ns1: req.body.ns1,
            ns2: req.body.ns2
          });
          return;
        }

        userInfo.ns1 = req.body.ns1;
        userInfo.ns2 = req.body.ns2;
        config = req.app.locals.users.find((user) => { return user.hasOwnProperty('serial')});

        var data = fs.readFileSync('./db.devopslab.xyz', 'utf-8');
        var newValue = data.replace("$serial", config['serial']++);
        req.app.locals.users.filter(function(user) {
          user = user[Object.keys(user)[0]];
          return ipCheck.test(user.ns1) && ipCheck.test(user.ns2)
        }).forEach(function (user) {
          user = user[Object.keys(user)[0]];
          newValue += util.format('\n;%s \n%s.    IN    NS    labcloudftk%d.lnu.se.\n' +
            '%s.    IN    NS    labcloudftk%d.lnu.se.\n', user.domain, user.domain, user.ns1.split('.')[3], user.domain, user.ns2.split('.')[3])
        })
        ///etc/bind/zones/db.devopslab.xyz
        fs.writeFileSync('./db.devopslab.xyz2', newValue, 'utf-8');
        fs.writeFile('./users.json', JSON.stringify(req.app.locals.users, null, 2) , 'utf-8');
        exec('sudo service bind9 restart', (error, stdout, stderr) => {
          if (error) {
            console.error(`exec error: ${error}`);
            return;
          }
          console.log(`stdout: ${stdout}`);
          console.log(`stderr: ${stderr}`);
        });
        res.render('manage', {
          error: [],
          style: 'success',
          domian: userInfo.domain,
          ns1: req.body.ns1,
          ns2: req.body.ns2
        });
      });
    } else {
      let errorMess = [];
      if(!ipCheck.test(req.body.ns1)){
  			errorMess.push('Name server 1: Invalid IP address');
      }
      if(!ipCheck.test(req.body.ns2)){
  			errorMess.push('Name server 2: Invalid IP address');
      }
      res.render('manage', {
        error: errorMess,
        style: 'danger',
        domian: userInfo.domain,
        ns1: req.body.ns1,
        ns2: req.body.ns2
      });
    }
  });

	app.get('/login', function (req, res, next) {
		res.render('login', { flash: req.flash() } );
	});

	app.post('/login', function (req, res, next) {

		// you might like to do a database look-up or something more scalable here
		if (req.body.username && req.app.locals.users.find((user) => { return user.hasOwnProperty(req.body.username)}) &&
      req.body.password && password.validate(req.app.locals.users.find((user) => { return user.hasOwnProperty(req.body.username)})[req.body.username].passwordHash, req.body.password)) {
			req.session.authenticated = true;
      req.session.userName = req.body.username;
			res.redirect('/manage');
		} else {
			req.flash('error', 'Username or password are incorrect');
			res.redirect('/login');
		}

	});

	app.get('/logout', function (req, res, next) {
		delete req.session.authenticated;
  		delete req.session.userName;
		res.redirect('/');
	});

};
