module.exports = function(callback){
  var express = require('express'),
      app = express(),
      server,
      port = 8000;

  server = app.listen(port,function(){
    callback(server);
  });
  
  app.use(express.static(__dirname + "/../fixture/site")); //use static files in ROOT/public folder
};