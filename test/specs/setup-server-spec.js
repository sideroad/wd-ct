/* global describe, it */

(function () {
    'use strict';

    var SeleniumServer = require('../../src/setup-server'),
    	chai = require('chai');

    chai.should();
    describe('Selenium server manipulation', function () {
        describe('start up server', function () {
            it('should start up selenium server', function (done) {
				var server = new SeleniumServer();

				server.on('start', function(){
					server.should.not.equal(null);
					server.should.have.property('pid').and.not.equal(null);
					server.kill();
					done();
				});
            });
        });
    });
})();
