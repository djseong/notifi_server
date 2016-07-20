
var multer = require('multer')({ dest: 'tmp/' })
,	home = require('./home')
,	info = require('./info')
,	account = require('./account')
,	errors = require('./error')
,	authorize = require('../../plugins/authorize')
,	h = require('../../plugins/helper')
,	api = require('./api')

// routes

module.exports = function(app) {
	
	/* All routes */
	app.all('*', authorize.role);

	app.post('/signup', api.signupPost);
	app.get('/signup', api.signup);
	app.post('/signin', api.signinPost);
	app.get('/signin', api.signin);


	/* home page routes */
	app.get('/', home.index);
	app.get('/home', authorize.user, home.home);
	app.get('/people',authorize.asset);
		

	/* Handle 404 */
	app.use(errors.error404);
	app.use(errors.error500);
}
