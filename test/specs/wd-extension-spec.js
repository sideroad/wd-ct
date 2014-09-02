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


        describe('fire', function () {
            var store = {},
                wd = require('wd');

            wdExtension.adapt(wd, store, function(){});

            it('should fire events', function (done) {
                var b = wd.promiseChainRemote();
                b.init({
                    browserName: 'phantomjs',
                    port: server.port
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
                    browserName: 'phantomjs',
                    port: server.port
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

        describe('break', function () {
            var store = {};

            it('should pause execution', function (done) {
                var breakLogger = chai.spy(function(){}),
                    wd = require('wd');

                wdExtension.adapt(wd, store, breakLogger);
                prompt.override = {
                    breakpoint: ' '
                };

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
                 .fire('change')
                 .elementByCss('#logger')
                 .text()
                 .then(function(text){
                    text.should.equal('abcde');
                    // 'Input command or press enter to continue.'
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
                    wd = require('wd');
                    
                wdExtension.adapt(wd, store, breakLogger);

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
