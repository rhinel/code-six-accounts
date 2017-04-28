'use strict'

let mysql = require('mysql')
let redis = require('redis')
let auth = require('./auth')
let db
let rds

//链接缓存
const redisct = (callback)=>{
	rds = redis.createClient(auth.redisPo, auth.redisIp, {auth_pass: auth.redisPa})
	rds.on('error', console.error.bind(console, 'redis connection error:'))
	rds.on('ready',()=>{
		callback && callback()
		console.log(auth.redisIp + ':' + auth.redisPo + ' redis ready!')
	})
}

//set
const redisSet = (key, val, expire)=>{
	return new Promise((resolve, reject)=>{
		rds.set(key, val, (err, reply)=>{
			err && reject(err)
			!err && expire && rds.expire(key, expire)
			!err && resolve(reply)
		})
	})
}
//set time
const redisSetTime = (key, expire)=>{
	return new Promise((resolve, reject)=>{
		rds.expire(key, expire, (err, reply)=>{
			err && reject(err)
			!err && resolve(reply)
		})
	})
}

//get
const redisGet = (key)=>{
	return new Promise((resolve, reject)=>{
		rds.get(key, (err, reply)=>{
			err && reject(err)
			!err && resolve(reply)
		})
	})
}

//get keys
const redisGetKeys = (keys)=>{
	return new Promise((resolve, reject)=>{
		rds.keys(keys, (err, reply)=>{
			err && reject(err)
			!err && resolve(reply)
		})
	})
}

//del keys
const redisDelKeys = (keys)=>{
	return new Promise((resolve, reject)=>{
		rds.del(keys, (err, reply)=>{
			err && reject(err)
			!err && resolve(reply)
		})
	})
}

//incr keys
const redisIncrKeys = (key)=>{
	return new Promise((resolve, reject)=>{
		rds.incr(key, (err, reply)=>{
			err && reject(err)
			!err && resolve(reply)
		})
	})
}

//connect
const pool = (()=>{
	let pool = mysql.createPool({
		host     : auth.mysqlHost,
		user     : auth.mysqlUser,
		password : auth.mysqlPs,
		database : 'code_six_accounts'
	})
	pool.on('connection', (connection)=>{
	  console.log(auth.mysqlUser +':'+ auth.mysqlPs + '@' + auth.mysqlHost + ':3306/code_six_accounts mysql ready!')
	})
	return pool
})()

module.exports = {
	redisct: redisct,
	redisSet: redisSet,
	redisSetTime: redisSetTime,
	redisGet: redisGet,
	redisGetKeys: redisGetKeys,
	redisDelKeys: redisDelKeys,
	redisIncrKeys: redisIncrKeys,
	pool: pool,
	db: mysql
}