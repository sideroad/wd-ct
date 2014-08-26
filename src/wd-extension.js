module.exports = {
  adapt: function(wd, store, logger){
    var fs = require('fs'),
        path = require('path'),
        Q = require('q'),
        prompt = require('prompt'),
        fire = fs.readFileSync( path.join( __dirname, '/fire.js'), 'utf8').toString();

    prompt.message = '';
    prompt.delimiter = '';

    // adding custom promise chain method
    wd.addElementPromiseChainMethod(
      'fire',
      function(eventName) {
        var that = this;
        return this.browser.execute(fire, [{ELEMENT: this.value}, eventName])
                   .then(function(){
                    return that;
                   });
      }
    );
      // adding custom promise chain method
    wd.addElementPromiseChainMethod(
      'naturalType',
      function(val) {
        return this.fire('focus')
                   .clear()
                   .type(val)
                   .fire('change')
                   .fire('blur');
      }
    );
    wd.addPromiseChainMethod(
      'break',
      function() {
        var that = this,
            defer = Q.defer();

        logger('Input command or press enter to continue.');
        prompt.start();
        prompt.get({
          properties: {
            breakpoint: {
              description: '>'
            }
          },
        }, function(err, res){
          var text = res.breakpoint.replace(/^\s*(.*)\s*$/,'$1'),
              matched,
              variable;

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
  }
};