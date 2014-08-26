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
            prompt.override = {};
            fs.existsSync('tmp/testcase.csv') && fs.unlinkSync('tmp/testcase.csv');
            fs.existsSync('tmp/testcase.tsv') && fs.unlinkSync('tmp/testcase.tsv');
            fs.existsSync('tmp/testcase.xls') && fs.unlinkSync('tmp/testcase.xls');
            fs.existsSync('tmp/testcase.xlsx') && fs.unlinkSync('tmp/testcase.xlsx');
            fs.existsSync('tmp/interaction.js') && fs.unlinkSync('tmp/interaction.js');
        });

        afterEach(function(){
            fs.existsSync('tmp/testcase.csv') && fs.unlinkSync('tmp/testcase.csv');
            fs.existsSync('tmp/testcase.tsv') && fs.unlinkSync('tmp/testcase.tsv');
            fs.existsSync('tmp/testcase.xls') && fs.unlinkSync('tmp/testcase.xls');
            fs.existsSync('tmp/testcase.xlsx') && fs.unlinkSync('tmp/testcase.xlsx');
            fs.existsSync('tmp/interaction.js') && fs.unlinkSync('tmp/interaction.js');
        });

        it('should scaffold CSV testcase', function (done) {
            var logger = chai.spy(function(){});

            prompt.override = {
                ok_to_create_testcase: 'y',
                testcase: 'tmp/testcase.csv',
                ok_to_create_interaction: 'n'
            };

            new WdCTScaffold({
                logger: logger
            }, function(){
                logger.should.have.been.called.exactly(3);
                fs.existsSync('tmp/testcase.csv').should.equal(true);
                fs.existsSync('tmp/testcase.tsv').should.not.equal(true);
                fs.existsSync('tmp/testcase.xls').should.not.equal(true);
                fs.existsSync('tmp/testcase.xlsx').should.not.equal(true);
                fs.existsSync('tmp/interaction.js').should.not.equal(true);
                done();
            });
        });

        it('should scaffold TSV testcase', function (done) {
            var logger = chai.spy(function(){});

            prompt.override = {
                ok_to_create_testcase: 'y',
                testcase: 'tmp/testcase.tsv',
                ok_to_create_interaction: 'n'
            };

            new WdCTScaffold({
                logger: logger
            }, function(){
                logger.should.have.been.called.exactly(3);
                fs.existsSync('tmp/testcase.csv').should.not.equal(true);
                fs.existsSync('tmp/testcase.tsv').should.equal(true);
                fs.existsSync('tmp/testcase.xls').should.not.equal(true);
                fs.existsSync('tmp/testcase.xlsx').should.not.equal(true);
                fs.existsSync('tmp/interaction.js').should.not.equal(true);
                done();
            });
        });

        it('should scaffold XLS testcase', function (done) {
            var logger = chai.spy(function(){});

            prompt.override = {
                ok_to_create_testcase: 'y',
                testcase: 'tmp/testcase.xls',
                ok_to_create_interaction: 'n'
            };

            new WdCTScaffold({
                logger: logger
            }, function(){
                logger.should.have.been.called.exactly(3);
                fs.existsSync('tmp/testcase.csv').should.not.equal(true);
                fs.existsSync('tmp/testcase.tsv').should.not.equal(true);
                fs.existsSync('tmp/testcase.xls').should.equal(true);
                fs.existsSync('tmp/testcase.xlsx').should.not.equal(true);
                fs.existsSync('tmp/interaction.js').should.not.equal(true);
                done();
            });
        });

        it('should scaffold XLSX testcase', function (done) {
            var logger = chai.spy(function(){});

            prompt.override = {
                ok_to_create_testcase: 'y',
                testcase: 'tmp/testcase.xlsx',
                ok_to_create_interaction: 'n'
            };

            new WdCTScaffold({
                logger: logger
            }, function(){
                logger.should.have.been.called.exactly(3);
                fs.existsSync('tmp/testcase.csv').should.not.equal(true);
                fs.existsSync('tmp/testcase.tsv').should.not.equal(true);
                fs.existsSync('tmp/testcase.xls').should.not.equal(true);
                fs.existsSync('tmp/testcase.xlsx').should.equal(true);
                fs.existsSync('tmp/interaction.js').should.not.equal(true);
                done();
            });
        });

        it('should scaffold interaction script', function (done) {
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
                fs.existsSync('tmp/testcase.tsv').should.not.equal(true);
                fs.existsSync('tmp/testcase.xls').should.not.equal(true);
                fs.existsSync('tmp/testcase.xlsx').should.not.equal(true);
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
