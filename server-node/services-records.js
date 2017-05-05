'use strict'

let db = require('./models')
let superagent = require('superagent')

let fixNum = (n)=>{
	return Math.round(n * 100) / 100
}

module.exports = {

	add: (req, res, callback)=>{
		if (!req.body.typeId) {
			return callback({
				type: false,
				data: '缺少账目ID'
			})
		}
		return new Promise((resolvew, rejectw)=>{
			db.pool
			.getConnection((err, connection)=>{
				if (err) {
					connection.release()
					return rejectw({
						type: false,
						data: err
					})
				}
				connection.beginTransaction(async (err)=>{
					if (err) {
						connection.release()
						return connection.rollback(rejectw({
							type: false,
							data: err
						}))
					}
					// 1查询类目
					let check = await (()=>{
						return new Promise((resolved, rejectd)=>{
							connection.query('SELECT * FROM `accounts_types` WHERE `typeId` = ? AND `status` = 1 AND `userId` = ?', [
								req.body.typeId,
								req.userId
							], (err, results, fields)=>{
								if (err) {
									connection.release()
									return connection.rollback(rejectw({
										type: false,
										data: err
									}))
								}
								resolved(results)
							})
						})
					})()
					// 1判断
					if (!check[0]) {
						connection.release()
						return connection.rollback(rejectw({
							type: false,
							data: '账目ID不存在'
						}))
					}
					// 1更新
					let checkResults = await (()=>{
						return new Promise((resolved, rejectd)=>{
							connection.query('UPDATE `accounts_types` SET `increased` = ?, `reduce` = ? WHERE `typeId` = ? AND `status` = 1 AND `userId` = ?', [
								fixNum(Number(check[0].increased) + Number(req.body.increased)),
								fixNum(Number(check[0].reduce) + Number(req.body.reduce)),
								req.body.typeId,
								req.userId
							], (err, results, fields)=>{
								if (err) {
									connection.release()
									return connection.rollback(rejectw({
										type: false,
										data: err
									}))
								}
								resolved(results)
							})
						})
					})()
					// 2查询日期
					let checkDate = await (()=>{
						return new Promise((resolved, rejectd)=>{
							connection.query('SELECT * FROM `accounts_dates` WHERE `date` = ? AND `status` = 1 AND `userId` = ?', [
								req.body.date,
								req.userId
							], (err, results, fields)=>{
								if (err) {
									connection.release()
									return connection.rollback(rejectw({
										type: false,
										data: err
									}))
								}
								resolved(results)
							})
						})
					})()
					// 2判断
					let ids = ''
					let idd = {}
					if (!checkDate[0]) {
						ids = 'INSERT INTO `accounts_dates` SET ?'
						idd = {
							date: req.body.date,
							increased: req.body.increased,
							reduce: req.body.reduce,
							createTIme: new Date(),
							userId: req.userId
						}
					} else {
						ids = 'UPDATE `accounts_dates` SET `increased` = ?, `reduce` = ? WHERE `date` = ? AND `status` = 1 AND `userId` = ?'
						idd = [
							fixNum(Number(checkDate[0].increased) + Number(req.body.increased)),
							fixNum(Number(checkDate[0].reduce) + Number(req.body.reduce)),
							req.body.date,
							req.userId
						]
					}
					// 2更新日期
					let checkDateCalc = await (()=>{
						return new Promise((resolved, rejectd)=>{
							connection.query(ids, idd, (err, results, fields)=>{
								if (err) {
									connection.release()
									return connection.rollback(rejectw({
										type: false,
										data: err
									}))
								}
								resolved(results)
							})
						})
					})()
					// 2更新统计
					let checkUser = await (()=>{
						return new Promise((resolved, rejectd)=>{
							connection.query('UPDATE `users` SET `count` = `count` + ? WHERE `status` = 1 AND `userId` = ?', [
								fixNum(Number(req.body.increased) - Number(req.body.reduce)),
								req.userId
							], (err, results, fields)=>{
								if (err) {
									connection.release()
									return connection.rollback(rejectw({
										type: false,
										data: err
									}))
								}
								resolved(results)
							})
						})
					})()
					// 3插入数据
					let results = await (()=>{
						return new Promise((resolved, rejectd)=>{
							connection.query('INSERT INTO `accounts_records` SET ?', {
								typeId: req.body.typeId,
								increased: req.body.increased,
								reduce: req.body.reduce,
								date: req.body.date,
								createTIme: new Date(),
								userId: req.userId
							}, (err, results, fields)=>{
								if (err) {
									connection.release()
									return connection.rollback(rejectw({
										type: false,
										data: err
									}))
								}
								resolved(results)
							})
						})
					})()
					// 返回
					connection.commit(()=>{
						if (err) {
							connection.release()
							return connection.rollback(rejectw({
								type: false,
								data: err
							}))
						}
						connection.release()
						return resolvew(results)
					})
				})
			})
		})
		.then((results)=>{
			return Promise.reject({
				type: true,
				data: results
			})
		})
		.catch((err)=>{
			callback({
				type: err.type || false,
				data: err.data || err.message
			})
		})
	},

	one: (req, res, callback)=>{
		if (!req.body.recordId) {
			return callback({
				type: false,
				data: '缺少记录ID'
			})
		}
		return new Promise((resolvew, rejectw)=>{
			db.pool
			.getConnection((err, connection)=>{
				if (err) {
					return rejectw({
						type: false,
						data: err
					})
				}
				connection.query('SELECT * FROM `accounts_records` WHERE `recordId` = ? AND `status` = 1 AND `userId` = ?', [
					req.body.recordId,
					req.userId
				], (err, results, fields)=>{
					connection.release()
					if (err) {
						return rejectw({
							type: false,
							data: err
						})
					}
					return resolvew(results)
				})
			})
		})
		.then((results)=>{
			return Promise.reject({
				type: true,
				data: results
			})
		})
		.catch((err)=>{
			callback({
				type: err.type || false,
				data: err.data || err.message
			})
		})
	},

	edit: (req, res, callback)=>{

	},

	del: (req, res, callback)=>{

	}
}