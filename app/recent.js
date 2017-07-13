module.exports = function(app){
  
  var MongoClient = require('mongodb').MongoClient;
  
  app.get("/recent", function (request, response) {
    MongoClient.connect(process.env.MONGO_LOGIN, function (err, db){
      if (err){
        throw err;
        return;
      }
      db.collection("recent_searches", function (err, collection){
        
        if (err){
          throw err;
          return;
        }
        
        collection.find({},{search_term: true, _id: false}).sort({datetime:-1}).limit(50).toArray(function (err, docs){
          if (err){
            throw err;
            return;
          }
          
          console.log(docs);
          
          var res_arr = [];
          
          for (var i in docs){
            res_arr.push(docs[i]["search_term"]);
          }

          response.json({list: res_arr});
        });
      });
    });
  });
}
