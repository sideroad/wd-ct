'use strict';

module.exports = function(grunt) {

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
        timeout: "240000"
      },
      test: {
        options: {
          reporter: 'spec'
        },
        src: ['test/specs/*.js']
      },
      coverage: {
        options: {
          coveralls: true
        },
        src: ['test/specs/*.js']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-mocha-cov');
  grunt.loadNpmTasks('grunt-release');

  grunt.registerTask('test', ['clean', 'mochacov:test']);
  grunt.registerTask('coverage', ['mochacov:coverage']);

  grunt.registerTask('ci', ['clean', 'test', 'mochacov:coverage']);
  grunt.registerTask('default', ['clean', 'jshint', 'mochacov:test']);

};

