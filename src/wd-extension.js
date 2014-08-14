module.exports = function(wd, webdriver, store){

  var fs = require('fs'),
      path = require('path'),
      fireEvents = fs.readFileSync( path.join( __dirname, '/fire-events.js'), 'utf8').toString();

  // adding custom promise chain method
  wd.addPromiseChainMethod(
    'storeEval',
    function(key, source) {
      return this
        .eval(source)
        .then(function(results){
          store[key] = results;
        });
    }
  );
  wd.addPromiseChainMethod(
    'fireEvents',
    function(css, eventName) {
      var that = this;
      return this
        .elementByCss(css)
        .then(function(el){
          return that.execute(fireEvents, [{ELEMENT: el.value}, eventName]);
        });
    }
  );
};