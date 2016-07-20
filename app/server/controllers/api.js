/** home page route **/
var fs = require('fs')
,	dust = require('dustjs-linkedin')
,	async = require('async')
, passport = require('passport')
,	_ = require('lodash')
,	hs = require('../../plugins/hash')
,	signup = require('../../plugins/signup')
, em = require('../../plugins/email')
, crypto = require('crypto')
,	Person = app.get('models').Person
,	Profile = app.get('models').Profile
, Question = app.get('models').Question
, Pictures = app.get('models').Pictures
, Topic = app.get('models').Topic
, Answers = app.get('models').Answers;



exports.signupPost = function(req, res, next){ 
	console.log("signing up")
	var data = { email: req.body.email.toLowerCase() };
			Person.findOne({ where: data })
			.then(function(p) {
				if(p){
					return res.json({"error": "400", "message": "email taken"});	
				} 
			})
			.catch(function(error) {
				return res.json({"error": "400", "message": "register error"})	
			});
	signup.createPerson({
				name_first: req.body.name_first,
			    name_last: req.body.name_last,
			    email: req.body.email.toLowerCase(),
			    password: req.body.password
			},
			function(e,p){
				if(e){
					return res.json({"error": "400", "message": e});
				} 
				if(!p){
					return res.json({"error": "400", "message": "failed to add user"})
				} 
				
				//req.flash('success', app.get("messages").signup.success.done);
				//return res.redirect('/success');	
				return res.json(p)
			}) 

}

exports.signup = function(req, res, next){
	res.render('signup', 
  		{ title : 'Sign Up' })
}

exports.signinPost = function(req, res, next) { 

	passport.authenticate('local', function(err, user, info) {
		if (err) { 
			return next(err) 
		}
		if (!user) {
			if(typeof user.attempt !== 'undefined' && user.attempt){
				Person.incrementFailedLogin({email: info.username},function(err,p){ 
				    if(err){
				      //log system error
				    }
					return res.json({"error": "400", "message": "failed login"});	
				})
			} else {
				return res.json({"error": "400", "message": "failed login"});	

			}
		} else {
			req.login(user, function(err) {
			  if (err) { return next(err); }

			  Person.incrementLogin(user.id, {
			  	last_sign_in_at: Date.now(),
			  	current_sign_in_at: Date.now(),
					current_sign_in_ip: req.ip 
			  }, function(err,ui){
			    if(err){
			      //log system error
			    }
			    return res.json(ui);
			  })
			});
		}
	})(req, res, next);
}

exports.signin = function(req, res, next){
	if (req.user) {
	  	return res.redirect('/home');
	} 
	var signin_attempt = req.query['username'] || "";
	res.render('signin', 
  	{ title: 'Sign In', username_attempt: signin_attempt })
}

exports.signout = function(req, res) {
  req.logout();
  delete req.session.returnTo;
 
  res.redirect('/');
}

exports.retrievePost = function(req, res, next){
	var reset_token = req.body.challenge;

	req.checkBody('password', app.get("messages").signup.error.password_characters).notEmpty().isAscii().isLength(6, 64);
	req.checkBody('password_repeat', app.get("messages").signup.error.password_match).equals(req.body.password);

	var errors = req.validationErrors();

	if (errors) {
		req.flash('errors', errors);
		return res.redirect('back');
	}

  	async.waterfall([
    	function(callback) {
    		Person.findOne({where: {reset_password_token: reset_token, reset_password_expires_at: {$gt: new Date() } }})
				.then(function(p) {
					
					if (!p) {
				        req.flash('error', app.get("messages").forgot.error.invalid_token);
				        return res.redirect('back');
				    }

					hs.saltAndHash(req.body.password, function(err,hash,salt){
						if(err){
							req.flash('error', app.get("messages").error.system);
							return res.redirect('back');
						}

						Person.updateOne(p.id,{ 
								password: hash, 
								salt: salt, 
								password_changed_at: Date.now(),
								reset_password_token: null,
								reset_password_expires_at: null
							}, function(e,p){
							if(!p){
								callback(app.get("messages").error.system);
							} 
							if(e){
								callback(app.get("messages").error.system);
							}
							callback(null);
						})
					})
				})
    	}
  	], function(err) {
	    if (err) {
	    	req.flash('error', app.get("messages").error.system);
			return res.redirect('back');
		};
		req.flash('success', app.get("messages").forgot.success.password_updated);
		return res.redirect('/signin');
	});
}

exports.retrieve = function(req, res, next){
	var reset_token = req.query.challenge;
	Person.findOne({where: {reset_password_token: reset_token, reset_password_expires_at: {$gt: new Date() } }})
		.then(function(p) {
			if (!p) {
        req.flash('error', app.get("messages").forgot.error.invalid_token);
        return res.redirect('/forgot');
      }
      res.render('retrieve',{ title : 'Retrieve Password', key: reset_token });
		})
		.catch(function(e) {
			req.flash('error', app.get("messages").error.system);
			res.redirect('/forgot');
		})
}

exports.forgotPost = function(req, res, next){
  
  req.checkBody('email', app.get("messages").signup.error.email).isEmail();

  var error = req.validationErrors();
	if (error) {
		req.flash('error', app.get("messages").signup.error.email);
		return res.redirect('/forgot');
	} 

  async.waterfall([
    function(callback) {
      crypto.randomBytes(16, function(err, buf) {
        var token = buf.toString('hex');
        callback(err, token);
      });
    },
    function(token, callback) {
      Person.findOne({where:{ email: req.body.email.toLowerCase() }}).then(function(p) {
        if (!p) {
          req.flash('error', app.get("messages").forgot.error.email);
          return res.redirect('/forgot');
        }
      	p.update({
				  reset_password_token: token,
				  reset_password_expires_at: Date.now() + 3600000
				})
				.then(function() {
				  callback(null, token, p);
				}).catch(function(err) {
				  callback(err);
				})

      });
    },
    function(token, p, callback) {
    	var link = '<a href="'+app.get('uhttp')+'retrieve?challenge='+token+'">'+app.get('uhttp')+'retrieve?challenge='+token+'</a>';
			
      var subject = app.get("messages").forgot.email_subject;
			var body = "To retrieve your "+app.locals.site+" account password follow link below:<br/><br/>";
			body += link;
			body += "<br><br>"+app.locals.site+" Team";

			var email = { 
				subject: subject,
				to: p.email,
				body: body
			}
		em.sendemail(email, function(e,info){
			if(e){
				callback(e);
			} else {
				callback(null,p);
			}
		})
    }
  ], function(err,p) {
    if (err) {
    	req.flash('error', app.get("messages").forgot.error.email);
			return res.redirect('/forgot');
    }

    req.flash('success', app.get("messages").forgot.success.password_instructions_sent);
		res.redirect('/success?type=forgot');
  });

}

exports.forgot = function(req, res, next){
	res.render('forgot',
	{ title : 'Forgot Password' })
}

exports.activate = function(req, res, next){

	var activation_token = req.params.id;

	async.waterfall([
		function(callback){
			Person.activateToken(activation_token, function(e,p){
				if(e){
					console.log(e);
					callback(app.get("messages").error.system);
				} else {
					if(!p){
						callback(app.get("messages").activate.error.not_found);
					} else {
						callback(null,p);
					}
				}
			})
		},
	    function(p,callback){
	    	var ac = hs.validateActivationCode(p.confirmation_token,p.email);
				if(!ac){
					callback(app.get("messages").activate.error.code);
				} else {
					Person.updateOne(p.id, { 
						confirmed_at: Date.now(),
						confirmation_token: null,
						unconfirmed_email: null,
						status: 'a'
					}, function(e,p){				
						if(e){
							callback('Error with activation');
						} else {
							Profile.createOne(p.id, function(e,p){
								if(e){
									callback(app.get("messages").activate.error.general);
								} else {
									if(!p){
										callback(app.get("messages").activate.error.general);
									} else {
										callback(null,p);	
									}
								}
							})
						}
					})			
				}
		  	}
		],
	function(err, p) {
		if(err) { 
			req.flash('error', err);
			return res.redirect('/signup');
		}
		req.flash('success', app.get("messages").activate.success.done );
		res.redirect('/signin');
	});
}

exports.success = function(req, res, next){
	res.render('success',
	  { title : 'Success' }	)
}
