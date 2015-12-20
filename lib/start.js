var http = require('http');
var yml = require('js-yaml');
var fs   = require('fs');
var path = require('path');
var url  = require("url");

module.exports = function (config) {
  //先判断土壤是否适合
  var soil_path = path.basename(process.cwd());

  if (soil_path.split('.').length < 2) {
    return console.log('\n  [%s]错误的目录格式。请按照标准格式修改目录名，例如：wxpay.oa.com[-boss]', chalk.red(soil_path));
  }

  //定位站点信息
  config.site = config.site || {};
  var location = soil_path.split('-');
  var host = location[0] || '';
  var rewrite = location[1] || 'main';//默认的转发
  config.site[host] = config.site[host] || {};

  //指定配置：view，视图所在目录；port，启动server后的端口号（系统自动填写）
  config.site[host][rewrite] = config.site[host][rewrite] || {port: 0, view: ''};
  

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
  service.listen(0);
  service.on('listening', function () {
    config.site[host][rewrite]['port'] = service.address().port;

    console.log('\n    服务已启动，正在监听端口：' + config.site[host][rewrite].port);
    console.log('\n    重启反向代理服务器后即可自动转发。');
    console.log('\n    本站点访问路径为：http://' + (host + '/' + rewrite + '/').replace('main/', ''));//main在这里要替换掉

    fs.writeFile(config.local.yml, yml.safeDump(config));
  });

  service.on('error', function (err) { 
    console.log('Yeah~');
  });
}