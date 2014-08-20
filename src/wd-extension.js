module.exports = function(wd, webdriver, store, logger){

  var fs = require('fs'),
      path = require('path'),
      Q = require('q'),
      prompt = require('prompt'),
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
  wd.addPromiseChainMethod(
    'break',
    function() {
      var that = this,
          defer = Q.defer();

      prompt.start();
      prompt.get({
        properties: {
          breakpoint: {
            description: 'Input command or press enter to continue.'
          }
        }
      }, function(err, res){
        var text = res.breakpoint.replace(/^\s*(.*)\s*$/,'$1'),
            matched,
            variable;

        if(err) {
          throw err;
        }

        if( !text ) {
          defer.resolve(that);
        } else {
          matched = text.match(/^store(?:\.(.+))?$/);

          if( matched ) {
            variable = matched[1];
            logger( variable ? store[variable] : store );
          } else {
            logger('Invalid command.');
          }
          that.break().then(function(){
            defer.resolve(that);
          });
        }
      });

      return defer.promise;
    }
  );
};