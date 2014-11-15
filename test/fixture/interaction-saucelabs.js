module.exports = function(wd){
  'use strict';
  return {
    input: {
      'open': function(url){
        return this.get(url);
      },
      'click first link': function(){
        return this.waitForElementByCss('h2 > a')
                   .click();
      }
    },
    assertion: {
      'should have title "Setup Grunt on Jenkins"': function(){
        return this.title()
                   .should.eventually.equal('Setup Grunt on Jenkins');
      },
      'should have title "jQuery Text Animation - jQuery Plugins"': function(){
        return this.title()
                   .should.eventually.equal('jQuery Text Animation - jQuery Plugins');
      }
    }
  };
};
