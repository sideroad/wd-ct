/* global describe, it, before */

(function () {
    'use strict';

    var chai = require('chai'),
        spies = require('chai-spies'),
        prompt = require('prompt'),
        site,
        browsers = [
            {
                browserName: 'internet explorer',
                platform: 'Windows 7',
                version: '10',
            },
            {
                browserName: 'chrome',
                platform: 'OS X 10.9'
            }
        ];

    chai.use(spies);
    chai.should();


    describe('WbCT', function () {

        before(function(done){
            var Site = require('../helpers/setup-site');
            site = new Site();

            prompt.override = {
                breakpoint: ' '
            };

            done();
        });

        var WdCT = require('../../src/wd-ct');

        describe('execute saucelabs testcase', function () {
            it('should succeed test on saucelabs', function (done) {
                new WdCT({
                    interaction: 'test/fixture/interaction-saucelabs.js',
                    testcase: 'test/fixture/testcase-saucelabs.csv',
                    browsers: browsers,
                    parallel: true,
                    saucelabs: true,
                    info: 'tmp/info.log',
                    debug: 'tmp/debug.log'
                }).done(function(){
                    done();
                }, function(err){
                    done(err);
                });
            });
        });

        describe('execute test in each file type', function () {
            it('should succeed CSV test', function (done) {
                new WdCT({
                    interaction: 'test/fixture/interaction.js',
                    testcase: 'test/fixture/testcase.csv',
                    browsers: browsers,
                    parallel: true,
                    saucelabs: true,
                    info: false,
                    debug: false
                }).done(function(){
                    done();
                }, function(err){
                    done(err);
                });
            });
            it('should succeed TSV test', function (done) {
                new WdCT({
                    interaction: 'test/fixture/interaction.js',
                    testcase: 'test/fixture/testcase.tsv',
                    browsers: browsers,
                    parallel: true,
                    saucelabs: true,
                    info: false,
                    debug: false
                }).done(function(){
                    done();
                }, function(err){
                    done(err);
                });
            });
            it('should succeed xlsx test', function (done) {
                new WdCT({
                    interaction: 'test/fixture/interaction.js',
                    testcase: 'test/fixture/testcase.xlsx',
                    browsers: browsers,
                    parallel: true,
                    saucelabs: true,
                    info: false,
                    debug: false
                }).done(function(){
                    done();
                }, function(err){
                    done(err);
                });
            });
            it('should succeed xls test', function (done) {
                new WdCT({
                    interaction: 'test/fixture/interaction.js',
                    testcase: 'test/fixture/testcase.xls',
                    browsers: browsers,
                    parallel: true,
                    saucelabs: true,
                    info: false,
                    debug: false
                }).done(function(){
                    done();
                }, function(err){
                    done(err);
                });
            });
        });

        describe('logging', function () {
            it('should logging info information', function (done) {
                var infoLogger = chai.spy();
                new WdCT({
                    interaction: 'test/fixture/interaction.js',
                    testcase: 'test/fixture/testcase.csv',
                    browsers: browsers,
                    parallel: true,
                    saucelabs: true,
                    infoLogger: {write:infoLogger},
                    debug: false
                }).done(function(){
                    infoLogger.should.have.been.called.gt(1);
                    done();
                }, function(err){
                    done(err);
                });
            });
            it('should logging debug information', function (done) {
                var debugLogger = chai.spy();
                new WdCT({
                    interaction: 'test/fixture/interaction.js',
                    testcase: 'test/fixture/testcase.csv',
                    browsers: browsers,
                    parallel: true,
                    saucelabs: true,
                    info: false,
                    debugLogger: {write:debugLogger}
                }).done(function(){
                    debugLogger.should.have.been.called.gt(1);
                    done();
                }, function(err){
                    done(err);
                });
            });
            it('should logging error information', function (done) {
                var errorLogger = chai.spy();
                new WdCT({
                    interaction: 'test/fixture/interaction-failed.js',
                    testcase: 'test/fixture/testcase.csv',
                    browsers: browsers,
                    parallel: true,
                    saucelabs: true,
                    info: false,
                    debug: false,
                    errorLogger: {write:errorLogger}
                }).done(function(){
                    done('should failed');                    
                }, function(){
                    // error should be occurred once.
                    errorLogger.should.have.been.called.once;

                    done();
                });
            });

            // it('should ignore colored logging', function (done) {
            //     var debugLogger = chai.spy(function(message){
            //                         message.should.have.equal(message.red);
            //                       });
            //     new WdCT({
            //         interaction: 'test/fixture/interaction.js',
            //         testcase: 'test/fixture/testcase.csv',
            //         browsers: browsers,
            //         debugLogger: debugLogger,
            //         color: false
            //     }).done(function(){
            //         debugLogger.should.have.been.called.gt(1);
            //         done();                    
            //     }, function(err){
            //         done(err);
            //     });
            // });
            // 
        });

        describe('exception handling', function () {

            it('should fail and interrupted', function (done) {
                new WdCT({
                    interaction: 'test/fixture/interaction-failed.js',
                    testcase: 'test/fixture/testcase.csv',
                    browsers: browsers,
                    parallel: true,
                    saucelabs: true,
                    info: false,
                    debug: false,
                    error :false,
                    errorScreenshot: 'tmp'
                }).then(function(){
                    throw new Error('should fail');
                }, function(err){
                    var expected = new RegExp("expected 'http://localhost:8000/index.html\\?text=abcde' to equal "+
                                                       "'http://localhost:8000/index.html\\?aaa=bbb' capture\\[ .+.png \\]");
                    err.should.have.property('message').to.match(expected);
                    err.should.have.property('col').and.equal(4);
                    err.should.have.property('row').and.equal(2);
                    err.should.have.property('command').and.equal('should submit text parameter as abcde');

                }).done(function(){
                    done();
                }, function(err){
                    done(err);
                });
                
            });
            it('should throw error when command does not exists', function (done) {
                new WdCT({
                    interaction: 'test/fixture/interaction-not-enough.js',
                    testcase: 'test/fixture/testcase.xlsx',
                    browsers: browsers,
                    parallel: true,
                    saucelabs: true,
                    info: false,
                    debug: false,
                    error: false
                }).then(function(){
                    throw new Error('should fail');
                }, function(err){
                    err.should.have.property('message').and.equal('Command not exists in script.');
                    err.should.have.property('command').and.equal('input text');
                    err.should.have.property('col').and.equal(2);
                }).done(function(){
                    done();
                }, function(err){
                    done(err);
                });
            });

            it('should throw error when browser error happend', function (done) {
                new WdCT({
                    interaction: 'test/fixture/interaction-browser-error.js',
                    testcase: 'test/fixture/testcase-browser-error.csv',
                    // IE could not get browser error
                    browsers: [
                        {
                            browserName: 'chrome',
                            platform: 'OS X 10.9'
                        }   
                    ],
                    parallel: true,
                    saucelabs: true,
                    info: false,
                    debug: false,
                    error: false,
                    validBrowserError: true
                }).done(function(){
                    done('should throw error');
                }, function(err){
                    err.should.have.property('message').and.equal('http://localhost:8000/site.js 30:4 Uncaught ReferenceError: NotExistsObject is not defined');
                    done();
                });
            });

        });
        describe('execute with breakpoint', function () {
            it('should stop after each commands', function (done) {
                var promptLogger = chai.spy();

                new WdCT({
                    interaction: 'test/fixture/interaction.js',
                    testcase: 'test/fixture/testcase.csv',
                    browsers: browsers,
                    parallel: true,
                    saucelabs: true,
                    info: false,
                    debug: false,
                    stepwise: true,
                    promptLogger: promptLogger
                }).then(function(){
                    // prompt should be call 8 times.
                    promptLogger.should.have.been.called.exactly(8 * browsers.length);
                }, function(err){
                    throw err;
                }).done(function(){
                    done();
                }, function(err){
                    done(err);
                });
            });
            it('should stop when error happend', function (done) {
                var promptLogger = chai.spy(),
                    errorLogger = chai.spy();

                new WdCT({
                    interaction: 'test/fixture/interaction-failed.js',
                    testcase: 'test/fixture/testcase.csv',
                    browsers: browsers,
                    parallel: true,
                    saucelabs: true,
                    info: false,
                    debug: false,
                    pauseOnError: true,
                    promptLogger: promptLogger,
                    errorLogger: {write:errorLogger}
                }).then(function(){
                    throw new Error('should fail');
                }, function(err){
                    err.should.have.property('message').equal(
                        "expected \'http://localhost:8000/index.html?text=abcde\' to equal "+
                                 "\'http://localhost:8000/index.html?aaa=bbb\'");

                    err.should.have.property('col').and.equal(4);
                    err.should.have.property('row').and.equal(2);

                    // prompt should be call only once.
                    promptLogger.should.have.been.called.once;

                    // error should be occurred only once.
                    errorLogger.should.have.been.called.once;
                }).done(function(){
                    done();
                }, function(err){
                    done(err);
                });
            });
        });
        describe('execute with hooks', function () {
            it('should execute with prepared store value', function (done) {
                var promptLogger = chai.spy();

                new WdCT({
                    interaction: 'test/fixture/interaction-hooks.js',
                    testcase: 'test/fixture/testcase.csv',
                    browsers: browsers,
                    parallel: true,
                    saucelabs: true,
                    info: false,
                    debug: false,
                    promptLogger: promptLogger
                }).done(function(){
                    done();
                }, function(err){
                    done(err);
                });
            });
        });
        describe('execute with options', function () {
            it('should ignore first column', function (done) {
                new WdCT({
                    interaction: 'test/fixture/interaction.js',
                    testcase: 'test/fixture/testcase-with-numbering.csv',
                    browsers: browsers,
                    parallel: true,
                    saucelabs: true,
                    startColumn: 1,
                    info: false,
                    debug: false
                }).done(function(){
                    done();
                }, function(err){
                    done(err);
                });
            });

            it('should execute only specified row number test', function (done) {
                var infoLogger = chai.spy();
                new WdCT({
                    interaction: 'test/fixture/interaction.js',
                    testcase: 'test/fixture/testcase.csv',
                    browsers: browsers,
                    parallel: true,
                    saucelabs: true,
                    rowNum: 2,
                    infoLogger: {write:infoLogger},
                    debug: false
                }).done(function(){
                    infoLogger.should.have.been.called.exactly(4 * browsers.length);
                    // infoLogger.should.have.been.called.with('should submit text parameter as abcde val[]');
                    done();
                }, function(err){
                    done(err);
                });
            });

            it('should continue test even through error occurred', function (done) {
                var errorLogger = chai.spy();

                new WdCT({
                    interaction: 'test/fixture/interaction-failed.js',
                    testcase: 'test/fixture/testcase.csv',
                    browsers: browsers,
                    parallel: true,
                    saucelabs: true,
                    info: false,
                    debug: false,
                    errorLogger: {write:errorLogger},
                    force: true
                }).then(function(){
                    errorLogger.should.have.been.called.exactly(2 * browsers.length);
                }, function(err){
                    throw err;
                }).done(function(){
                    done();
                }, function(err){
                    done(err);
                });
            });

            it('should execute with prepared store value', function (done) {
                var promptLogger = chai.spy();

                new WdCT({
                    interaction: 'test/fixture/interaction-foo-bar.js',
                    testcase: 'test/fixture/testcase.csv',
                    browsers: browsers,
                    parallel: true,
                    saucelabs: true,
                    info: false,
                    debug: false,
                    store: {
                        foo: 'bar'
                    },
                    promptLogger: promptLogger
                }).done(function(){
                    done();
                }, function(err){
                    done(err);
                });
            });
        });

    }); 


})();
