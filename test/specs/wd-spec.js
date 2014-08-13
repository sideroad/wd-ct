/* global describe, it, before, after */

(function () {
    'use strict';

    var chai = require('chai'),
        site;

    chai.should();

    before(function(done){
        var Site = require('../helpers/setup-site');
        site = new Site();
        done();
    });

    after(function(){
        site.close();
    });

    describe('WbCT', function () {
	    var WdCT = require('../../src/wd-ct');

        describe('execute test', function () {
            it('should succeed test', function (done) {
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
                       .and.equal("expected 'https://github.com/sideroad' to equal "+
                                           "'https://github.com/sideroad/foo/bar/'");
                    done();
                });
                wdCt.should.not.equal(null);
            });
        });
    });	


})();
