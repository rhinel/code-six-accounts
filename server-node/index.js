// 启动服务
const http = require('http')
const fs = require('fs')
const path = require('path')
const express = require('express')
const bodyParser = require('body-parser')
const morgan = require('morgan')
const rfs = require('rotating-file-stream')
const db = require('./models')

// 启动缓存链接
db.redisct()
// 启动mysql连接池
db.pool

// 启动路由及端口处理
const app = express()
// http转发
const httpServer = http.createServer(app)
const httpPORT = process.env.HTTPPORT || 80

// logs
const logDirectory = path.join(__dirname, '../log')

if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory)
}

const accessLogStream = rfs('access.log', {
  interval: '1d',
  path: logDirectory,
})

const accessLogStreamLogin = rfs('login.log', {
  interval: '1d',
  path: logDirectory,
})

app.use(morgan('combined', { stream: accessLogStream }))

// eslint-disable-next-line no-unused-vars
app.use(morgan((tokens, req, res) => [
  new Date(),
  req.headers['x-real-ip'] || req.ip,
  JSON.stringify(req.body),
].join('  '), {
  // eslint-disable-next-line no-unused-vars
  skip(req, res) {
    return req.url !== '/outer/log/login' && req.url !== '/api/outer/log/login'
  },
  stream: accessLogStreamLogin,
}))

// 路由
app.use(express.static(`${__dirname}/`))
// 使用post&json
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
// 处理路由
require('./routes')(app, express)

// 启动监听
console.log('--------------------------------------')
console.log(new Date())
httpServer.listen(httpPORT, () => {
  console.log(`TechNode http is on port ${httpPORT}!`)
})
