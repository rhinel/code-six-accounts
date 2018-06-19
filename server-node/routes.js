const fs = require('fs')
const path = require('path')
const controller = require('./controllers')

module.exports = (app, express) => {
  // 接口，不做接口校验
  // 非权限接口
  app.route('/api/outer/:class/:function').post(controller.outer)
  // 用户权限校验处理
  app.route('/api/inner/*').post(controller.auth)
  // 权限接口控制器
  app.route('/api/inner/:class/:function').post(controller.inner)
  // 默认返回
  app.route('/api/*').post(controller.def)

  // 处理页面, 动态加载
  app.use('/404', express.static(path.resolve(__dirname, '../404')))
  app.get('*', (req, res) => {
    res.send(fs.readFileSync(path.resolve('../404/404.html'), 'utf-8'))
  })
}
