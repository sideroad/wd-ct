/* global describe, it, before */

(function () {
    'use strict';

    var chai = require('chai'),
        spies = require('chai-spies'),
        prompt = require('prompt'),
        site;

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

        describe('execute test', function () {
            it('should succeed CSV test', function (done) {
                new WdCT({
                    interaction: 'test/fixture/interaction.js',
                    testcase: 'test/fixture/testcase.csv',
                    browsers: ['phantomjs'],
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
                    browsers: ['phantomjs'],
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
                    browsers: ['phantomjs'],
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
                    browsers: ['phantomjs'],
                    debug: false
                }).done(function(){
                    done();
                }, function(err){
                    done(err);
                });
            });
            it('should ignore first column', function (done) {
                new WdCT({
                    interaction: 'test/fixture/interaction.js',
                    testcase: 'test/fixture/testcase-with-numbering.csv',
                    browsers: ['phantomjs'],
                    startColumn: 1,
                    debug: false
                }).done(function(){
                    done();
                }, function(err){
                    done(err);
                });
            });
            it('should fail and interrupted', function (done) {
                var errorLogger = chai.spy(function(){});
                new WdCT({
                    interaction: 'test/fixture/interaction-failed.js',
                    testcase: 'test/fixture/testcase.csv',
                    browsers: ['phantomjs'],
                    debug: false,
                    errorLogger: errorLogger,
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

                    // error should be occurred once.
                    errorLogger.should.have.been.called.once;
                }).done(function(){
                    done();
                }, function(err){
                    done(err);
                });
                
            });
            it('should continue test even through error occurred', function (done) {
                var errorLogger = chai.spy(function(){});

                new WdCT({
                    interaction: 'test/fixture/interaction-failed.js',
                    testcase: 'test/fixture/testcase.csv',
                    browsers: ['phantomjs'],
                    debug: false,
                    errorLogger: errorLogger,
                    force: true
                }).then(function(){
                    // error should be occurred twice.
                    errorLogger.should.have.been.called.twice;
                }, function(err){
                    throw err;
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
                    browsers: ['phantomjs'],
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
        });
        describe('execute with breakpoint', function () {
            it('should stop after each commands', function (done) {
                var promptLogger = chai.spy(function(){});

                new WdCT({
                    interaction: 'test/fixture/interaction.js',
                    testcase: 'test/fixture/testcase.csv',
                    browsers: ['phantomjs'],
                    debug: false,
                    stepwise: true,
                    promptLogger: promptLogger
                }).then(function(){
                    // prompt should be call 8 times.
                    promptLogger.should.have.been.called.exactly(8);
                }, function(err){
                    throw err;
                }).done(function(){
                    done();
                }, function(err){
                    done(err);
                });
            });
            it('should stop when error happend', function (done) {
                var promptLogger = chai.spy(function(){}),
                    errorLogger = chai.spy(function(){});

                new WdCT({
                    interaction: 'test/fixture/interaction-failed.js',
                    testcase: 'test/fixture/testcase.csv',
                    browsers: ['phantomjs'],
                    debug: false,
                    pauseOnError: true,
                    promptLogger: promptLogger,
                    errorLogger: errorLogger
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
        describe('execute with options', function () {
            it('should execute with prepared store value', function (done) {
                var promptLogger = chai.spy(function(){});

                new WdCT({
                    interaction: 'test/fixture/interaction-foo-bar.js',
                    testcase: 'test/fixture/testcase.csv',
                    browsers: ['phantomjs'],
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
