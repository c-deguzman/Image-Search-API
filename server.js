var express = require('express');
var app = express();

var search = require('./app/search.js');
var recent_res = require("./app/recent.js");

search(app);
recent_res(app);

app.use(express.static('public'));

app.get("/", function (request, response) {
  response.sendFile(__dirname + '/views/index.html');
});


// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
