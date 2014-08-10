/*
 * wd-ct
 * https://github.com/sideroad/wd-ct
 *
 * Copyright (c) 2014 sideroad
 * Licensed under the MIT license.
 */

'use strict';

var async = require('async'),
    _ = require('lodash'),
    chai = require("chai"),
    chaiAsPromised = require("chai-as-promised"),
    csv = require("fast-csv"),
    wd = require('wd'),
    webdriver = require('wd/lib/webdriver'),
    SeleniumServer = require('./setup-server'),
    browser,
    store = {};

var WdCT = function(options){
  var debug,
      error,
      testcase,
      server,
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

  // Apply wd-extension
  require('./wd-extension')(wd, webdriver, store);

  // Apply colors to console.log
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

  server = new SeleniumServer();
  server.on('data', function(data){
    debug(data.grey);
  });

  server.on('start', function(){

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
        hostname: '127.0.0.1',
        port: server.port,
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
                // get input and assertion order from columns
                order = data;
              } else {
                // set assertion row number
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
              var assertCol = order.length;

              // Header should be ignore
              if(row === 0){
                return;
              }

              order.forEach(function(key, index){
                var val = data[index],
                    command = (index + 1 === assertCol) ? commands.assertion[assert[row]] :
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
      server.kill();
    });
  });
};

module.exports =  WdCT;
