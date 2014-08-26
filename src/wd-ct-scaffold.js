module.exports = function(options, callback){
  var prompt = require('prompt'),
      fs = require('fs'),
      async = require('async'),
      _ = require('lodash'),
      Mustache = require('mustache'),
      template = fs.readFileSync(__dirname+'/../template/interaction.tpl', 'utf-8'),
      loadTestcase = require('./load-testcase'),
      testcaseRegExp = /^.*\.(csv|tsv|xls|xlsx)$/,
      logger;

  options = _.extend({
    logger: console.log
  }, options);

  logger = options.logger;
  prompt.message = '';
  prompt.delimiter = '';
  prompt.start();

  async.waterfall([
    function(callback){
      logger('Are you sure you want to generate testcase? (y / n)');
      prompt.get({
        properties: {
          ok_to_create_testcase: {
            pattern: /^y|n$/,
            description: '>',
            default: 'n',
            required: true
          }
        }
      }, function(err, results){
        if(results.ok_to_create_testcase === 'y') {
          logger('Input testcase file name.( csv, tsv, xls, xlsx extension is permitted )');
          prompt.get({
            properties: {
              testcase: {
                pattern: testcaseRegExp,
                description: '>',
                default: 'testcase.csv',
                required: true
              }
            }
          }, function(err, results){
            var ext = results.testcase.match(testcaseRegExp)[1];

            if(ext === 'csv'){
              fs.createReadStream(__dirname+'/../template/testcase.csv').pipe(fs.createWriteStream(results.testcase));
            } else if(ext === 'tsv'){
              fs.createReadStream(__dirname+'/../template/testcase.tsv').pipe(fs.createWriteStream(results.testcase));
            } else if(ext === 'xls'){
              fs.createReadStream(__dirname+'/../template/testcase.xls').pipe(fs.createWriteStream(results.testcase));
            } else if(ext === 'xlsx'){
              fs.createReadStream(__dirname+'/../template/testcase.xlsx').pipe(fs.createWriteStream(results.testcase));
            }

            callback();
          });
        } else {
          callback();
        }
      });
    }, 
    function(callback){
      logger('Are you sure you want to generate interaction.js? (y / n)');
      prompt.get({
        properties: {
          ok_to_create_interaction: {
            pattern: /^y|n$/,
            description: '>',
            default: 'n',
            required: true
          }
        }
      }, function(err, results){
        if(results.ok_to_create_interaction === 'y') {
          logger('Input interaction script name');
          prompt.get({
            properties: {
              interaction: {
                pattern: /^.*\.js$/,
                description: '>',
                default: 'interaction.js',
                required: true
              }
            }
          }, function(err, results){
            var interaction = results.interaction;
            logger('Input source of testcase');
            prompt.get({
              properties: {
                source: {
                  pattern: testcaseRegExp,
                  description: '>',
                  default: 'testcase.csv',
                  conform: function(source){
                    return fs.existsSync(source);
                  },
                  required: true
                }
              }
            }, function(err, results){
              loadTestcase(results.source, 0, function(err, header, body){
                var asserts = _.chain(body)
                               .map(function(line){
                                 return _.last(line).split(/\r?\n\r?\n/);
                               })
                               .flatten()
                               .value();

                fs.writeFileSync( interaction, Mustache.render(template, {
                  inputs: header,
                  asserts: asserts
                }));

                callback();
              });
            });
          });
        } else {
          callback();
        }
      });
    }
  ], function(){
    if(callback){
      callback();
    }
  });

};