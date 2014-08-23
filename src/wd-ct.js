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
    fs = require('fs'),
    chaiAsPromised = require('chai-as-promised'),
    Q = require('q'),
    csv = require('fast-csv'),
    xlsx = require('node-xlsx'),
    XLS = require('xlsjs'),
    wd = require('wd'),
    path = require('path'),
    webdriver = require('wd/lib/webdriver'),
    SeleniumServer = require('./setup-server'),
    browser,
    store = {};

var WdCT = function(options){
  var debug,
      error,
      testcase,
      server,
      interaction,
      stepwise,
      startColumn,
      errorScreenshot,
      pauseOnError,
      force,
      debugLogger,
      errorLogger,
      promptLogger,
      wdCtDefer = Q.defer();

  options = _.extend({
    browsers: ['firefox'],
    testcase: 'testcase.csv',
    interaction: 'interaction.csv',
    color: true,
    debug: true,
    error: true,
    proxy: undefined,
    stepwise: undefined,
    errorScreenshot: false,
    pauseOnError: false,
    force: false,
    startColumn: 0,
    debugLogger: console.log,
    errorLogger: console.log,
    promptLogger: console.log
  }, options);

  testcase = options.testcase;
  interaction = options.interaction;
  stepwise = options.stepwise;
  startColumn = options.startColumn;
  errorScreenshot = options.errorScreenshot;
  pauseOnError = options.pauseOnError;
  force = options.force;
  debugLogger = options.debugLogger;
  errorLogger = options.errorLogger;
  promptLogger = options.promptLogger;
  debug = options.debug ? function(){
    debugLogger.apply(debugLogger, arguments);
  } : function(){};
  error = options.error ? function(err){
    var mes = err.message;
    mes += err.col ? '\n column['+err.col+']' : '';
    mes += err.row ? '\n row['+err.row+']' : '';
    mes += err.command ? '\n command['+err.command+']' : '';
    mes += err.val ? '\n val['+err.val+']' : '';

    errorLogger.apply(errorLogger, [mes.red]);
  } : function(){};

  // Apply wd-extension
  require('./wd-extension')(wd, webdriver, store, promptLogger);

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
          commands = require(process.cwd()+'/'+interaction)(wd, store);
          callback();
        },
        function loadTestCase(callback){
          var header = [],
              body = [],
              suffix = testcase.match(/\.(.+)$/)[1],
              trimEmpty = function(err, header, body){
                var findLastIndex = function(line){
                      return _.findLastIndex(line, function(val){
                        return val !== undefined && val !== null && val === val && val !== '';
                      });
                    },
                    last = findLastIndex(header);

                header = header.slice(0, last+1);
                body = _.chain( body )
                        .map(function(line){
                          return findLastIndex(line) === -1 ? false : line.slice(0, last+1);
                        })
                        .compact().value();

                callback(err, header, body);
              };

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
                trimEmpty(null, header, body);
              });
          } else if(suffix === 'xlsx') {
            _.each(xlsx.parse(testcase).worksheets[0].data, function(data, row){
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
            trimEmpty(null, header, body);
          } else if(suffix === 'xls') {
            (function(){
              var workbook = XLS.readFile(testcase),
                  worksheet = workbook.Sheets[ workbook.SheetNames[0] ],
                  data = XLS.utils.sheet_to_json( worksheet, {header: 1} );

              header = data.shift();
              body = data;
              trimEmpty(null, header, body);
            })();
          }
        },
        function execute(header, body, callback){
          var queue = function(command, fn, val, col, row){
                if(!fn){
                  promise = promise.then(function(){
                    var err = new Error();
                    err.message = 'Command not exists in script.';
                    err.col = col;
                    err.command = command;
                    throw err;
                  });
                  return;
                }

                promise = promise.then(function(){
                  return fn.apply( browser, [val, store]);                  
                });

                promise = promise.fail(function(err){
                  var filename,
                      throwError = function(err){
                        if(!force) {
                          throw err;
                        } else {
                          error(err);
                        }
                      },
                      defer = Q.defer(),
                      errorPromise = defer.promise;

                  if(!err.col){
                    err.col = col;
                    err.row = row;
                    err.command = command;
                    err.val = err.val;
                  }

                  if(pauseOnError) {
                    errorPromise = errorPromise.then(function(){
                      return browser.break();
                    });
                    if(!force){
                      pauseOnError = false;
                    }
                  }

                  errorPromise = errorPromise.then(function(){
                    if(errorScreenshot) {
                      filename = path.join( errorScreenshot, + new Date().getTime()+'.png');
                      return browser.takeScreenshot()
                                    .then(function(screenshot){
                                        fs.writeFileSync(filename, new Buffer( screenshot, 'base64').toString('binary'), 'binary');
                                        errorScreenshot = false;
                                        err.message += ' capture[ '+filename+' ]';
                                        throwError(err);
                                    });
                    }
                    throwError(err);
                  });
                  defer.resolve();
                  return errorPromise;
                });

                if(stepwise){
                  promise = promise.then(function(){
                    return browser.break();
                  });
                }

              };

          // start column index
          header = _.rest(header, startColumn);

          // remove assert header column
          header.pop();

          _.each(body, function(data, row){
            var assert;

            data = _.rest(data, startColumn);
            assert = data[data.length -1];

            // queuing input interaction
            header.forEach(function(key, col){
              var val = data[col];
              queue( key, commands.input[key], val, col + startColumn + 1, row + 2);
            });

            // queuing assertion interaction
            queue( assert, commands.assertion[assert], '', header.length + startColumn + 1, row + 2 );
          });
          callback();
        }
      ], function(){
        var teadown = function(err){
          debug(('Teardown browser ['+browserName+']').grey);
          return browser.quit().then(function(){
            callback(err);
          });
        };

        promise.then(function(){
          teadown();
        },function(err){
          error(err);
          teadown( force ? undefined : err);
        }).done();
      });
    }, function(err){
      server.kill();
      if(err){
        wdCtDefer.reject(err);
      } else {
        wdCtDefer.resolve();
      }
    });
  });
  return wdCtDefer.promise;
};

module.exports =  WdCT;
