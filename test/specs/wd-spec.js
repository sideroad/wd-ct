/* global describe, it, before, after */

(function () {
    'use strict';

    var chai = require('chai'),
        prompt = require('prompt'),
        site;

    chai.should();

    before(function(done){
        var Site = require('../helpers/setup-site');
        site = new Site();
        done();

        prompt.override = {
            break: '\n'
        };
    });

    after(function(){
        site.close();
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
            it('should succeed Excel test', function (done) {
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
            it('should fail test', function (done) {
                var wdCt = new WdCT({
                    interaction: 'test/fixture/interaction-failed.js',
                    testcase: 'test/fixture/testcase.csv',
                    browsers: ['phantomjs'],
                    debug: false,
                    error: false
                }).then(function(){
                    done('should fail');
                }, function(err){
                    err.should.have.property('message')
                       .and.equal("expected 'http://localhost:8000/index.html?text=abcde' to equal "+
                                           "'http://localhost:8000/index.html?foo=bar'");
                    done();
                });
                wdCt.should.not.equal(null);
            });
        });
        describe('execute with breakpoint', function () {
            it('should stop after the command of breakpoint arguments', function (done) {
                var wdCt = new WdCT({
                    interaction: 'test/fixture/interaction.js',
                    testcase: 'test/fixture/testcase.csv',
                    browsers: ['phantomjs'],
                    debug: false,
                    breakpoint: 'submit'
                }).then(function(){
                    done();
                }, function(err){
                    done(err);
                });
                wdCt.should.not.equal(null);
            });

            it('should stop after each commands', function (done) {
                var wdCt = new WdCT({
                    interaction: 'test/fixture/interaction.js',
                    testcase: 'test/fixture/testcase.csv',
                    browsers: ['phantomjs'],
                    debug: false,
                    stepwise: true
                }).then(function(){
                    done();
                }, function(err){
                    done(err);
                });
                wdCt.should.not.equal(null);
            });
        });
    });	


})();
