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
      url = require('url'),
      fs = require('fs'),
      _ = require('lodash'),
      Q = require('q'),
      wd = require('wd'),
      chai = require("chai"),
      chaiAsPromised = require("chai-as-promised"),
      csv = require("fast-csv"),
      Handlebars = require('handlebars'),
      webdriver = require('wd/lib/webdriver'),
      jquery = fs.readFileSync( path.join( __dirname, '/lib/jquery-1.9.1.min.js' ), 'utf8').toString(),
      seleniumjar = __dirname+'/lib/selenium-server-standalone-2.42.2.jar',
      fireEvents = fs.readFileSync( path.join( __dirname, '/lib/fire-events.js'), 'utf8').toString(),
      searchOption = fs.readFileSync( path.join( __dirname, '/lib/search-option.js'), 'utf8').toString(),
      searchIframe = fs.readFileSync( path.join( __dirname, '/lib/search-iframe.js'), 'utf8').toString(),
      browser,
      storedVars = {},
      timeout,
      sendEscapeAfterType,
      startURL,
      htmlpath,
      key,
      store,
      getDriverOptions = function(){
        var options = [],
            base = path.join( __dirname,'lib' );

        //webdriver.ie.driver
        options.push( process.platform !== 'win32' ? '' : 
                      process.config.variables.host_arch === 'x64' ? '-Dwebdriver.ie.driver='+ base + path.sep + 'IEDriverServer.x64.exe' :
                                                                     '-Dwebdriver.ie.driver='+ base + path.sep + 'IEDriverServer.x86.exe' );

        //weddriver.chrome.driver
        options.push( process.platform === 'darwin' ? '-Dwebdriver.chrome.driver='+ base + path.sep + 'mac.chromedriver' :
                      process.platform === 'win32'  ? '-Dwebdriver.chrome.driver='+ base + path.sep + 'chromedriver.exe' :
                      process.platform === 'linux'  && (process.config.variables.host_arch === 'x64') ? '-Dwebdriver.chrome.driver='+ base + path.sep + 'linux64.chromedriver' :
                      process.platform === 'linux'  && (process.config.variables.host_arch === 'x32') ? '-Dwebdriver.chrome.driver='+ base + path.sep + 'linux32.chromedriver' : '');
        return ' '+options.join(' ');
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
    'store',
    function(key, source) {
      return this
        .execute(source)
        .then(function(results){
          store[key] = results;
          console.log(arguments);
        });
    }
  );

  var WdCT = function(options){
    var child,
        that = this,
        log = options.log,
        logging = log ? function(data){
          data = ''+data;
          console.log(data.replace(/\n$/,''));
          fs.appendFileSync(log, data);
        } : function(){},
        testcase,
        input,
        assertion,
        assert = [];

    options = _.extend({
      browsers: ['firefox'],
      timeout: 10000,
      force: false,
      sendEscapeAfterType: true
    }, options);

    testcase = options.testcase;
    input = options.input;
    assertion = options.assertion;

    console.log('Setup Selenium Server...');
    child = spawn('java -jar ' + seleniumjar + getDriverOptions());

    child.stderr.on('data', function(data){
      logging(data);
    });

    child.stdout.on('data', function(data){
      data = ''+data;
      logging(data);
      if( !data.match('Started org.openqa.jetty.jetty.Server') ) {
        return;
      }

      async.mapSeries( options.browsers, function(browserName, callback){
        var promise,
            interation = {
              defaults: {},
              specified: {},
              assert: {}
            },
            queue = [],
            order = [];

        console.log('Setup browser ['+browserName+']');
        chai.use(chaiAsPromised);
        chai.should();
        chaiAsPromised.transferPromiseness = wd.transferPromiseness;

        browser = wd.promiseChainRemote();
        // optional extra logging
        browser.on('status', function(info) {
          console.log(info.cyan);
        });
        browser.on('command', function(eventType, command, response) {
          console.log(' > ', command, (response || ''));
        });
        browser.on('http', function(meth, path, data) {
          console.log(' > ', path, (data || ''));
        });

        promise = browser.init({
          browserName: browserName,
          name: 'This is an example test',
          proxy: options.proxy || undefined
        });
        timeout = options.timeout;
        htmlpath = options.source;
        startURL = options.startURL;
        sendEscapeAfterType = options.sendEscapeAfterType;

        console.log('  Running testcase['+testcase+']');

        async.waterfall([
          function(callback){
            csv
              .fromPath(input)
              .on("record", function(data, row){
                var key = data.shift(),
                    val = data.shift(),
                    commands = data.shift();

                if(val === ""){
                  interation.defaults[key] = commands;
                } else {
                  if(!interation.specified[val]) {
                    interation.specified[val] = {};
                  }
                  interation.specified[val][key] = commands;
                }
              })
              .on("end", function(){
                callback();
              });
          },
          function(callback){
            csv
              .fromPath(assertion)
              .on("record", function(data, row){
                var key = data.shift(),
                    commands = data.shift();

                interation.assert[key] = commands;
              })
              .on("end", function(){
                callback();
              });
          },
          function getOrderTestCase(callback){
            csv
              .fromPath(testcase)
              .on("record", function(data, row){
                var commands = data.pop();
                if(row === 0){
                  order = data;
                } else {
                  assert[row] = commands;
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
                var obj = {};
                if(row === 0){
                  return;
                }

                order.forEach(function(key, index){
                  var val = data[index],
                      template, 
                      source;
                  console.log(key, index, order.length, row, interation.defaults[key]);
                  obj[key] = val;
                  template = (index === order.length) ? interation.assert[assert[row]] :
                             (interation.specified[val]) ? interation.specified[val][key] : 
                              interation.defaults[key];

                  source = (index === order.length) ? obj : {val: val};
                  queue.push('.then(function(){return browser.'+Handlebars.compile(template)(source)+';})');
                });
              })
              .on("end", function(){
                store = {};
                var test = __dirname +'/'+ new Date().getTime() + '.js';
                fs.writeFileSync( test, 'module.exports=function(browser, store){\n'+
                                        '  return browser'+
                                        queue.join('\n                ')+';\n'+
                                        '};');
                promise = require(test)(promise, store);
                // fs.unlinkSync(test);
                callback();
              });
          }
        ], function(){
          promise = promise.then(function(){
            console.log('Teardown browser ['+browserName+']');
            return browser.quit();
          },function(e){
            console.error(e);
            console.log('Teardown browser ['+browserName+']');
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
