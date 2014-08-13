module.exports = function(){
	var express = require('express'),
		http = require('http'),
		app = express(),
		server = http.createServer(app).listen(8000);

	app.use(express.static(__dirname + "/../fixture/site")); //use static files in ROOT/public folder
	return server;
};