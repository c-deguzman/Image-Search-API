module.exports = function(app){
  
  var api_request = require("request");

  var pixabay_key = process.env.PIXABAY_KEY;

  function parseImage(image_json){
    return ({
      "image_url": image_json["previewURL"],
      "page_url": image_json["pageURL"],
      "alt_text": image_json["tags"]
    });
  }
  
  var MongoClient = require('mongodb').MongoClient;
  
  app.get("/search", function (request, response) {
    
    if (!request.query.search_term){
      response.json({error: "no search term entered"});
      return;
    }
    
    
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
        
        collection.insert({search_term: request.query.search_term,
                           datetime: Date.now()});
        
      });
    });
                    
    
  
    var api_url = "https://pixabay.com/api/?image_type=photo&key=" + pixabay_key + "&q=" + request.query.search_term;

    var ind_offset = 0;

    if (request.query.offset){
      parseInt(ind_offset = Math.max(0,request.query.offset), 10);
    }

    var page_num = parseInt(ind_offset / 10, 10) + 1;

    api_request(api_url + "&per_page=3", function(error, r, b){

      var total_res = parseInt(JSON.parse(b)["totalHits"], 10);

      if (total_res <= 0){
        response.json({error: "no results"});
        return;
      }

      if (total_res - ind_offset > 10){
        api_request(api_url + "&per_page=10&page=" + page_num, function (error, res, body){
          if (error){
            throw error;
            return;
          }

          api_request(api_url + "&per_page=10&page=" + (page_num + 1), function (error, res2, body2){
            if (error){
              throw error;
            }

            var results_arr = [];

            var json_body = JSON.parse(body);
            var json_body2 = JSON.parse(body2);

            for (var ii = 0; ii != 10; ii += 1){
              var local_ind = ind_offset + ii  - page_num * 10  + 10;

              if (local_ind < 10){
                results_arr.push(parseImage(json_body["hits"][local_ind]));
              } else {
                results_arr.push(parseImage(json_body2["hits"][local_ind - 10]));
              }
            }

            response.json({
              total_hits: json_body["totalHits"],
              hits: results_arr
            });

          });
        });
      } else if (total_res - ind_offset > 0 && total_res - ind_offset < 10){
        api_request(api_url + "&per_page=10&page=" + page_num, function (error, res, body){
          if (error){
            throw error;
            return;
          }

          var results_arr = [];

          var json_body = JSON.parse(body);

          for (var iii = 10 - (total_res - ind_offset); iii != 10; iii += 1){
            results_arr.push(parseImage(json_body["hits"][iii]));
          }

          response.json({
              total_hits: json_body["totalHits"],
              hits: results_arr
            });

        });
      } else {

        response.json({error: "out of range"});

      }
    });
  });
}