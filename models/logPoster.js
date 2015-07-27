var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

//My Teams
var LogSchema = new Schema ({
	laxteam: String
});

var Log = mongoose.model('Log', LogSchema);
module.exports = Log;