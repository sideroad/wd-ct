module.exports = function(wd, webdriver, store){

  var fs = require('fs'),
      path = require('path'),
      fireEvents = fs.readFileSync( path.join( __dirname, '/fire-events.js'), 'utf8').toString();

  // monkey patching
  webdriver.prototype.hasNoElement = function(using, value, cb){
    this.elements.apply( this, [using, value, function(err, elements){
      if(!err) {
        cb(err); 
      } else {
        cb(null, elements.length > 0 );
      }
    }]);
  };

  webdriver.prototype.waitForNoElement = function(using, value, timeout, cb){
    var _this = this;
    var endTime = Date.now() + timeout;

    var poll = function(){
      _this.hasElement(using, value, function(err, isHere){
        if(err){
          return cb(err);
        }

        if(isHere){
          if(Date.now() > endTime){
            cb(new Error("Element didn't disappear"));
          } else {
            setTimeout(poll, 200);
          }
        } else {
          cb(null);
        }
      });
    };

    poll();
  };
  webdriver.prototype.waitForNotVisible = function(using, value, timeout, cb) {
    var _this = this;
    var endTime = Date.now() + timeout;

    var poll = function(){
      _this.isDisplayed(using, value, function(err, visible) {
        if (err) {
          return cb(err);
        }

        if (visible) {
          if (Date.now() > endTime) {
            cb(new Error("Element didn't become visible"));
          } else {
            setTimeout(poll, 200);
          }
        } else {
          cb(null);
        }
      });
    };
    poll();
  };

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