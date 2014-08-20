module.exports = function(wd){
  'use strict';
  return {
    input: {
      'open': function(url){
        return this.get(url);
      },
      'submit': function(){
        return this.elementByCss('#submit')
                   .click();
      }
    },
    assertion: {
      'should submit text parameter as abcde': function(){
        return this.url()
                   .should.eventually.equal('http://localhost:8000/index.html?text=abcde');
      },
      'should submit text parameter as 12345': function(){
        return this.url()
                   .should.eventually.equal('http://localhost:8000/index.html?text=12345');
      }
    }
  };
};
