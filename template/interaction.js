module.exports = function(wd){
	'use strict';
	return {
		input: {
			'open': function(b, url){
				return b.get(url);
			},
			'input query': function(b, str){
				return b.elementByCss('#js-command-bar-field').clear().type(str+wd.SPECIAL_KEYS.Enter);
			},
			'click menu': function(b, index){
				return b.waitForElementByCss('search-menu-container li:eq('+index+')').click();
			},
			'click linkage': function(b){
                return b.waitForElementByCss('.main-content a').click();
			}
		},
		assertion: {
			'should be display sideroad github page': function(b){
				return b.eval('location.href').should.be.equal('https://github.com/sideroad/');
			},
			'should be display wd-ct github page': function(b){
				return b.eval('location.href').should.be.equal('https://github.com/sideroad/wd-ct/');
			}
		}
	};
};
