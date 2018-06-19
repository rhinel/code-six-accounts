const mysql = require('mysql')
const redis = require('redis')
const auth = require('./auth')

let rds

// 链接缓存
const redisct = (callback) => {
  rds = redis.createClient(auth.redisPo, auth.redisIp, {
    auth_pass: auth.redisPa,
    retry_strategy: () => 5000,
  })
  rds.on('ready', () => {
    if (callback) callback()
    console.log(`redis://${auth.redisPa}@${auth.redisIp}:${auth.redisPo} redis ready !`)
  })
  rds.on('connect', console.log.bind(console, 'redis connecting...'))
  rds.on('reconnecting', console.log.bind(console, 'redis reconnecting...'))
  rds.on('error', console.error.bind(console, 'redis connection error: '))
}

// set
const redisSet = (key, val, expire) => new Promise((resolve, reject) => {
  rds.set(key, val, (err, reply) => {
    err && reject(err)
    !err && expire && rds.expire(key, expire)
    !err && resolve(reply)
  })
})
// set time
const redisSetTime = (key, expire) => new Promise((resolve, reject) => {
  rds.expire(key, expire, (err, reply) => {
    err && reject(err)
    !err && resolve(reply)
  })
})

// get
const redisGet = (key) => new Promise((resolve, reject) => {
  rds.get(key, (err, reply) => {
    err && reject(err)
    !err && resolve(reply)
  })
})

// get keys
const redisGetKeys = (keys) => new Promise((resolve, reject) => {
  rds.keys(keys, (err, reply) => {
    err && reject(err)
    !err && resolve(reply)
  })
})

// del keys
const redisDelKeys = (keys) => new Promise((resolve, reject) => {
  rds.del(keys, (err, reply) => {
    err && reject(err)
    !err && resolve(reply)
  })
})

// incr keys
const redisIncrKeys = (key) => new Promise((resolve, reject) => {
  rds.incr(key, (err, reply) => {
    err && reject(err)
    !err && resolve(reply)
  })
})

// connect
const pool = (() => {
  const pool = mysql.createPool({
    host: auth.mysqlHost,
    user: auth.mysqlUser,
    password: auth.mysqlPs,
    database: 'code_six_accounts',
  })
  pool.on('connection', (connection) => {
	  // console.log(`${auth.mysqlUser}:${auth.mysqlPs}@${auth.mysqlHost}:3306/code_six_accounts mysql ready!`)
  })
  return pool
})()

module.exports = {
  redisct,
  redisSet,
  redisSetTime,
  redisGet,
  redisGetKeys,
  redisDelKeys,
  redisIncrKeys,
  pool,
  db: mysql,
}
