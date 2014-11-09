module.exports = {
  adapt: function(wd, store, logger){
    var fs = require('fs'),
        _ = require('lodash'),
        path = require('path'),
        Q = require('q'),
        prompt = require('prompt'),
        fire = fs.readFileSync( path.join( __dirname, 'browser/fire.js'), 'utf8').toString(),
        select = fs.readFileSync( path.join( __dirname, 'browser/select.js'), 'utf8').toString();

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
        var that = this;
        
        return this.fire('click')
                   .fire('focus')
                   .execute('arguments[0].value=arguments[1]', [{ELEMENT: this.value}, val])
                   .then(function(){
                    return that;
                   })
                   .fire('change')
                   .fire('blur');
      }
    );
    // adding custom promise chain method
    wd.addElementPromiseChainMethod(
      'select',
      function(text) {
        var that = this;
        return this.fire('focus')
                   .execute(select, [{ELEMENT: this.value}, text])
                   .then(function(){
                    return that;
                   })
                   .fire('change')
                   .fire('blur');
      }
    );

    // patch for consecutive get process
    var _get = wd.PromiseChainWebdriver.prototype.get;
    wd.addPromiseChainMethod(
      'get',
      function(url) {
        var token = 'wd_'+(+new Date())+'_'+(''+Math.random()).replace('.',''),
            that = this;

        return this.eval('window.'+token+'=true;')
                   .then(function(){
                     return _get.apply(that, [url]);
                   })
                   .waitForConditionInBrowser('!window.'+token, 10000, 1000);
      }
    );

    wd.addPromiseChainMethod(
      'getBrowserErrors',
      function() {

        return this.log('browser')
                   .then(function(logs){

                     return _.chain(logs)
                             .where({
                               level: 'SEVERE'
                             })
                             .pluck('message')
                             .value();
                   });
      }
    );

    wd.addPromiseChainMethod(
      'waitForNoElement',
      function(selector){
        return this.waitForConditionInBrowser('!document.querySelectorAll('+selector+').length ? true : false', 10000, 1000);
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