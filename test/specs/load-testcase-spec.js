/* global describe, it */

(function () {
    'use strict';

    var loadTestcase = require('../../src/load-testcase'),
    	chai = require('chai');

    chai.should();
    describe('loadTestcase', function () {

        it('should load CSV testcase', function (done) {
            loadTestcase('test/fixture/testcase.csv', 0, function(err, header, body){
                header.should.deep.equal(
                    ['open', 'input text', 'submit']
                );
                body.should.deep.equal([ 
                    [
                        'http://localhost:8000/index.html',
                        'abcde',
                        '',
                        'should submit text parameter as abcde'
                    ],
                    [
                        'http://localhost:8000/index.html',
                        '12345',
                        '',
                        'should submit text parameter as 12345'
                    ] 
                ]);
                done();
            });
        });

        it('should load TSV testcase', function (done) {
            loadTestcase('test/fixture/testcase.tsv', 0, function(err, header, body){
                header.should.deep.equal(
                    ['open', 'input text', 'submit']
                );
                body.should.deep.equal([ 
                    [
                        'http://localhost:8000/index.html',
                        'abcde',
                        '',
                        'should submit text parameter as abcde'
                    ],
                    [
                        'http://localhost:8000/index.html',
                        '12345',
                        '',
                        'should submit text parameter as 12345'
                    ] 
                ]);
                done();
            });
        });

        it('should load XLS testcase', function (done) {
            loadTestcase('test/fixture/testcase.xls', 0, function(err, header, body){
                header.should.deep.equal(
                    ['open', 'input text', 'submit']
                );
                body.should.deep.equal([ 
                    [
                        'http://localhost:8000/index.html',
                        'abcde',
                        '',
                        'should submit text parameter as abcde'
                    ],
                    [
                        'http://localhost:8000/index.html',
                        '12345',
                        '',
                        'should submit text parameter as 12345'
                    ] 
                ]);
                done();
            });
        });

        it('should load XLSX testcase', function (done) {
            loadTestcase('test/fixture/testcase.xlsx', 0, function(err, header, body){
                header.should.deep.equal(
                    ['open', 'input text', 'submit']
                );
                body.should.deep.equal([ 
                    [
                        'http://localhost:8000/index.html',
                        'abcde',
                        '',
                        'should submit text parameter as abcde'
                    ],
                    [
                        'http://localhost:8000/index.html',
                        '12345',
                        '',
                        'should submit text parameter as 12345'
                    ] 
                ]);
                done();
            });
        });

        it('should be able to load with start column', function (done) {
            loadTestcase('test/fixture/testcase-with-numbering.csv', 1, function(err, header, body){
                header.should.deep.equal(
                    ['open', 'input text', 'submit']
                );
                body.should.deep.equal([ 
                    [
                        'http://localhost:8000/index.html',
                        'abcde',
                        '',
                        'should submit text parameter as abcde'
                    ],
                    [
                        'http://localhost:8000/index.html',
                        '12345',
                        '',
                        'should submit text parameter as 12345'
                    ] 
                ]);
                done();
            });
        });
    });
})();
