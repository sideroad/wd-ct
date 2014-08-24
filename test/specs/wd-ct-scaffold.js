/* global describe, it, beforeEach, afterEach */

(function () {
    'use strict';

    var WdCTScaffold = require('../../src/wd-ct-scaffold'),
        fs = require('fs'),
        prompt = require('prompt'),
    	chai = require('chai'),
        spies = require('chai-spies');

    chai.use(spies);
    chai.should();
    describe('Scaffold', function () {

        beforeEach(function(){            
            prompt.override = {
            };
        });

        afterEach(function(){
        });

        it('should scaffold everythings', function (done) {
            var logger = chai.spy(function(){});

            prompt.override = {
                ok_to_create_testcase: 'y',
                testcase: 'tmp/testcase.csv',
                ok_to_create_interaction: 'y',
                interaction: 'tmp/interaction.js',
                source: 'tmp/testcase.csv'
            };

            new WdCTScaffold({
                logger: logger
            }, function(){
                logger.should.have.been.called.exactly(5);
                fs.existsSync('tmp/testcase.csv').should.equal(true);
                fs.existsSync('tmp/interaction.js').should.equal(true);
                done();
            });
        });

        it('should not scaffold', function (done) {
            var logger = chai.spy(function(){});

            prompt.override = {
                ok_to_create_testcase: 'n',
                ok_to_create_interaction: 'n'
            };

            new WdCTScaffold({
                logger: logger
            }, function(){
                logger.should.have.been.called.twice;
                done();
            });
        });
    });
})();
