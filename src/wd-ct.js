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
    path = require('path'),
    fs = require('fs'),
    SeleniumServer = require('./setup-server'),
    loadTestcase = require('./load-testcase'),
    wdExtension = require('./wd-extension');

var WdCT = function(options){
  var info,
      debug,
      error,
      reporter,
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
      saucelabs,
      remote,
      parallel,
      validateBrowserError,
      validateMarkupWarning,
      wdCtDefer = Q.defer(),
      _store;

  options = _.extend({
    browsers: ['firefox'],
    testcase: 'testcase.csv',
    interaction: 'interaction.js',
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
    reporter: function(){},
    infoLogger: {write:function(mes){console.log(((mes||'').replace(/\n$/, '')).blue);}},
    debugLogger: {write:function(mes){console.log((mes||'').replace(/\n$/, ''));}},
    errorLogger: {write:function(mes){console.log(((mes||'').replace(/\n$/, '')).red);}},
    promptLogger: console.log,
    parallel: false,
    rowNum: undefined,
    saucelabs: undefined,
    validateBrowserError: false,
    validateMarkupWarning: false
  }, options);

  _store = _.extend({}, options.store);
  reporter = options.reporter;
  testcase = options.testcase;
  interaction = options.interaction;
  stepwise = options.stepwise;
  startColumn = options.startColumn;
  errorScreenshot = options.errorScreenshot;
  pauseOnError = options.pauseOnError;
  force = options.force;
  infoLogger = typeof options.info === 'string' ? fs.createWriteStream(options.info) : options.infoLogger;
  debugLogger = typeof options.debug === 'string' ? fs.createWriteStream(options.debug) : options.debugLogger;
  errorLogger = typeof options.error === 'string' ? fs.createWriteStream(options.error) : options.errorLogger;
  promptLogger = options.promptLogger;
  rowNum = options.rowNum;
  saucelabs = options.saucelabs;
  parallel = options.parallel;
  remote = options.remote ? options.remote : 
           saucelabs ? [
             "ondemand.saucelabs.com",
             80,
             saucelabs === true ? process.env.SAUCE_USERNAME   : saucelabs.username,
             saucelabs === true ? process.env.SAUCE_ACCESS_KEY : saucelabs.accesskey
           ] : 
           undefined;
  info = options.info ? function(){
    var args = Array.prototype.slice.call(arguments);
    infoLogger.write(args.join(' ')+'\n');
  } : function(){};

  debug = options.debug ? function(){
    var args = Array.prototype.slice.call(arguments);
    debugLogger.write(args.join(' ')+'\n');
  } : function(){};

  error = options.error ? function(err){
    var mes = err.message;
    mes += err.col ? '\n column['+err.col+']' : '';
    mes += err.row ? '\n row['+err.row+']' : '';
    mes += err.command ? '\n command['+err.command+']' : '';
    mes += err.val ? '\n val['+err.val+']' : '';

    errorLogger.write(mes+'\n');
  } : function(){};
  validateBrowserError = options.validateBrowserError;
  validateMarkupWarning = options.validateMarkupWarning;

  // Apply colors to console.log
  var colors = require('colors');
  if(!options.color){

    // Geld colors
    _.map( colors, function(val, key){
      Object.defineProperty( String.prototype, key, {
        configurable: true,
        get: function(){
          return this;
        }
      });
    });
  }

  var executeWd = function(){

    (parallel ? async.each : async.mapSeries).call( async, options.browsers, function(browserName, callback){
      var promise,
          commands,
          browser,
          sessionCapabilities,
          wd = require('wd'),
          store = _.extend({}, _store),
          capabilities = typeof browserName === 'string' ? {
            browserName: browserName
          } : browserName;

      // Apply wd-extension
      wdExtension.adapt(wd, store, promptLogger);

      browserName = capabilities.browserName;
      debug(('Setup browser ['+browserName+']').grey);
      chai.use(chaiAsPromised);
      chai.should();
      chaiAsPromised.transferPromiseness = wd.transferPromiseness;

      browser = wd.promiseChainRemote.apply( wd, capabilities.remote ? capabilities.remote : 
                                                 remote? remote : []);
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

      promise = browser.init(_.extend(
                // Default settings
                {
                  hostname: '127.0.0.1',
                  name: testcase,
                  build: options.build,
                  tags: options.tags || [],
                  proxy: options.proxy || {}
                },

                // Browser settings
                capabilities,

                // Server settings
                {
                  port: server ? server.port : '80'
                }
                ))
                .sessionCapabilities()
                .then(function(cap){
                  sessionCapabilities = cap;
                });

      if(saucelabs){
        promise = promise.sauceJobUpdate({
        });
      }

      debug(('  Running testcase['+testcase+']').grey);

      async.waterfall([
        function registerInteraction(callback){
          commands = require(process.cwd()+'/'+interaction)(wd, store);
          loadTestcase(testcase, startColumn, callback);
        },
        function execute(header, body, callback){
          var queue = function(args){
                var command = args.command,
                    fn = args.fn,
                    val = args.val,
                    col = args.col,
                    row = args.row;

                if(!fn){
                  promise = promise.then(function(){
                    var err = new Error();
                    err.message = 'Command not exists in script.';
                    err.col = col + startColumn;
                    err.command = command;
                    throw err;
                  });
                  return;
                }

                promise = promise.then(function(){
                  info(command + ' val['+val+']');
                  var dfd = fn.apply( browser, [val, store]);
                  if(validateBrowserError) {
                    dfd = dfd.then(function(){
                      return browser.getBrowserErrors().then(function(errs){
                        if(errs.length){
                          throw new Error(errs.join('\n'));
                        }
                        return this;
                      });
                    }, function(err){
                      throw err;
                    });
                  }
                  if(validateMarkupWarning) {
                    dfd = dfd.then(function(){
                      return browser.getMarkupWarning().then(function(errs){
                        if(errs.length){
                          throw new Error(errs.join('\n'));
                        }
                        return this;
                      });
                    }, function(err){
                      throw err;
                    });
                  }
                  return dfd.then(function(){
                      reporter({
                        command: command,
                        val: val,
                        col: col,
                        row: row,
                        cap: sessionCapabilities
                      });
                    },
                    function(err){
                      reporter({
                        command: command,
                        val: val,
                        col: col,
                        row: row,
                        err: err,
                        cap: sessionCapabilities,
                        bailout: !force
                      });
                      throw err;
                    }
                  );
                });

                promise = promise.fail(function(err){
                  var throwError = function(err){
                        if(!force) {
                          errorScreenshot = false;
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
                    err.col = col + startColumn;
                    err.row = row;
                    err.command = command;
                    err.val = err.val;
                  }

                  errorPromise = errorPromise.then(function(){
                    var basename,
                        capturefile,
                        sourcefile;

                    if(errorScreenshot) {
                      basename = [
                                     sessionCapabilities.platform,
                                     sessionCapabilities.browserName,
                                     sessionCapabilities.version,
                                     col + startColumn,
                                     row,
                                     command,
                                     new Date().getTime()
                                   ].join('-').replace(/\s/g, '_');
                      capturefile = path.join( errorScreenshot, basename+'.png');
                      sourcefile = path.join( errorScreenshot, basename+'.html');

                      return browser.saveScreenshot(capturefile)
                                    .source()
                                    .then(function(source){
                                        fs.writeFileSync(sourcefile, source, 'utf-8');
                                        err.message += ' capture[ '+capturefile+' ] source[ '+sourcefile+' ]';
                                        throwError(err);
                                    });
                    } else {
                      throwError(err);
                    }
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
            queue({
              command: 'before', 
              fn: commands.before,
              val: '',
              col: null,
              row: null
            });
          }

          if(rowNum) {
            body = body.slice(rowNum-2, rowNum-1);
          }

          _.each(body, function(data, row){
            var asserts = data[data.length -1].split(/\r?\n\r?\n/);

            if(beforeEach) {
              queue({
                command: 'beforeEach',
                fn: beforeEach,
                val: '',
                col: null,
                row: null
              });
            }

            // queuing input interaction
            header.forEach(function(key, col){
              var val = data[col];
              queue({
                command: key,
                fn: commands.input[key],
                val: val,
                col: col + 1,
                row: row + 2
              });
            });

            // queuing assertion interaction
            asserts.forEach(function(assert){
              queue({
                command: assert,
                fn: commands.assertion[assert],
                val: '',
                col: header.length + 1,
                row: row + 2
              });
            });

            if(afterEach) {
              queue({
                command: 'afterEach',
                fn: afterEach,
                val: '',
                col: null,
                row: null,
                asserts: asserts
              });
            }
          });

          if(commands.after) {
            queue({
              command: 'after',
              fn: commands.after,
              val: '',
              col: null,
              row: null
            });
          }

          callback();
        }
      ], function(){
        var teardown = function(err){
          debug(('Teardown browser ['+browserName+']').grey);

          if(saucelabs) {
            browser = browser.sauceJobStatus(!err);
          }
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

      if(infoLogger.end){
        infoLogger.end();
        infoLogger = {write:function(){}};
      }
      if(debugLogger.end){
        debugLogger.end();
        debugLogger = {write:function(){}};
      }
      if(errorLogger.end){
        errorLogger.end();
        errorLogger = {write:function(){}};
      }

      if(server) {
        server.kill();
      }
      if(err){
        wdCtDefer.reject(err);
      } else {
        wdCtDefer.resolve();
      }
    });
  };

  // Set up selenium server on local
  if(!remote) {
    debug('Setup Selenium Server...'.grey);

    server = new SeleniumServer();
    server.on('data', function(data){
      debug(data.grey);
    });

    server.on('start', executeWd);
  } else {
    executeWd();
  }

  return wdCtDefer.promise;
};

module.exports =  WdCT;
