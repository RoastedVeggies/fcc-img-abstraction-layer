
// init project
const express = require('express');
const request = require('request');
var mongodb = require('mongodb');
const app = express();
var api_beginning = 'https://www.googleapis.com/customsearch/v1?key='+process.env.API_KEY+"&cx="+process.env.CSE+"&searchType=image&q=";
var list;
var uri = 'mongodb://'+process.env.USER+':'+process.env.PASS+'@'+process.env.HOST+':'+process.env.DBPORT+'/'+process.env.DB;

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'))

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", (request, response) => {
  response.sendFile(__dirname + '/views/index.html')
})

//lists 10 most recent searches
app.get("/recent", function(req,res){
  mongodb.MongoClient.connect(uri, function(err, db){
       if(err) throw err;
       var myDB = db.db('fcc');
       var searches = myDB.collection('searchLog');
       searches.find({}).toArray(function(err,data){
        if(err) throw err;
        res.send(data);
         db.close();
       });
      
    })
})

//returns json regarding 10 images that match search term
app.get("/search/:item", (req, res) => {
    var param = req.params.item;
    var query = req.query;
    var offset;
    //sets 'start' parameter for pagination if ?offset= is present in url
    if(query.offset!=null){
       offset="&start="+query.offset; 
    };
    var date = new Date();
    //add to recent searches in mongodb collection
    mongodb.MongoClient.connect(uri, function(err, db){
       if(err) throw err;
       var myDB = db.db('fcc');
       var searches = myDB.collection('searchLog');
       searches.insert({"term":param,"when":date});
      db.close();
    })
  //call google cse api with search terms
    var api_call = api_beginning+param+offset; 
    request(api_call, function(error, response, body){
       if(!error && response.statusCode == 200){
          var info = JSON.parse(body).items;
          list = {};
         console.log(info);
          for(var i=0;i<info.length;i++){
              list[i] = {"url":info[i].link, "snippet":info[i].snippet,"context":info[i].image.contextLink};
          }
          res.send(list);
       }
    })
})


// listen for requests :)
const listener = app.listen(process.env.PORT, () => {
  console.log(`Your app is listening on port ${listener.address().port}`)
})

//all thats left to do is cap the collection at 10 and add alttext(aka snippet),and image link to the search response