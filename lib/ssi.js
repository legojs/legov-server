var fs = require('fs');
var path = require('path');

module.exports = function (content, root) {
  //进行SSI处理，支持循环查找
  return includeVirtual(content.toString(), root);
}

var includeVirtual = function (content, root) {
  var include_file_reg = /<!--#\s*include\s+(file|virtual)=(['"])([^\r\n]+?)\2\s*-->/g;

  return content.replace(include_file_reg, function(){
    var file = path.join(process.cwd(), root, arguments[3]);
    if(!fs.existsSync(file)){
      console.log(file);
      return '<div>找不到此包含文件：' + file + '。</div>'
    } else {
      return includeVirtual(fs.readFileSync(file).toString(), root);
    }
  })
}