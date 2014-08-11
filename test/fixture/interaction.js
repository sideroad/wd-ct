module.exports = function(wd){
	return {
		input: {
			"open": function(url){
				return this.get(url);
			},
			"input query": function(str){
				return this.elementByCss('#lst-ib').type(str);
			},
			"submit": function(){
				return this.elementByCss('[name="btnK"]').click();
			},
			"store date": function(){
				return this.storeEval('timestamp','+new Date()');
			},
			"alert": function(val, store){
				return this.execute('alert('+store.timestamp+')');
			}
		},
		assertion: {
			"should be display github page": function(){
				return this.waitForElementByCss('a[href=\"https://github.com/\"]', 1000).should.be.fulfilled;
			},
			"should be display sideroad secret page": function(){
				return this.waitForElementByCss('a[href="http://sideroad.secret.jp/"]').should.be.fulfilled;
			}
		}
	};
};