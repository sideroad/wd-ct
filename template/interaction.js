module.exports = function(wd){
	'use strict';
	return {
		input: {
			'open': function(b, url){
				return b.get(url);
			},
			'input query': function(b, str){
				return b.waitForElementByCss('#js-command-bar-field')
				        .type(str)
				        .fireEvents('#js-command-bar-field', 'change')
				        .elementByCss('#top_search_form')
				        .submit();
			},
			'click user menu': function(b){
				return b.waitForElementByCss('.search-menu-container ul.menu li:nth-of-type(4) a')
				        .click();
			},
			'click linkage': function(b, href){
                return b.waitForElementByCss('a[href="'+href+'"]')
                        .click();
			}
		},
		assertion: {
			'should be display sideroad github page': function(b){
				return b.eval('window.location.href').should.eventually.equal('https://github.com/sideroad');
			},
			'should be display gruntjs github page': function(b){
				return b.eval('window.location.href').should.eventually.equal('https://github.com/gruntjs');
			}
		}
	};
};
