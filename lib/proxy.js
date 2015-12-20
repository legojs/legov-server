var http = require('http');
var proxy = require('http-proxy')
var yml = require('js-yaml');
var fs   = require('fs');
var path = require('path');

module.exports = function (config) {
  // 新建一个代理 Proxy Server 对象  
  proxy = proxy.createProxyServer({});  

  // 捕获异常  
  proxy.on('error', function (err, req, res) {  
    res.writeHead(500, {  
      'Content-Type': 'text/plain'  
    });  
    res.end('Something went wrong. And we are reporting a custom error message.');  
  });  

  // 另外新建一个 HTTP 80 端口的服务器，也就是常规 Node 创建 HTTP 服务器的方法。  
  // 在每次请求中，调用 proxy.web(req, res config) 方法进行请求分发  
  var server = http.createServer(function(req, res) {  
    // 在这里可以自定义你的路由分发  
    var host = req.headers.host;
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    var url = path.basename(req.url);
    url = url || 'main';
    var target = 'http://' + host + ':' + config.site[host][url].port;
    proxy.web(req, res, {target: target});
    console.log("\n    client ip: " + ip + ", host: " + host + ', url: ' + url);
    console.log('\n      Target to ' + target);
  });  
    
  console.log("\n  Proxy now is listening on port 80.")  
  server.listen(80);  
}