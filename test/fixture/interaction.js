module.exports = function(wd){
	'use strict';
	return {
		input: {
			'open': function(url){
				return this.get(url);
			},
			'input query': function(str){
				return this.waitForElementByCss('#js-command-bar-field')
				           .type(str)
				           .fireEvents('#js-command-bar-field', 'change')
				           .elementByCss('#top_search_form')
				           .submit();
			},
			'click user menu': function(){
				return this.waitForElementByCss('.search-menu-container ul.menu li:nth-of-type(4) a', 3000)
				           .click();
			},
			'click linkage': function(href){
                return this.waitForElementByCss('a[href="'+href+'"]', 3000)
                           .click();
			}
		},
		assertion: {
			'should be display sideroad github page': function(){
				return this.eval('window.location.href').should.eventually.equal('https://github.com/sideroad');
			},
			'should be display gruntjs github page': function(){
				return this.eval('window.location.href').should.eventually.equal('https://github.com/gruntjs');
			}
		}
	};
};
