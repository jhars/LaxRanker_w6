var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

// mongoose.connect("mongodb://localhost/laxdb");

var TeamPosterSchema = new Schema({

				teamName:     String,
                state:        String,
                natRank:      String,
                record:       String,
                powerRating:  String,
                teamURL:      String

});

var TeamPoster = mongoose.model('TeamPoster', TeamPosterSchema);

module.exports = TeamPoster;