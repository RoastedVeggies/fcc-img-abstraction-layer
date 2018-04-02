
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

app.get("/recent", function(req,res){
  mongodb.MongoClient.connect(uri, function(err, db){
       if(err) throw err;
       var myDB = db.db('fcc');
       var searches = myDB.collection('searches');
       searches.find({}).toArray(function(err,data){
        if(err) throw err;
        res.send(data);
       });
      db.close();
    })
})

app.get("/search/:item", (req, res) => {
    var param = req.params.item;
    var date = new Date();
    //add to recent searches in mongodb collection
    mongodb.MongoClient.connect(uri, function(err, db){
       if(err) throw err;
       var myDB = db.db('fcc');
       var searches = myDB.collection('searches');
       searches.insert({"term":param,"when":date});
      db.close();
    })
  //call google cse api with search terms
    var api_call = api_beginning+param; 
    request(api_call, function(error, response, body){
       if(!error && response.statusCode == 200){
          var info = JSON.parse(body).items;
          list = [];
         //console.log(info);
          for(var i=0;i<info.length;i++){
              list.push({"title":info[i].title,"context":info[i].context});
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