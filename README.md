# WebDriver for combitorial testing[![Build Status](https://travis-ci.org/sideroad/wd-ct.svg?branch=master)](https://travis-ci.org/sideroad/wd-ct) [![Coverage Status](https://coveralls.io/repos/sideroad/wd-ct/badge.png?branch=master)](https://coveralls.io/r/sideroad/wd-ct?branch=master)

## Getting Started

```sh
$ npm install -g wd-ct
$ wd-ct -s
prompt: Are you ok to generate interaction.js and testcase.csv? (y / n):  y
prompt: Input interaction script name:  (interaction.js) 
prompt: Input testcase CSV file name:  (testcase.csv) 
$ wd-ct -i interaction.js -t testcase.csv
```

### Usage
```sh
$ wd-ct --help

##############################################
#  ██╗    ██╗██████╗        ██████╗████████╗ #
#  ██║    ██║██╔══██╗      ██╔════╝╚══██╔══╝ #
#  ██║ █╗ ██║██║  ██║█████╗██║        ██║    #
#  ██║███╗██║██║  ██║╚════╝██║        ██║    #
#  ╚███╔███╔╝██████╔╝      ╚██████╗   ██║    #
#   ╚══╝╚══╝ ╚═════╝        ╚═════╝   ╚═╝    #
##############################################

Usage: node /Users/sideroad/workspace/wd-ct/bin/wd-ct [options]
Display usage
    -h, --help
Interation start column index number should be set
    -sc, --startcolumn <value>
Set breakpoint after the command executed
    -bp, --breakpoint <value>
Stepwise execution
    -sw, --stepwise
Generate sample script and csv from template
    -s, --scaffold
Not apply color to console
    -nc, --no-color
Browser ( comma separatted )
    -b, --browsers <value>
Not output logging
    -nl, --no-logging
Target interaction file
    -i, --interaction <value>
Target testcase file
    -t, --testcase <value>
```

Prepare interaction.js and testcase.csv following below.

#### interaction.js

Define input and assert interations

```js
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
```

#### testcase.csv

Define testcase. Write input pattern and assertion.

|open|input query|click user menu|click linkage|assert|
|----|-----------|---------------|-------------|------|
|https://github.com/|sideroad||/sideroad|should be display sideroad github page|
|https://github.com/|gruntjs||/gruntjs|should be display gruntjs github page|

