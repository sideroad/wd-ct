/* global describe, it, before */

(function () {
    'use strict';

    var chai = require('chai'),
        spies = require('chai-spies'),
        prompt = require('prompt'),
        site;

    chai.use(spies);
    chai.should();

    before(function(done){
        var Site = require('../helpers/setup-site');
        site = new Site();

        prompt.override = {
            breakpoint: ' '
        };

        done();
    });

    describe('WbCT', function () {
	    var WdCT = require('../../src/wd-ct');

        describe('execute test', function () {
            it('should succeed CSV test', function (done) {
                var wdCt = new WdCT({
                    interaction: 'test/fixture/interaction.js',
                    testcase: 'test/fixture/testcase.csv',
                    browsers: ['phantomjs'],
                    debug: false
                }).then(function(){
                    done();
                }, function(err){
                    done(err);
                });
                wdCt.should.not.equal(null);
            });
            it('should succeed xlsx test', function (done) {
                var wdCt = new WdCT({
                    interaction: 'test/fixture/interaction.js',
                    testcase: 'test/fixture/testcase.xlsx',
                    browsers: ['phantomjs'],
                    debug: false
                }).then(function(){
                    done();
                }, function(err){
                    done(err);
                });
                wdCt.should.not.equal(null);
            });
            it('should succeed xls test', function (done) {
                var wdCt = new WdCT({
                    interaction: 'test/fixture/interaction.js',
                    testcase: 'test/fixture/testcase.xls',
                    browsers: ['phantomjs'],
                    debug: false
                }).then(function(){
                    done();
                }, function(err){
                    done(err);
                });
                wdCt.should.not.equal(null);
            });
            it('should ignore first column', function (done) {
                var wdCt = new WdCT({
                    interaction: 'test/fixture/interaction.js',
                    testcase: 'test/fixture/testcase-with-numbering.csv',
                    browsers: ['phantomjs'],
                    startColumn: 1,
                    debug: false
                }).then(function(){
                    done();
                }, function(err){
                    done(err);
                });
                wdCt.should.not.equal(null);
            });
            it('should fail and interrupted', function (done) {
                var errorLogger = chai.spy(function(){}),
                    wdCt = new WdCT({
                        interaction: 'test/fixture/interaction-failed.js',
                        testcase: 'test/fixture/testcase.csv',
                        browsers: ['phantomjs'],
                        debug: false,
                        errorLogger: errorLogger,
                        errorScreenshot: 'capture'
                    }).then(function(){
                        done('should fail');
                    }, function(err){
                        var expected = new RegExp("expected 'http://localhost:8000/index.html\\?text=abcde' to equal "+
                                                           "'http://localhost:8000/index.html\\?aaa=bbb' capture\\[ .+.png \\]");
                        err.should.have.property('message').to.match(expected);

                        // error should be occurred once.
                        errorLogger.should.have.been.called.once;
                        done();
                    });
                wdCt.should.not.equal(null);
            });
            it('should continue test even through error occurred', function (done) {
                var errorLogger = chai.spy(function(){}),
                    wdCt = new WdCT({
                        interaction: 'test/fixture/interaction-failed.js',
                        testcase: 'test/fixture/testcase.csv',
                        browsers: ['phantomjs'],
                        debug: false,
                        errorLogger: errorLogger,
                        force: true
                    }).then(function(){
                        // error should be occurred twice.
                        errorLogger.should.have.been.called.twice;
                        done();
                    }, function(err){
                        done(err);
                    });
                wdCt.should.not.equal(null);
            });
            it('should throw error when command does not exists', function (done) {
                var wdCt = new WdCT({
                    interaction: 'test/fixture/interaction-not-enough.js',
                    testcase: 'test/fixture/testcase.xlsx',
                    browsers: ['phantomjs'],
                    debug: false,
                    error: false
                }).then(function(){
                    done('should fail');
                }, function(err){
                    err.should.have.property('message').and.equal('Command not exists in script: input text');
                    done();
                });
                wdCt.should.not.equal(null);
            });
        });
        describe('execute with breakpoint', function () {
            it('should stop after each commands', function (done) {
                var promptLogger = chai.spy(function(){}),
                    wdCt = new WdCT({
                        interaction: 'test/fixture/interaction.js',
                        testcase: 'test/fixture/testcase.csv',
                        browsers: ['phantomjs'],
                        debug: false,
                        stepwise: true,
                        promptLogger: promptLogger
                    }).then(function(){
                        // prompt should be call 8 times.
                        promptLogger.should.have.been.called.exactly(8);
                        done();
                    }, function(err){
                        done(err);
                    });
                wdCt.should.not.equal(null);
            });
            it('should stop when error happend', function (done) {
                var promptLogger = chai.spy(function(){}),
                    errorLogger = chai.spy(function(){}),
                    wdCt = new WdCT({
                        interaction: 'test/fixture/interaction-failed.js',
                        testcase: 'test/fixture/testcase.csv',
                        browsers: ['phantomjs'],
                        debug: false,
                        pauseOnError: true,
                        promptLogger: promptLogger,
                        errorLogger: errorLogger
                    }).then(function(){
                        done('should fail');
                    }, function(err){
                        err.should.have.property('message').equal(
                            "expected \'http://localhost:8000/index.html?text=abcde\' to equal "+
                                     "\'http://localhost:8000/index.html?aaa=bbb\'");

                        // prompt should be call only once.
                        promptLogger.should.have.been.called.once;

                        // error should be occurred only once.
                        errorLogger.should.have.been.called.once;

                        done();
                    });
                wdCt.should.not.equal(null);
            });
        });
    });	


})();
