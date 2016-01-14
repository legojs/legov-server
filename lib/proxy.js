var http = require('http');
var proxy = require('http-proxy')
var yml = require('js-yaml');
var fs   = require('fs');
var path = require('path');
var url = require('url');

module.exports = function (config) {
  // 新建一个代理 Proxy Server 对象  
  proxy = proxy.createProxyServer({});  

  // 捕获异常  
  proxy.on('error', function (err, req, res) {  
    res.writeHead(500, {  
      'Content-Type': 'text/plain;charset=utf-8'  
    });  
    res.end('转发失败，请检查站点是否启动；或者该站点无此文件。');  
  });

  //通过子进程来启动全部站点
  for (var host in config.site) {
    for (var rewrite in config.site[host]) {
      var dir = rewrite !== 'main'? '-' + rewrite: ''
      var home = path.join(config.local.path, '..', host + dir);

      if(!fs.existsSync(home)){
        delete config.site[host][rewrite];
      } else {
        var exec = require('child_process').exec;
        var target = url.format({
          protocol: 'http:',
          hostname: host
        });
        console.log('\n  启动子站点：%s', target + '/' + rewrite + '/（端口：' + config.site[host][rewrite].port + '）');
        var child = exec('lv s', {
            cwd: home
          },
          function (error, stdout, stderr) {
            if (error !== null && stderr !== null) {
              console.log('\n    stderr: ' + stderr);
              console.log('\n    exec error: ' + error);
            } else {
              console.log('\n    stdout: ' + stdout);
            }
        });
        console.log('\n  启动自动打包：%s', path.join(home, 'material'));
        var child = exec('lv b', {
            cwd: path.join(home, 'material')
          },
          function (error, stdout, stderr) {
            if (error !== null && stderr !== null) {
              console.log('\n    bundle stderr: ' + stderr);
              console.log('\n    bundle exec error: ' + error);
            } else {
              console.log('\n    bundle stdout: ' + stdout);
            }
        });
      }
    }
  }

  fs.writeFile(config.local.yml, yml.safeDump(config));

  // 另外新建一个 HTTP 80 端口的服务器，也就是常规 Node 创建 HTTP 服务器的方法。  
  // 在每次请求中，调用 proxy.web(req, res, config) 方法进行请求分发  
  var server = http.createServer(function(req, res) {  
    // 在这里可以自定义你的路由分发  
    var host = req.headers.host;
    var visitor = url.parse(req.url);
    var pathname = visitor.pathname.split('/');
    var rewrite = '';

    if ('' !== path.extname(pathname)) {
      //有后缀,去掉最后一级目录
      pathname.splice(-1);      
    }

    rewrite = pathname[1] || 'main';

    console.log('\n      Host：%s；Rewrite：%s', host, rewrite);

    var target = url.format({
      protocol: 'http:',
      port: config.site[host][rewrite].port,
      hostname: host
    });

    proxy.web(req, res, {target: target});    
    console.log('      Target to ' + target);
  });  
    
  console.log("\n  Proxy now is listening on port 80.")  
  server.listen(80);  
}