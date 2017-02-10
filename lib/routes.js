const util = require('util');
const checkNameServers = require('../module/checkNameServers');
const password = require('../module/password');
const fs = require('fs');
const exec = require('child_process').exec;

module.exports = function (app) {

	app.get('/', function (req, res, next) {
		res.render('index', {
			userName: (req.session && req.session.userName)?req.session.userName:null,
			authenticated: (req.session && req.session.authenticated),
		});
	});

	app.get('/manage', function (req, res, next) {
    const userInfo = req.app.locals.settings.users.find((user) => { return user.hasOwnProperty(req.session.userName)})[req.session.userName];
		res.render('manage', {
			userName: (req.session && req.session.userName)?req.session.userName:null,
			authenticated: (req.session && req.session.authenticated),
      error: [],
      style: 'info',
      domian: userInfo.domain,
      ns1: userInfo.ns1,
      ns2: userInfo.ns2
    });
	});

  app.post('/manage', function (req, res, next) {
		const settings = req.app.locals.settings;
    const userInfo = settings.users.find((user) => { return user.hasOwnProperty(req.session.userName)})[req.session.userName];
    const ipCheck = /^194\.47\.174\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    if (ipCheck.test(req.body.ns1) && ipCheck.test(req.body.ns2) && req.body.ns1 !== req.body.ns2) {
      checkNameServers(userInfo.domain, req.body.ns1, req.body.ns2, function(err, data) {
        if (err) {
          res.render('manage', {
						userName: (req.session && req.session.userName)?req.session.userName:null,
						authenticated: (req.session && req.session.authenticated),
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
        let zoneFileTemplate = fs.readFileSync(settings.zoneFileTemplate, 'utf-8');
        let zoneFile = zoneFileTemplate.replace("$serial",  settings.serial++);
        settings.users.filter(function(user) {
          user = user[Object.keys(user)[0]];
          return ipCheck.test(user.ns1) && ipCheck.test(user.ns2)
        }).forEach(function (user) {
          user = user[Object.keys(user)[0]];
          zoneFile += util.format(settings.recordTemplate,
						user.domain,
						user.domain,
						parseInt(user.ns1.split('.')[3], 10),
						user.domain,
						parseInt(user.ns2.split('.')[3], 10))
        })
        ///etc/bind/zones/db.devopslab.xyz
        fs.writeFileSync(settings.zoneFile, zoneFile, 'utf-8');
        fs.writeFile('./config/settings.json', JSON.stringify(settings, null, 2) , 'utf-8');
        exec('sudo service bind9 restart', (error, stdout, stderr) => {
          if (error) {
            console.error(`exec error: ${error}`);
            return;
          }
          console.log(`stdout: ${stdout}`);
          console.log(`stderr: ${stderr}`);
        });
        res.render('manage', {
					userName: (req.session && req.session.userName)?req.session.userName:null,
					authenticated: (req.session && req.session.authenticated),
          error: [],
					soa: data,
          style: 'success',
          domian: userInfo.domain,
          ns1: req.body.ns1,
          ns2: req.body.ns2
        });
      });
    } else {
      let errorMess = [];
      if(!ipCheck.test(req.body.ns1)){
  			errorMess.push('Nameserver 1: Invalid IP address.');
      }
      if(!ipCheck.test(req.body.ns2)){
  			errorMess.push('Nameserver 2: Invalid IP address.');
      }
      if(req.body.ns1 === req.body.ns2){
        errorMess.push('Nameserver 1 and nameserver 2 must be different.');
      }
      res.render('manage', {
				userName: (req.session && req.session.userName)?req.session.userName:null,
				authenticated: (req.session && req.session.authenticated),
        error: errorMess,
        style: 'danger',
        domian: userInfo.domain,
        ns1: req.body.ns1,
        ns2: req.body.ns2
      });
    }
  });

	app.get('/login', function (req, res, next) {
		if(req.session && req.session.authenticated){
			res.redirect('/manage');
		} else {
			res.render('login', { flash: req.flash() } );
		}
	});

	app.post('/login', function (req, res, next) {
    const settings = req.app.locals.settings;

		if (req.body.username && settings.users.find((user) => { return user.hasOwnProperty(req.body.username)}) &&
      req.body.password && password.validate(settings.users.find((user) => { return user.hasOwnProperty(req.body.username)})[req.body.username].passwordHash, req.body.password)) {
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
