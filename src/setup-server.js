

'use strict';

var spawn = require('simple-spawn').spawn,
    path = require('path'),
    seleniumjar = __dirname+'/../vendor/selenium-server-standalone-2.42.2.jar',
    getDriverOptions = function(){
      var args = [],
          base = path.join( __dirname,'/../vendor/' );

      //webdriver.ie.driver
      args.push( process.platform !== 'win32' ? '' : 
                    process.config.variables.host_arch === 'x64' ? '-Dwebdriver.ie.driver='+ base + path.sep + 'IEDriverServer.x64.exe' :
                                                                   '-Dwebdriver.ie.driver='+ base + path.sep + 'IEDriverServer.x86.exe' );

      //weddriver.chrome.driver
      args.push( process.platform === 'darwin' ? '-Dwebdriver.chrome.driver='+ base + path.sep + 'mac.chromedriver' :
                    process.platform === 'win32'  ? '-Dwebdriver.chrome.driver='+ base + path.sep + 'chromedriver.exe' :
                    process.platform === 'linux'  && (process.config.variables.host_arch === 'x64') ? '-Dwebdriver.chrome.driver='+ base + path.sep + 'linux64.chromedriver' :
                    process.platform === 'linux'  && (process.config.variables.host_arch === 'x32') ? '-Dwebdriver.chrome.driver='+ base + path.sep + 'linux32.chromedriver' : '');
      return ' '+args.join(' ');
    };


module.exports = function(){
  var child = spawn('java -jar ' + seleniumjar + getDriverOptions());

  child.stderr.on('data', function(data){
    data = typeof data === "string" ? data : ''+data;
    child.emit('data', data.replace(/\n$/, ''));
    if(data.match('Selenium is already running on port')) {
      child.emit('start');
    }

  });

  child.stdout.on('data', function(data){
    data = typeof data === "string" ? data : ''+data;
    child.emit('data', data.replace(/\n$/,''));

    if(data.match('Started org.openqa.jetty.jetty.Server')) {
      child.emit('start');
    }
  });

  return child;
};
