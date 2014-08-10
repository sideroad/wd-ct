module.exports = function(){
	var express = require('express'),
		app = express();

	app.use(express.static(__dirname + "/../fixture/site")); //use static files in ROOT/public folder
	app.listen(8000, '127.0.0.1');
	return app;
};