'use strict'

let db = require('./models')
let superagent = require('superagent')
let md5 = require('md5')

module.exports = {

	/***登陆类******************************************************************************************************************/

	login: (req, res, callback)=>{
		//校验字段，错误退出
		//根据MD5(IP，用户名，密码，时间)生成token
		//查询数据库用户名密码，错误退出
		//查出登陆缓存
		//失效旧缓存
		//写入缓存新token
		//返回token
		if (!req.body.name) {
			callback({
				type: false,
				data: '请输入用户名'
			})
		} else if (!req.body.pwd) {
			callback({
				type: false,
				data: '请输入密码'
			})
		} else {
			//生成新token
			let _tokenTime = new Date().getTime()
			let _token = md5(req.ip + req.body.name + req.body.pwd + _tokenTime)
			let _userId
			//db类操作，异步同步化
			
			//1查询数据是否有超5次错误
			db
			.redisGet(req.ip)
			.then((data)=>{
				if (data && data >= 5) {
					return Promise.reject({
						type: false,
						data: '用户名/密码错误超过5次，请等待5分钟后再次登陆'
					})
				} else {
					return true
				}
			})
			//2数据库查询用户名和密码校验
			.then(()=>{
				return new Promise((resolved, rejectd)=>{
					db.pool
					.getConnection((err, connection)=>{
						if (err) {
							return rejectd({
								type: false,
								data: err
							})
						}
						connection.query('SELECT * FROM `users` WHERE `name` = ? AND `pwd` = ? AND status = 1', [req.body.name, req.body.pwd], (err, results, fields)=>{
							connection.release()
							if (err) {
								return rejectd({
									type: false,
									data: err
								})
							}
							return resolved(results)
						})
					})
				})
			})
			//2.5错误校验及错误次数
			.then((dbData)=>{
				if (!dbData[0]) {
					//账号密码错误次数5分钟机制
					return db
					.redisIncrKeys(req.ip)
					.then((data)=>{
						return db
						.redisSetTime(req.ip, 300)
						.then(()=>{
							return data
						})
					})
					.then((data)=>{
						let errorTimes = 5 - data
						errorTimes = errorTimes < 0 ? 0 : errorTimes
						return Promise.reject({
							type: false,
							data: '用户名/密码错误，5分钟内您还有' + errorTimes + '次机会'
						})
					})
				} else {
					//成功清除错误记录
					return db
					.redisDelKeys(req.ip)
					.then(()=>{
						_userId = dbData[0].userId
						return dbData
					})
				}
			})	
			//3查出已有的登陆态，更新状态
			.then((dbData)=>{
				return db.redisGetKeys(dbData[0].userId + '$*')
				//旧token失效？
				.then((reKeysData)=>{
					if (reKeysData.length) {
						// return db.redisDelKeys(reKeysData)
						return true
					} else {
						return true
					}
				})
				//更新缓存，存缓存token:userid，1800秒
				.then(()=>{
					return db.redisSet(_userId.toString() + '$' + _token, _userId.toString(), 1800)
				})
			})
			//4返回token
			.then(()=>{
				return Promise.reject({
					type: true,
					data: _token
				})
			})
			.catch((err)=>{
				callback({
					type: err.type || false,
					data: err.data || err.message
				})
			})
		}
	},

	/***权限类******************************************************************************************************************/

	auth: (req, res, callback)=>{
		//不校验字段
		//查询缓存，错误退出
		//更新缓存
		//返回空
		//db类操作，异步同步化
		db
		//查询缓存token
		.redisGetKeys('*$' + (req.body.token || req.query.token))
		.then((reKeysData)=>{
			if (reKeysData[0]) {
				return reKeysData[0]
			} else {
				return Promise.reject({
					type: false
				})
			}
		})
		//刷新缓存时间，获取USERID
		.then((reKeysData)=>{
			req.userId = reKeysData.split('$')[0]
			return db.redisSetTime(reKeysData, 1800)
		})
		.then(()=>{
			return Promise.reject({
				type: true
			})
		})
		.catch((err)=>{
			callback({
				type: err.type || false,
				data: err.data || err.message
			})
		})
	}

	/***inner类******************************************************************************************************/

}