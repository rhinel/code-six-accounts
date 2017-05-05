'use strict'

let db = require('./models')
let superagent = require('superagent')

module.exports = {

	add: (req, res, callback)=>{
		if (!req.body.name) {
			return callback({
				type: false,
				data: '请输入名称'
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
					// 查询是否存在
					let check = await (()=>{
						return new Promise((resolved, rejectd)=>{
							connection.query('SELECT `name` FROM `accounts_types` WHERE `name` = ? AND `status` = 1 AND `userId` = ?', [
								req.body.name,
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
					// 判断
					if (check[0]) {
						connection.release()
						return connection.rollback(rejectw({
							type: false,
							data: '名称已存在'
						}))
					}
					// 插入
					let results = await (()=>{
						return new Promise((resolved, rejectd)=>{
							connection.query('INSERT INTO `accounts_types` SET ?', {
								name: req.body.name,
								detail: req.body.detail,
								calc: req.body.calc,
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
					return rejectw({
						type: false,
						data: err
					})
				}
				connection.query('SELECT * FROM `accounts_types` WHERE `typeId` = ? AND `status` = 1 AND `userId` = ?', [
					req.body.typeId,
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
		if (!req.body.typeId) {
			return callback({
				type: false,
				data: '缺少账目ID'
			})
		}
		if (!req.body.name) {
			return callback({
				type: false,
				data: '请输入名称'
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
				connection.query('UPDATE `accounts_types` SET `name` = ?, `detail` = ? WHERE `typeId` = ? AND `status` = 1 AND `userId` = ?', [
					req.body.name,
					req.body.detail,
					req.body.typeId,
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

	list: (req, res, callback)=>{
		return new Promise((resolvew, rejectw)=>{
			db.pool
			.getConnection((err, connection)=>{
				if (err) {
					return rejectw({
						type: false,
						data: err
					})
				}
				connection.query('SELECT * FROM `accounts_types` WHERE `status` = 1 AND `userId` = ?', [
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

	minlist: (req, res, callback)=>{
		return new Promise((resolvew, rejectw)=>{
			db.pool
			.getConnection((err, connection)=>{
				if (err) {
					return rejectw({
						type: false,
						data: err
					})
				}
				connection.query('SELECT `name`, `typeId` FROM `accounts_types` WHERE `status` = 1 AND `userId` = ?', [
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

	typeDetList: (req, res, callback)=>{
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
					return rejectw({
						type: false,
						data: err
					})
				}
				connection.query('SELECT * FROM `accounts_records` WHERE `typeId` = ? AND `status` = 1 AND `userId` = ? ORDER BY `recordId` DESC LIMIT ?, ?', [
					req.body.typeId,
					req.userId,
					(req.body.page - 1) * req.body.size,
					req.body.size
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
	}
}