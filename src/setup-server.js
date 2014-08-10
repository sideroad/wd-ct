

'use strict';

var spawn = require('simple-spawn').spawn,
    path = require('path'),
    seleniumjar = __dirname+'/../vendor/selenium-server-standalone-2.42.2.jar',
    defaultPort = 4444,
    getDriverOptions = function(port){
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

      args.push('-port '+port);
      return ' '+args.join(' ');
    };


module.exports = function(){
  var child,
      EventEmitter = require('events').EventEmitter,
      server = new EventEmitter(),
      addEvent = function(child){
        server.pid = child.pid;
        child.stderr.on('data', function(data){
          data = typeof data === "string" ? data : ''+data;
          server.emit('data', data.replace(/\n$/, ''));
          if(data.match('Selenium is already running on port')) {
            child.kill();
            server.port++;
            child = spawn('java -jar ' + seleniumjar + getDriverOptions(server.port));
            addEvent(child);
          }
        });

        child.stdout.on('data', function(data){
          data = typeof data === "string" ? data : ''+data;
          server.emit('data', data.replace(/\n$/,''));

          if(data.match('Started org.openqa.jetty.jetty.Server')) {
            server.emit('start');
          }
        });

        server.kill = function(){
          child.kill();
        };

      };

  server.port = defaultPort;
  child = spawn('java -jar ' + seleniumjar + getDriverOptions(server.port));
  addEvent(child);
  return server;
};
