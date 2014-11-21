/* global describe, it, before, after */

(function () {
    'use strict';

    var SeleniumServer = require('../../src/setup-server'),
     	chai = require('chai'),
        spies = require('chai-spies'),
        prompt = require('prompt'),
        wdExtension = require('../../src/wd-extension'),
     	server,
        site;

    chai.use(spies);
    chai.should();

    describe('addPromiseChainMethod', function () {

        before(function(done){
            prompt.override = {
                breakpoint: ' '
            };
            server = new SeleniumServer();
            server.on('start', function(){

                var Site = require('../helpers/setup-site');
                site = new Site();
                done();
            });
        });
        after(function(done){
            server.kill();
            done();
        });


        describe('getBrowserErrors', function () {
            var store = {},
                wd = require('wd');

            wdExtension.adapt(wd, store, function(){});

            it('should get browser error', function (done) {
                var b = wd.promiseChainRemote("ondemand.saucelabs.com", 80, process.env.SAUCE_USERNAME, process.env.SAUCE_ACCESS_KEY);
                b.init({
                    browserName: 'chrome'
                 })
                 .get('http://localhost:8000/')
                 .getBrowserErrors()
                 .then(function(errs){
                    errs.should.have.length(0);
                 })
                 .elementByCss('#throw-error')
                 .click()
                 .getBrowserErrors()
                 .then(function(errs){
                    errs.should.have.length(1);
                 })
                 .then(function(){
                    return b.quit();
                 })
                 .done(function(){
                    done();
                 }, function(err){
                    done(err);
                 });
            });
            it('should output log for unsupported warnings on IE', function (done) {
                var b = wd.promiseChainRemote("ondemand.saucelabs.com", 80, process.env.SAUCE_USERNAME, process.env.SAUCE_ACCESS_KEY );
                b.init({
                    browserName: 'internet explorer'
                 })
                 .get('http://localhost:8000/')
                 .getBrowserErrors()
                 .then(function(errs){
                    errs.should.have.length(0);
                 })
                 .elementByCss('#throw-error')
                 .click()
                 .getBrowserErrors()
                 .then(function(errs){
                    errs.should.have.length(0);
                 })
                 .then(function(){
                    return b.quit();
                 })
                 .done(function(){
                    done();
                 }, function(err){
                    done(err);
                 });
            });
        });

        describe('fire', function () {
            var store = {},
                wd = require('wd');

            wdExtension.adapt(wd, store, function(){});

            it('should fire events', function (done) {
                var b = wd.promiseChainRemote();
                b.init({
                    browserName: 'firefox'
                 })
                 .get('http://localhost:8000/')
                 .elementByCss('#text')
                 .type('abcde')
                 .fire('change')
                 .elementByCss('#logger')
                 .text()
                 .then(function(text){
                    text.should.equal('abcde');
                 })
                 .then(function(){
                    return b.quit();
                 })
                 .done(function(){
                    done();
                 }, function(err){
                    done(err);
                 });
            });
        });

        describe('naturalType', function () {
            var store = {},
                wd = require('wd');

            wdExtension.adapt(wd, store, function(){});

            it('should type and fire events', function (done) {
                var b = wd.promiseChainRemote();
                b.init({
                    browserName: 'firefox'
                 })
                 .get('http://localhost:8000/')
                 .elementByCss('#text')
                 .naturalType('abcde')
                 .elementByCss('#logger')
                 .text()
                 .then(function(text){
                    text.should.equal('abcde');
                 })
                 .elementByCss('#text')
                 .naturalType('12345')
                 .elementByCss('#logger')
                 .text()
                 .then(function(text){
                    text.should.equal('12345');
                 })
                 .then(function(){
                    return b.quit();
                 })
                 .done(function(){
                    done();
                 }, function(err){
                    done(err);
                 });
            });
        });

        describe('select', function () {
            var store = {},
                wd = require('wd');

            wdExtension.adapt(wd, store, function(){});

            it('should select option', function (done) {
                var b = wd.promiseChainRemote();
                b.init({
                    browserName: 'firefox'
                 })
                 .get('http://localhost:8000/')
                 .elementByCss('#selectbox')
                 .select('b')
                 .elementByCss('#logger')
                 .text()
                 .then(function(text){
                    text.should.equal('2');
                 })
                 .elementByCss('#selectbox')
                 .select('c')
                 .elementByCss('#logger')
                 .text()
                 .then(function(text){
                    text.should.equal('3');
                 })
                 .then(function(){
                    return b.quit();
                 })
                 .done(function(){
                    done();
                 }, function(err){
                    done(err);
                 });
            });
        });


        describe('break', function () {

            it('should pause execution', function (done) {
                var breakLogger = chai.spy(function(){}),
                    wd = require('wd'),
                    store = {};

                wdExtension.adapt(wd, store, breakLogger);
                prompt.override = {
                    breakpoint: ' '
                };

                var b = wd.promiseChainRemote();
                b.init({
                    browserName: 'firefox'
                 })
                 .get('http://localhost:8000/')
                 .url()
                 .then(function(url){
                    store.url = url;
                    store.a = 1;
                 })
                 .break()
                 .elementByCss('#text')
                 .type('abcde')
                 .fire('change')
                 .elementByCss('#logger')
                 .text()
                 .then(function(text){
                    text.should.equal('abcde');
                    // 'Input command or press enter to continue.'
                    breakLogger.should.have.been.called.once;
                    store.a.should.equal(1);
                    return b.quit();                    
                 })
                 .done(function(){
                    done();
                 }, function(err){
                    done(err);
                 });
            });

            it('should be able to check store', function (done) {
                var called = 0,
                    breakLogger = chai.spy(function(){
                                      called++;

                                      if(called === 1){
                                        prompt.override = {
                                            breakpoint: 'store'
                                        };
                                      } else if(called === 3){
                                        prompt.override = {
                                            breakpoint: 'store.url'
                                        };
                                      } else if(called === 5) {
                                         prompt.override = {
                                            breakpoint: 'hogehoge'
                                        };
                                      } else if(called ===7){
                                        prompt.override = {
                                            breakpoint: ' '
                                        };
                                      }
                                  }),
                    wd = require('wd'),
                    store = {};
                    
                wdExtension.adapt(wd, store, breakLogger);

                var b = wd.promiseChainRemote();
                b.init({
                    browserName: 'firefox'
                 })
                 .get('http://localhost:8000/')
                 .url()
                 .then(function(url){
                    store.url = url;
                    store.b = 2;
                 })
                 .break()
                 .elementByCss('#text')
                 .type('abcde')
                 .fire('change')
                 .elementByCss('#logger')
                 .text()
                 .then(function(text){
                    // 'Input command or press enter to continue.'
                    // {url: 'http://localhost:8000/'}
                    // 'Input command or press enter to continue.'
                    // http://localhost:8000/
                    // 'Input command or press enter to continue.'
                    // Invalid input
                    // 'Input command or press enter to continue.'
                    breakLogger.should.have.been.called.exactly(7);
                    text.should.equal('abcde');
                    store.should.not.have.property('a');
                    store.b.should.equal(2);
                    return b.quit();                    
                 })
                 .done(function(){
                    done();
                 }, function(err){
                    done(err);
                 });
            });

        });

    });	


})();
