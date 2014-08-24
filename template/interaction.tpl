module.exports = function(wd, store){
  'use strict';
  return {
    input: {
      {{#inputs}}
      '{{.}}': function(){
        return this.get('http://www.google.com/');
      },
      {{/inputs}}
    },
    assertion: {
      {{#asserts}}
      '{{.}}': function(){
        return this.url()
                   .should.eventually.equal('http://www.google.com/');
      },
      {{/asserts}}
    }
  };
};
