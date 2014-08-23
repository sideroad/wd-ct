module.exports = function(){
    var express = require('express'),
      http = require('http'),
      app = express(),
      server;

  server = http.createServer(app).listen(8000);
  server.on('error', function(err){
    if(err.code !== 'EADDRINUSE') {
      throw err;
    }
  });
  app.use(express.static(__dirname + "/../fixture/site")); //use static files in ROOT/public folder
	return server;
};