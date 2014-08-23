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

    describe('addPromiseChainMethod', function () {
	    var wd = require('wd'),
    		webdriver = require('wd/lib/webdriver'),
    		store = {},
            breaklog = chai.spy(function(){});

		require('../../src/wd-extension')(wd, webdriver, store, breaklog);
        describe('storeEval', function () {
            it('should store executed script', function (done) {
            	var b = wd.promiseChainRemote();
                b.init({
                    browserName: 'phantomjs',
                    port: server.port
                 })
    	    	 .get('http://localhost:8000/')
            	 .storeEval('location', 'location.href')
            	 .then(function(){
            	 	store.location.should.equal('http://localhost:8000/');
            	 	b.quit();
            		done();
            	 });
            });
        });

        describe('fireEvents', function () {
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
                    b.quit();
                    done();
                 });
            });
        });

        describe('break', function () {
            it('should pause execution', function (done) {
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
                    text.should.equal('abcde');
                    b.quit();
                    done();
                 });
            });
        });

    });	


})();
