# WebDriver for combitorial testing[![Coverage Status](https://coveralls.io/repos/sideroad/wd-ct/badge.png?branch=master)](https://coveralls.io/r/sideroad/wd-ct?branch=master)

## Install

```sh
$ npm install -g wd-ct
```

### Usage
Prepare interaction.js and testcase.csv following below.

#### interaction.js

Define input and assert interations

```js
module.exports = function(){
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
```

#### testcase.csv

Define testcase. Write input pattern and assertion.

```csv
open,input query,submit,open,assert
https://www.google.co.jp/,github,,http://github.com/,should be display github page
https://www.google.co.jp/,sideroad secret,,http://github.com/,should be display sideroad secret page
```

After preparation, execute `wd-ct`
```sh
$ wd-ct -i interaction.js -t testcase.csv
```
