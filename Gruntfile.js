'use strict';

module.exports = function(grunt) {
  var fs = require('fs');

  grunt.initConfig({
    clean: ['tmp/*'],
    jshint: {
      options: {
        jshintrc: true
      },
      src: ['src/*.js']
    },
    mochacov: {
      options: {
        require: [],
        timeout: "60000"
      },
      test: {
        options: {
          reporter: 'spec'
        },
        src: ['test/specs/*.js']
      },
      coverage: {
        options: {
        coveralls: {
            repoToken: process.env.COVERALLS_REPO_TOKEN
          }
        },
        src: ['test/specs/*.js']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-mocha-cov');
  grunt.registerTask('test', ['clean', 'mochacov:test']);
  grunt.registerTask('coverage', ['mochacov:coverage']);

  grunt.registerTask('ci', ['mochacov:test', 'mochacov:coverage']);
  grunt.registerTask('default', ['clean', 'jshint', 'mochacov:test']);

};

