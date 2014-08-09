/*
 * wd-ct
 * https://github.com/sideroad/wd-ct
 *
 * Copyright (c) 2014 sideroad
 * Licensed under the MIT license.
 */

'use strict';

  var async = require('async'),
      spawn = require('simple-spawn').spawn,
      path = require('path'),
      fs = require('fs'),
      _ = require('lodash'),
      wd = require('wd'),
      chai = require("chai"),
      chaiAsPromised = require("chai-as-promised"),
      csv = require("fast-csv"),
      spawn = require("simple-spawn").spawn,
      webdriver = require('wd/lib/webdriver'),
      seleniumjar = __dirname+'/../vendor/selenium-server-standalone-2.42.2.jar',
      fireEvents = fs.readFileSync( path.join( __dirname, '/fire-events.js'), 'utf8').toString(),
      browser,
      store = {},
      getDriverOptions = function(){
        var args = [],
            base = path.join( __dirname,'/../vendor/' );

        //webdriver.ie.driver
        args.push( process.platform !== 'win32' ? '' : 
                      process.config.variables.host_arch === 'x64' ? '-Dwebdriver.ie.driver='+ base + path.sep + 'IEDriverServer.x64.exe' :
                                                                     '-Dwebdriver.ie.driver='+ base + path.sep + 'IEDriverServer.x86.exe' );

        //weddriver.chrome.driver
        args.push( process.platform === 'darwin' ? '-Dwebdriver.chrome.driver='+ base + path.sep + 'mac.chromedriver' :
                      process.platform === 'win32'  ? '-Dwebdriver.chrome.driver='+ base + path.sep + 'chromedriver.exe' :
                      process.platform === 'linux'  && (process.config.variables.host_arch === 'x64') ? '-Dwebdriver.chrome.driver='+ base + path.sep + 'linux64.chromedriver' :
                      process.platform === 'linux'  && (process.config.variables.host_arch === 'x32') ? '-Dwebdriver.chrome.driver='+ base + path.sep + 'linux32.chromedriver' : '');
        return ' '+args.join(' ');
      };

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
      _this.isVisible(using, value, function(err, visible) {
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
          console.log(el);
          return that.execute(fireEvents, el, eventName);
        });
    }
  );

  var WdCT = function(options){
    var child,
        debug,
        error,
        testcase,
        interaction;

    options = _.extend({
      browsers: ['firefox'],
      testcase: 'testcase.csv',
      interaction: 'interaction.csv',
      color: true,
      debug: true,
      error: true,
      proxy: undefined
    }, options);

    testcase = options.testcase;
    interaction = options.interaction;
    debug = options.debug ? function(){
      console.log.apply(console.log, arguments);
    } : function(){};
    error = options.error ? function(){
      console.error.apply(console.error, arguments);
    } : function(){};


    //Apply colors to console.log
    var colors = require('colors');
    if(!options.color){

      // Geld colors
      _.map( colors, function(val, key){
        if( typeof val === 'function' ){
          String.prototype.__defineGetter__(key, function(){
            return this;
          });
        }
      });
    }

    debug('Setup Selenium Server...'.grey);
    child = spawn('java -jar ' + seleniumjar + getDriverOptions());

    child.stderr.on('data', function(data){
      data = typeof data === "string" ? data : ''+data;
      debug(data.replace(/\n$/,'').grey);
    });

    child.stdout.on('data', function(data){
      data = typeof data === "string" ? data : ''+data;
      debug(data.replace(/\n$/,'').grey);
      if( !data.match('Started org.openqa.jetty.jetty.Server') ) {
        return;
      }

      async.mapSeries( options.browsers, function(browserName, callback){
        var promise,
            order = [],
            assert = [],
            commands;

        debug(('Setup browser ['+browserName+']').grey);
        chai.use(chaiAsPromised);
        chai.should();
        chaiAsPromised.transferPromiseness = wd.transferPromiseness;

        browser = wd.promiseChainRemote();
        // optional extra logging
        browser.on('status', function(info) {
          debug(info.cyan);
        });
        browser.on('command', function(eventType, command, response) {
          debug(' > ', command.green, (response || '').magenta);
        });
        browser.on('http', function(meth, path, data) {
          debug(' > ', path.yellow, (data || '').magenta);
        });

        promise = browser.init({
          browserName: browserName,
          name: 'This is an example test',
          proxy: options.proxy
        });

        debug(('  Running testcase['+testcase+']').grey);

        async.waterfall([
          function registerInteraction(callback){
            commands = require(process.cwd()+'/'+interaction)();
            callback();
          },
          function getOrderTestCase(callback){
            csv
              .fromPath(testcase)
              .on("record", function(data, row){
                var command = data.pop();
                if(row === 0){
                  order = data;
                } else {
                  assert[row] = command;
                }
              })
              .on("end", function(){
                callback();
              });
          },
          function queuingTestCase(callback){
            csv
              .fromPath(testcase)
              .on("record", function(data, row){

                // Column row should be ignore
                if(row === 0){
                  return;
                }

                order.forEach(function(key, index){
                  var val = data[index],
                      command = (index+1 === order.length) ? commands.assertion[assert[row]] :
                                                             commands.input[key];

                  promise = (function(command, val){
                    return promise.then(function(){
                      return command(browser, val, store);
                    }, function(e){
                      throw new Error(e);
                    });
                  })(command, val);
                });
              })
              .on("end", function(){
                  callback();
              });
          }
        ], function(){
          promise.then(function(){
            debug(('Teardown browser ['+browserName+']').grey);
            return browser.quit();
          },function(e){
            error(e.red);
            debug(('Teardown browser ['+browserName+']').grey);
            return browser.quit();
          }).fin(function(){
            callback(null);
          }).done();
        });
    }, function(){
      child.kill();
    });
  });
};

module.exports =  WdCT;
