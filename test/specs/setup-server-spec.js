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
            it('should start up selenium server with avaiable port if default port have already used', function (done) {
                var server = new SeleniumServer();

                server.on('start', function(){
                    server.should.not.equal(null);
                    server.should.have.property('pid').and.not.equal(null);

                    var otherPortServer = new SeleniumServer();
                    otherPortServer.on('start', function(){
                        server.port.should.not.equal(otherPortServer.port);
                        server.kill();
                        otherPortServer.kill();
                        done();
                    });
                });
            });
        });
    });
})();
