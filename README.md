# WebDriver for combitorial testing[![Build Status](https://travis-ci.org/sideroad/wd-ct.svg?branch=master)](https://travis-ci.org/sideroad/wd-ct) [![Coverage Status](https://coveralls.io/repos/sideroad/wd-ct/badge.png?branch=master)](https://coveralls.io/r/sideroad/wd-ct?branch=master)

## Install

```sh
$ npm install -g wd-ct
$ wd-ct -s
```

### Usage
Prepare interaction.js and testcase.csv following below.

#### interaction.js

Define input and assert interations

```js
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
```

#### testcase.csv

Define testcase. Write input pattern and assertion.

```csv
open,input query,click user menu,click linkage,assert
https://github.com/,sideroad,,/sideroad,should be display sideroad github page
https://github.com/,gruntjs,,/gruntjs,should be display gruntjs github page
```

After preparation, execute `wd-ct`
```sh
$ wd-ct -i interaction.js -t testcase.csv
```
