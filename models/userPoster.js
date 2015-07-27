var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    bcrypt = require('bcrypt'),
    salt = bcrypt.genSaltSync(10),
    Log = require('./logPoster');


var UserSchema = new Schema ({
	  email: String,
	  passwordDigest: String,
	  logs: [Log.schema]
	});

UserSchema.statics.createSecure = function (userData, callback) {
	var that = this;

	bcrypy.genSalt(function (err, salt) {
		bcrypt.hash(userData.password, salt, function (err, hash) {
			console.log(hash);

			that.create({
				email: userData.email,
				passwordDigest: hash
			}, callback);
		});
	});
};

UserSchema.statics.authenticate = function (email, password, callback) {
	this.findOne({email: email}, function (err, user){
		console.log(user);

		if (user === null){
			//CHECK BRAUS POST for HEROKU here
			throw new Error('Can\'t find user with email ' + email);
		} else if (user.checkPassword(password)) {
			callback(null, user);
		}
	});
};

UserSchema.methods.checkPassword = function (password){
	return bcrypt.compareSync(password, this.passwordDigest);
};


var User = mongoose.model('User', UserSchema);
module.exports = User;















