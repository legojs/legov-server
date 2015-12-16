var http = require('http');
var yaml = require('js-yaml');
var fs   = require('fs');
var path = require('path');
var url  = require("url");

module.exports = function (config) {
  console.log(config);
  //读取配置文件
  try {
    var doc = yaml.safeLoad(fs.readFileSync(config, 'utf8'));
    console.log(doc);
  } catch (e) {
    console.log(e);
  }

  var service = http.createServer(function(req, res) {
    var pathname = url.parse(req.url).pathname;
    console.log(req.url);
    console.log("Request for "+ pathname +" received.");
    //fs.readFileSync(path.join(''))
    res.writeHead(200,{"Content-Type":"text/html"});
    res.write('Welcom');
    res.end();    
  });

  //自动获取一个端口号
  service.listen(80);
  service.on('listening', function() { 
    var port = service.address().port;
    console.log(port);
  });
  
  service.on('error', function (err) { 
    console.log('Yeah~');
  })
}