module.exports = function(wd, store){
  'use strict';
  store.count = {
    before: 0,
    beforeEach: 0,
    after: 0,
    afterEach: 0
  };
  return {
    before: function(){
      return this.noop()
                 .then(function(){
                   store.count.before++;
                 });
    },
    beforeEach: function(){
      return this.noop()
                 .then(function(){
                   store.count.beforeEach++;
                 });
    },
    after: function(){
      return this.noop()
                 .then(function(){
                   store.count.after++;
                 });
    },
    afterEach: function(){
      return this.noop()
                 .then(function(){
                   store.count.afterEach++;
                 });
    },
    input: {
      'open': function(url){
        return this.get(url);
      },
      'input text': function(str){
        return this.waitForElementByCss('#text')
                   .type(str)
                   .fire('change');
      },
      'submit': function(){
        return this.elementByCss('#submit')
                   .click();
      }
    },
    assertion: {
      'should submit text parameter as abcde': function(){
        return this.noop()
                   .then(function(){
                     store.count.before.should.equal(1);
                     store.count.beforeEach.should.equal(1);
                     store.count.after.should.equal(0);
                     store.count.afterEach.should.equal(0);
                   });
      },
      'should submit text parameter as 12345': function(){
        return this.noop()
                   .then(function(){
                     store.count.before.should.equal(1);
                     store.count.beforeEach.should.equal(2);
                     store.count.after.should.equal(0);
                     store.count.afterEach.should.equal(1);
                   });
      }
    }
  };
};
