require('require-yaml');
var http = require('http');
var yml  = require('js-yaml');
var fso  = require('fs');
var fs   = require('hexo-fs');
var path = require('path');
var url  = require("url");
var chalk  = require("chalk");

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
  //以下路径都是相对于站点路径
  config.site[host][rewrite] = config.site[host][rewrite] || {
    port: 0, //端口
    root: 'htdocs',//站点根目录
    view: 'views'//站点视图目录    
  };
  
  var service = http.createServer(function(req, res) {
    var visitor = url.parse(req.url);
    var pathname = visitor.pathname;
    var ext = path.extname(pathname);

    //默认文件为目录名+html
    if('' === ext){
      ext = '.html';
      pathname += path.basename(pathname) + ext;
    }

    pathname = pathname.split('/');
    var rewrite = pathname[1] || 'main';

    //如果是目录转发，直接去掉转发路径
    if ('main' != rewrite && config.site[host][rewrite]) {
      pathname.splice(0, 2);
    }

    var root = 'material';
    pathname = [root].concat(pathname).join('/');

    console.log("\n    Request for "+ pathname +" received.\n");

    fs.exists(pathname)
    .then(function (exist) {
      if (exist) {
        //hexo-fs包裹Promise的时候自动加上了encoding:utf-8，导致读取图片出错。
        return fso.readFileSync(pathname);
      } else {
        return exist;
      }
    })
    .then(function (content) {
      var status = 200;
      if (!content) {
        status = 404;
        content = '找不到文件：' + pathname;
        console.log('\n    [%s]%s。', chalk.magenta(status), chalk.red(content));
      }

      var config = [];
      var mime = require('./mime');
      var ext = path.extname(pathname).replace('.', '');
      res.writeHead(status, {
        "Content-Type": mime[ext] + (ext === 'html' || ext === 'js'? '; charset=utf-8': '')
      });

      res.end((ext === 'html'? require('./ssi')(content, root): content), (ext === 'jpg' || ext === 'png')? 'binary': '');
    }); 
  });

  //自动获取一个端口号
  var port = config.site[host][rewrite].port || 0 ;
 
  service.listen(port);

  service.on('listening', function () {
    config.site[host][rewrite]['port'] = service.address().port;

    console.log('\n    服务已启动，正在监听端口：' + config.site[host][rewrite].port);
    console.log('\n    重启反向代理服务器后即可自动转发。');
    console.log('\n    本站点访问路径为：http://' + (host + '/' + rewrite + '/').replace('main/', ''));//main在这里要替换掉

    fs.writeFile(config.local.yml, yml.safeDump(config));
  });

  service.on('error', function (err) { 
    console.log('Yeah~' + err);
  });
}