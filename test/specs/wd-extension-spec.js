/* global describe, it, before, after */

(function () {
    'use strict';

    var SeleniumServer = require('../../src/setup-server'),
     	chai = require('chai'),
     	server,
        site;

    chai.should();

    before(function(done){
        var Site = require('../helpers/setup-site');
        site = new Site();

        server = new SeleniumServer();
        server.on('start', function(){
            site.close();
            done();
        });
    });

    after(function(done){
    	server.kill();
    	done();
    });

    describe('webdriver extensions', function () {
	    var wd = require('wd'),
    		webdriver = require('wd/lib/webdriver'),
    		store = {};

		require('../../src/wd-extension')(wd, webdriver, store);
        describe('waitForNoElement', function () {
            it('should wait for element not present', function (done) {
            	var b = wd.promiseChainRemote();
            	b.init({
                    browserName: 'phantomjs',
                    port: server.port
                 })
    	    	 .get('http://localhost:8000/')
            	 .elementByCss('#will-be-vanish')
            	 .waitForNoElement('#will-be-vanish', 10000)
            	 .then(function(){
            	 	b.quit();
            		done();
            	 });
            });
        });

        describe('waitForNotVisible', function () {
            it('should wait for element disappear', function (done) {
            	var b = wd.promiseChainRemote();
                b.init({
                    browserName: 'phantomjs',
                    port: server.port
                 })
    	    	 .get('http://localhost:8000/')
            	 .elementByCss('#will-be-disappear')
            	 .waitForNotVisible('#will-be-disappear', 10000)
            	 .then(function(){
            	 	b.quit();
            		done();
            	 });
            });
        });
    });


    describe('addPromiseChainMethod', function () {
	    var wd = require('wd'),
    		webdriver = require('wd/lib/webdriver'),
    		store = {};

		require('../../src/wd-extension')(wd, webdriver, store);
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

    });	


})();
