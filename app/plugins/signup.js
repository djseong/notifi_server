var hs = require('./hash') 	
,		em = require('./email')
,   async = require('async')
,   _ = require('lodash')
,		Person = app.get('models').Person;

module.exports = {
  createPerson: function(data,callback) {
		async.waterfall([
			function(callback){
				Person.findOne({ where: {email: data.email} })
					.then(function(p) {
					    if (p) {
					      callback('Account with that email address already exists');
					    } else {
					      callback(null);
					    }
					}).catch(function(e){
						callback(e);
					})
			},
	    function(callback){
	    	//hash passwords and create data record
	    	hs.saltAndHash(data.password, function(err,hash,salt){
					if(err){
						callback(err);
					}
					data.password = hash;
					data.salt = salt;
					data.status = 'r';
		  			data.role = 'user';
					callback(null,data);
				});
	    },
	    function(data,callback){
	    	//create user and store in db
        	Person.createOne(data, function(e,p){
						if(e){
							callback(app.get('messages').signup.error.signup);
						} else {
							if(!p){
								callback(app.get('messages').signup.error.signup);
							} else {
								callback(null,p);
							}
						}
					})
	    }
		],
		function(err, p) {
		   if(err) callback(err);
		   callback(null,p);
		});
	}
}
