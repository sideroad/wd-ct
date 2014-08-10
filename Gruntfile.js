'use strict';

module.exports = function(grunt) {
	grunt.initConfig({
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


	grunt.loadNpmTasks('grunt-mocha-cov');
	grunt.registerTask('test', ['mochacov:test']);
	grunt.registerTask('coverage', ['mochacov:coverage']);

	grunt.registerTask('ci', ['mochacov:test', 'mochacov:coverage']);
};

