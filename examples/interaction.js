module.exports = function(wd){
  'use strict';
  return {
    input: {
      'open': function(url){
        return this.get(url);
      },
      'check log': function(){
        return this.title();
      }
    },
    assertion: {
      'should have error': function(){
        return this.log('browser')
                   .then(function(){
                    console.log(arguments);
                   });
      }
    }
  };
};
