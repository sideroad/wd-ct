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
    chai = require('chai'),
    chaiAsPromised = require('chai-as-promised'),
    csv = require('fast-csv'),
    xlsx = require('node-xlsx'),
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
    console.log.apply(console.log, arguments);
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
          commands = require(process.cwd()+'/'+interaction)(wd);
          callback();
        },
        function loadTestCase(callback){
          var header = [],
              body = [],
              suffix = testcase.match(/\.(.+)$/)[1];

          if(suffix === 'csv'){
            csv
              .fromPath(testcase)
              .on("record", function(data, row){

                // Header should be ignore
                if(row === 0){
                  header = data;
                  return;
                }

                body.push(data);
              })
              .on("end", function(){
                callback(null, header, body);
              });
          } else if(suffix === 'xlsx') {
            var workbook = xlsx.parse(testcase);
            _.each(workbook.worksheets[0].data, function(data, row){
                // Header should be ignore
                if(row === 0){
                  header = _.map(data, function(obj){
                    return obj.value;
                  });
                  return;
                }

                body.push( _.map(data, function(obj){
                  return obj.value;
                }));
            });
            callback(null, header, body);

          }
        },
        function execute(header, body, callback){
          var queue = function(command, fn, val){
                if(!fn){
                  promise = promise.then(function(){
                    throw new Error('Command not exists in script: '+command);
                  });
                  return;
                }
                promise = promise.then(function(){
                  return fn.apply( browser, [val, store]);
                }, function(e){
                  throw e;
                });
              };

          // remove assert header column
          header.pop();

          _.each(body, function(data){
            var assert = data[data.length -1];

            // queuing input interaction
            header.forEach(function(key, index){
              var val = data[index];
              queue( key, commands.input[key], val);
            });

            // queuing assertion interaction
            queue( assert, commands.assertion[assert] );
          });
          callback();
        }
      ], function(){
        var teadown = function(){
          debug(('Teardown browser ['+browserName+']').grey);
          return browser.quit();
        };

        promise.then(function(){
          return teadown();
        },function(e){
          error(e.message.red);
          return teadown();
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
