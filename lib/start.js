var http = require('http');
var yaml = require('js-yaml');
var fs   = require('fs');
var path = require('path');
var url  = require("url");

module.exports = function (config_path, legov_path) {
  if (fs.existsSync(config_path)) {
    //读取配置文件
    var config = yaml.safeLoad(fs.readFileSync(config_path));
    if (!config.host) {
      return console.log('[%s]站点文件<legov.yml>中的Host是必填项。', config_path);
    }
  } else {
    //如果不存在就建立一个
    var note = '# LegoV Configuration\n\
## Source: https://github.com/legojs/legov/\n\
\n\
# Site\n\
# 如果要转发到wxpay.oa.com-kunpeng/views/目录，请配置如下：\n\
## host: wxpay.oa.com\n\
## path: kunpeng\n\
## root: views\n';
    var space = '';
    fs.writeFileSync(config_path, note + yaml.safeDump({host: space, path: space, root: space}));
    return console.log('[%s]请先配置当前目录下的站点文件<legov.yml>。', config_path);
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
  service.listen(0);
  service.on('listening', function() { 
    var port = service.address().port;
    var config_legov = {};
    //将端口号和host写入@legov
    var config_legov_path = path.join(legov_path, 'legov.yml');
    if (fs.existsSync(config_legov_path)) {
      var temp = yaml.safeLoad(fs.readFileSync(config_legov_path));
      if (temp) {
        config_legov = temp;
      }
    }

    if (!config_legov[config.host]) {
      config_legov[config.host] = {};
    }

    //为了兼容目录转发，这里默认给一个命名为root
    var rewite = config.path? config.path: 'root';
    if (!config_legov[config.host][rewite]) {
      config_legov[config.host][rewite] = {};
    }

    config_legov[config.host][rewite] = {
      root: config.root,
      port: port
    }

    fs.writeFileSync(config_legov_path,yaml.safeDump(config_legov));

    console.log('\n服务已启动，正在监听端口：' + port);
    console.log('\n重启反向代理服务器后即可自动转发。');
    console.log('\n本站点访问路径为：http://' + (config.host + '/' + rewite + '/').replace('core/', ''));//root在这里要替换掉
  });
  
  service.on('error', function (err) { 
    console.log('Yeah~');
  });  
}