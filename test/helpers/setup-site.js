module.exports = function(){
    var express = require('express'),
      http = require('http'),
      app = express(),
      server,
      port = 8000;

  server = http.createServer(app).listen(port);
  server.on('error', function(err){
    if(err.code !== 'EADDRINUSE') {
      throw err;
    }
  });
  
  app.use(express.static(__dirname + "/../fixture/site")); //use static files in ROOT/public folder
	return server;
};