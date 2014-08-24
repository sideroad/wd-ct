/* global describe, it, before, after */

(function () {
    'use strict';

    var SeleniumServer = require('../../src/setup-server'),
     	chai = require('chai'),
        spies = require('chai-spies'),
        prompt = require('prompt'),
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


	    var wd = require('wd'),
    		webdriver = require('wd/lib/webdriver');

        describe('fireEvents', function () {
            var store = {};
            require('../../src/wd-extension')(wd, webdriver, store, function(){});

            it('should emit events', function (done) {
                var b = wd.promiseChainRemote();
                b.init({
                    browserName: 'phantomjs',
                    port: server.port
                 })
                 .get('http://localhost:8000/')
                 .elementByCss('#text')
                 .type('abcde')
                 .fireEvents('#text', 'change')
                 .elementByCss('#logger')
                 .text()
                 .then(function(text){
                    text.should.equal('abcde');
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
            var store = {};

            it('should pause execution', function (done) {
                var breakLogger = chai.spy(function(){});
                require('../../src/wd-extension')(wd, webdriver, store, breakLogger);

                var b = wd.promiseChainRemote();
                b.init({
                    browserName: 'phantomjs',
                    port: server.port
                 })
                 .get('http://localhost:8000/')
                 .url()
                 .then(function(url){
                    store.url = url;
                 })
                 .break()
                 .elementByCss('#text')
                 .type('abcde')
                 .fireEvents('#text', 'change')
                 .elementByCss('#logger')
                 .text()
                 .then(function(text){
                    text.should.equal('abcde');
                    breakLogger.should.have.been.called.once;
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
                                      if(called >= 2){
                                        prompt.override = {
                                            breakpoint: ' '
                                        };
                                      }
                                  });
                require('../../src/wd-extension')(wd, webdriver, store, breakLogger);

                prompt.override = {
                    breakpoint: 'store'
                };

                var b = wd.promiseChainRemote();
                b.init({
                    browserName: 'phantomjs',
                    port: server.port
                 })
                 .get('http://localhost:8000/')
                 .break()
                 .elementByCss('#text')
                 .type('abcde')
                 .fireEvents('#text', 'change')
                 .elementByCss('#logger')
                 .text()
                 .then(function(text){
                    // 'Input command or press enter to continue.'
                    // {}
                    // 'Input command or press enter to continue.'
                    breakLogger.should.have.been.called.exactly(3);
                    text.should.equal('abcde');
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
