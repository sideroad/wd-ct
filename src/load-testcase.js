module.exports = function (testcase, startColumn, callback){
  var header = [],
      body = [],
      csv = require('fast-csv'),
      xlsx = require('node-xlsx'),
      XLS = require('xlsjs'),
      _ = require('lodash'),
      path = require('path'),
      suffix = path.extname(testcase),
      trimEmpty = function(err, header, body){
        var findLastIndex = function(line){
              return _.findLastIndex(line, function(val){
                return val !== undefined && val !== null && val === val && val !== '';
              });
            },
            last = findLastIndex(header);

        header = header.slice(0, last+1);
        body = _.chain( body )
                .map(function(line){
                  return findLastIndex(line) === -1 ? false : line.slice(0, last+1);
                })
                .compact().value();


        
        // start column index
        header = _.rest(header, startColumn);

        // remove assert header column
        header.pop();

        callback(err, header, body);
      };

  if(suffix === '.csv' || suffix === '.tsv'){
    csv
      .fromPath(testcase, {
        delimiter: suffix === '.tsv' ? '\t' : ','
      })
      .on("record", function(data, row){

        // Header should be ignore
        if(row === 0){
          header = data;
          return;
        }

        body.push(data);
      })
      .on("end", function(){
        trimEmpty(null, header, body);
      });
  } else if(suffix === '.xlsx') {
    _.each(xlsx.parse(testcase).worksheets[0].data, function(data, row){
        // Header should be ignore
        if(row === 0){
          header = _.map(data, function(obj){
            return obj.value;
          });
          return;
        }

        body.push( _.map(data, function(obj){
          return obj.value;
        }));
    });
    trimEmpty(null, header, body);
  } else if(suffix === '.xls') {
    (function(){
      var workbook = XLS.readFile(testcase),
          worksheet = workbook.Sheets[ workbook.SheetNames[0] ],
          data = XLS.utils.sheet_to_json( worksheet, {header: 1} );

      header = data.shift();
      body = data;
      trimEmpty(null, header, body);
    })();
  }
};