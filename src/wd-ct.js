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
    Q = require('q'),
    wd = require('wd'),
    path = require('path'),
    SeleniumServer = require('./setup-server'),
    loadTestcase = require('./load-testcase'),
    wdExtension = require('./wd-extension'),
    browser,
    store;

var WdCT = function(options){
  var info,
      debug,
      error,
      testcase,
      server,
      interaction,
      stepwise,
      startColumn,
      errorScreenshot,
      pauseOnError,
      force,
      infoLogger,
      debugLogger,
      errorLogger,
      promptLogger,
      rowNum,
      wdCtDefer = Q.defer();

  options = _.extend({
    browsers: ['firefox'],
    testcase: 'testcase.csv',
    interaction: 'interaction.csv',
    color: true,
    info: true,
    debug: true,
    error: true,
    proxy: undefined,
    stepwise: undefined,
    errorScreenshot: false,
    pauseOnError: false,
    force: false,
    startColumn: 0,
    infoLogger: console.log,
    debugLogger: console.log,
    errorLogger: console.log,
    promptLogger: console.log,
    rowNum: undefined
  }, options);

  store = _.extend({}, options.store);
  testcase = options.testcase;
  interaction = options.interaction;
  stepwise = options.stepwise;
  startColumn = options.startColumn;
  errorScreenshot = options.errorScreenshot;
  pauseOnError = options.pauseOnError;
  force = options.force;
  infoLogger = options.infoLogger;
  debugLogger = options.debugLogger;
  errorLogger = options.errorLogger;
  promptLogger = options.promptLogger;
  rowNum = options.rowNum;
  info = options.info ? function(mes){
    infoLogger(mes.blue);
  } : function(){};
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
  wdExtension.adapt(wd, store, promptLogger);

  // Apply colors to console.log
  var colors = require('colors');
  if(!options.color){

    // Geld colors
    _.map( colors, function(val, key){
      if( typeof val === 'function' ){
        Object.defineProperty( String.prototype, key, {
          get: function(){
            return this;
          }
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
          loadTestcase(testcase, startColumn, callback);
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
                  info(command + ' val['+val+']');
                  return fn.apply( browser, [val, store]);                  
                });

                promise = promise.fail(function(err){
                  var filename,
                      throwError = function(err){
                        if(!force) {
                          throw err;
                        } else {
                          error(err);
                          if(pauseOnError) {
                            errorPromise = errorPromise.then(function(){
                              browser.break();
                            });                            
                          }
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

                  errorPromise = errorPromise.then(function(){
                    if(errorScreenshot) {
                      filename = path.join( errorScreenshot, + new Date().getTime()+'.png');
                      return browser.saveScreenshot(filename)
                                    .then(function(){
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

              },
              beforeEach = commands.beforeEach,
              afterEach = commands.afterEach;

          if(commands.before) {
            queue('before', commands.before, '', null, null);
          }

          if(rowNum) {
            body = body.slice(rowNum-2, rowNum-1);
          }

          _.each(body, function(data, row){
            var asserts;

            if(beforeEach) {
              queue('beforeEach', beforeEach, '', null, null);
            }

            data = _.rest(data, startColumn);
            asserts = data[data.length -1];

            // queuing input interaction
            header.forEach(function(key, col){
              var val = data[col];
              queue( key, commands.input[key], val, col + startColumn + 1, row + 2);
            });

            // queuing assertion interaction
            asserts.split(/\r?\n\r?\n/).forEach(function(assert){
              queue( assert, commands.assertion[assert], '', header.length + startColumn + 1, row + 2 );
            });

            if(afterEach) {
              queue('afterEach', afterEach, '', null, null);
            }
          });

          if(commands.after) {
            queue('after', commands.after, '', null, null);
          }

          callback();
        }
      ], function(){
        var teardown = function(err){
          debug(('Teardown browser ['+browserName+']').grey);
          return browser.quit().then(function(){
            callback(err);
          });
        };

        promise.then(function(){
          teardown();
        },function(err){
          error(err);
          if(pauseOnError) {
            browser.break().then(function(){
              teardown( force ? undefined : err);
            });
          } else {
            teardown( force ? undefined : err);
          }
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
