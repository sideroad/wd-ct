module.exports = function(wd){
	return {
		input: {
			"open": function(b, url){
				return b.get(url);
			},
			"input query": function(b, str){
				return b.elementByCss('#lst-ib').type(str);
			},
			"submit": function(b){
				return b.elementByCss('[name="btnK"]').click();
			},
			"store date": function(b){
				return b.storeEval('timestamp','+new Date()');
			},
			"alert": function(b, val, store){
				return b.execute('alert('+store.timestamp+')');
			}
		},
		assertion: {
			"should be display github page": function(b){
				return b.waitForElementByCss('a[href=\"https://github.com/\"]', 1000).should.be.fulfilled;
			},
			"should be display sideroad secret page": function(b){
				return b.waitForElementByCss('a[href="http://sideroad.secret.jp/"]').should.be.fulfilled;
			}
		}
	};
};