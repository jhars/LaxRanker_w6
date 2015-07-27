var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app     = express();
var _ = require('underscore');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var TeamPoster = require("./models/teamPoster");
var LogPoster = require('.models/logPoster');
var UserPoster = require('./models/userPoster');
var session = require('express-session');

//********************DB Connection****************//
mongoose.connect(
  process.env.MONGOLAB_URI ||
  process.env.MONGOHQ_URL ||
  'mongodb://localhost/laxdb' // plug in the db name you've been using
);
//------------MiddleWare------//
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + '/public'));

app.use(session({
  saveUninitialized: true,
  resave: true,
  secret: 'mySecretCookie',
  //10 minutes
  cookie: { maxAge: 600000 }
}));

//---------MiddleWare, manage SESSIONS-------//
app.use('/', function (req, res, next) {
    req.login = function (user) {
        req.session.userId = user.id;
    };

    //find current user based on SESSION//
    req.currentUser = function (callback) {
        User.findOne({_id: req.session.userId}, function (err, user){
            req.user = user;
            callback(null, user);
        });
    };

    req.logout = function () {
        req.session.userId = null;
        req.user = null;
    };
    next();
});

//-----------------ROOT(homepage) Route-------------//
app.get('/', function (req, res){
  var index = __dirname + "/public/views/index.html";
  res.sendFile(index);
});

app.get('/registration', function (req, res){
  var register = __dirname + "/public/views/register.html";
  res.sendFile(register);
});

//-------Log(MyTeams) Route--------//
app.get('/myleague', function (req,res){
    req.currentUser(function (err, user) {
        if(user) {
            res.sendFile(__dirname + 'public/views/myleague.html');
        } else {
            res.redirect('/registration');
        }
    });
});

// AUTH ROUTES (SIGN UP, LOG IN, LOG OUT)

//-----CREATE NEW USER-------//
app.post('/api/users', function (req,res){
    var newUser = req.body.user;
    User.createSecure(newUser, function (err, user){
        req.login(user);
        res.redirect('/myleague');
    });
});

//-----Authenticate user, Set Session------//
app.post('/login', function (req, res){
    var userData = req.body.user;
    User.authenticate(userData.email, userData.password, function (err, user){
        req.login(user);
        res.redirect('/myleague');
    });
});

//-----Logout User, destory Session----//
app.get('/logout', function (req,res){
    req.logout();
    res.redirect('/');
});

//------USER API ROUTES-------//

//-----show current user------//
app.get('/api/users/current', function (req, res) {
    req.currentUser(function (err, user){
        res.json(user);
    });
});

//--Create New LOG(myTeam), 4 current User---//
app.post('/api/users/current/myleague', function (req, res){
    var newLog = new Log ({
        laxteam: req.body.laxteam
    });
    //saves new 'laxteam' to Log (myLeague)
    newLog.save();

    req.currentUser(function (err, user){
        user.logs.push(newLog);
        //save user & newLog (laxteam, myLeague)
        user.save();
        res.json(newLog);
    });
});

//-Show All Logs (all 'laxteam' in 'myLeague')--//
app.get('/api/myleagues', function (req,res){
    Log.find(function (err, logs){
        res.json(logs);
    });
});

//-Create New Log ('laxteam' in 'myLeague')-//
app.post('/api/myleagues', function (req, res){
    var newLog = new Log({
        laxteam: req.body.laxteam
    });

    newLog.save(function (err, savedLog){
        res.json(savedLog);
    });
});













//******DO NOT TOUCH (for now)*****//

//[[[[DATA/API Objects]]]]//
var allTeams  =[];//////////
var allURL = [];////////////
//[[[[DATA/API Objects]]]]//


//--Show ALL NATONAL-ROUTE (API)----------------//
app.get('/national', function (req, res){
    //FIX REFRESH ISSUE---------//
    var national = __dirname + "/public/views/national.html";
    res.sendFile(national);
});

//====shows all Teams from Data-Pop---//
app.get('/api/teams', function (req, res){
  TeamPoster.find(function (err, foundTeams){
    res.json(foundTeams);
  });
});
//=============================START GET CALL======================//
                    //[[[[[[[[[[[[[BUTTON]]]]]]]]]]]]]//
app.get('/api/datapop', function (req, res){
   url = 'http://www.laxpower.com/update15/binboy/natlccr.php';
   
    request(url, function(error, response, html){
//==========BEG. OF 'IF STATEMENT'=====================//
        if(!error){
            var $ = cheerio.load(html);
            var teams, teamName, natRank, rating, teamLinks;//record
            var natTeams = { teams : ""};
$('#content_well > div.cs1 > left > dt > dl > div.cs1 > pre > a').filter(function(){
        var data = $(this);
        linker = data.attr(); //{href: "XHASPA.PHP"}
        allURL.push(linker.href);
    })
//*********************JQUERY**********************//
            $('#content_well > div.cs1 > left > dt > dl > div.cs1 > pre').map(function(){                 
                var data = $(this);
                links = data.attr('a');
                teams = data.text().split("\n");
                natTeams.teams = teams;

//-------------------SLICER----------------------//  
                for(i=7;i<teams.length;i++){
                teamFile = teams[i];
                var rankSplitter = teamFile.split('');
                
                var oneTeam = { 
                teamName : "",
                state : "",
                natRank : "",
                record : "",
                powerRating : "",
                teamURL : ""}

                natRank =   rankSplitter[1]+rankSplitter[2]+
                            rankSplitter[3]+rankSplitter[4];

                teamName =  rankSplitter[6]+rankSplitter[7]
                            +rankSplitter[8]+rankSplitter[9]
                            +rankSplitter[10]+rankSplitter[11]
                            +rankSplitter[12]+rankSplitter[13]
                            +rankSplitter[14]+rankSplitter[15]
                            +rankSplitter[16]+rankSplitter[17]
                            +rankSplitter[18]+rankSplitter[19]
                            +rankSplitter[20]+rankSplitter[21]
                            +rankSplitter[22]+rankSplitter[23]
                            +rankSplitter[24]+rankSplitter[25];

                state =     rankSplitter[32]+rankSplitter[33];

                record =    rankSplitter[36]+rankSplitter[37]
                            +rankSplitter[38]+rankSplitter[39]
                            +rankSplitter[40]+rankSplitter[41]
                            +rankSplitter[42]+rankSplitter[43]
                            +rankSplitter[44]+rankSplitter[45];

                powerRating=rankSplitter[64]+rankSplitter[65]
                            +rankSplitter[66]+rankSplitter[67]
                            +rankSplitter[67];            


                oneTeam.natRank = natRank;            
                oneTeam.teamName = teamName;
                oneTeam.state = state;
                oneTeam.record = record;
                oneTeam.powerRating = powerRating;
                oneTeam.teamURL = allURL[i-5];

                console.log(allURL[i-5]);

                allTeams.push(oneTeam);

                var newTeam = new TeamPoster(oneTeam);
                newTeam.save();

                }//end of FOR LOOP-----------SLICER(end)----------------->>
            }//___________________________.map(function)
            )//___________________________***jQuery(end)
            res.json(allTeams);

            var haverford = allTeams[0];
            console.log(haverford);
        //=============END OF POST CALL ==================//
        }//=======END OF 'IF STATEMENT'=====================//
    });//_________End of REQUEST________________________
});//==============END OF GET CALL==============//

//-----------------------!TO-DO!---------------------//
// Dummy data
// Seed into mongoose (shcema) -- lives here, in server.js

















app.listen(process.env.PORT || 3000)
console.log('Magic happens on port 3000');
exports = module.exports = app;
