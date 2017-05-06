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

					if (check[0].calc == 1) {
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
					}
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
		if (!req.body.typeId) {
			return callback({
				type: false,
				data: '缺少账目ID'
			})
		} else if (!req.body.recordId) {
			return callback({
				type: false,
				data: '缺少记录ID'
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
					// -------------------------------------------------------------------------------------------------------------------
					// 1查询自身原有记录
					let checkRecord = await (()=>{
						return new Promise((resolved, rejectd)=>{
							connection.query('SELECT * FROM `accounts_records` WHERE `recordId` = ? AND `status` = 1 AND `userId` = ?', [
								req.body.recordId,
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
					if (!checkRecord[0]) {
						connection.release()
						return connection.rollback(rejectw({
							type: false,
							data: '记录ID不存在'
						}))
					}
					// -------------------------------------------------------------------------------------------------------------------
					// 2查询原有记录类目
					let checkType = await (()=>{
						return new Promise((resolved, rejectd)=>{
							connection.query('SELECT * FROM `accounts_types` WHERE `typeId` = ? AND `status` = 1 AND `userId` = ?', [
								checkRecord[0].typeId,
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
					if (!checkType[0]) {
						connection.release()
						return connection.rollback(rejectw({
							type: false,
							data: '原记录账目ID不存在'
						}))
					}
					// 2更新原有类目
					checkType[0].increased = fixNum(Number(checkType[0].increased) - Number(checkRecord[0].increased))
					checkType[0].reduce = fixNum(Number(checkType[0].reduce) - Number(checkRecord[0].reduce))
					let checkResults = await (()=>{
						return new Promise((resolved, rejectd)=>{
							connection.query('UPDATE `accounts_types` SET `increased` = ?, `reduce` = ? WHERE `typeId` = ? AND `status` = 1 AND `userId` = ?', [
								checkType[0].increased,
								checkType[0].reduce,
								checkRecord[0].typeId,
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
					if (checkType[0].calc == 1) {
						// 2查询日期
						let checkDate = await (()=>{
							return new Promise((resolved, rejectd)=>{
								connection.query('SELECT * FROM `accounts_dates` WHERE `date` = ? AND `status` = 1 AND `userId` = ?', [
									checkRecord[0].date,
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
						let ids = 'UPDATE `accounts_dates` SET `increased` = ?, `reduce` = ? WHERE `date` = ? AND `status` = 1 AND `userId` = ?'
						let idd = [
								fixNum(Number(checkDate[0].increased) - Number(checkRecord[0].increased)),
								fixNum(Number(checkDate[0].reduce) - Number(checkRecord[0].reduce)),
								checkRecord[0].date,
								req.userId
							]
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
								connection.query('UPDATE `users` SET `count` = `count` - ? WHERE `status` = 1 AND `userId` = ?', [
									fixNum(Number(checkRecord[0].increased) - Number(checkRecord[0].reduce)),
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
					}
					// -------------------------------------------------------------------------------------------------------------------
					// 3查询update记录类目
					let updateType
					if (checkRecord[0].typeId == req.body.typeId) {
						updateType = checkType
					} else {
						updateType = await (()=>{
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
						// 3判断
						if (!updateType[0]) {
							connection.release()
							return connection.rollback(rejectw({
								type: false,
								data: '修改记录ID不存在'
							}))
						}
					}
					// 3更新update类目
					let updateResults = await (()=>{
						return new Promise((resolved, rejectd)=>{
							connection.query('UPDATE `accounts_types` SET `increased` = ?, `reduce` = ? WHERE `typeId` = ? AND `status` = 1 AND `userId` = ?', [
								fixNum(Number(updateType[0].increased) + Number(req.body.increased)),
								fixNum(Number(updateType[0].reduce) + Number(req.body.reduce)),
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
					if (updateType[0].calc == 1) {
						// 3查询日期
						let updateDate = await (()=>{
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
						// 3判断
						let ids = ''
						let idd = {}
						if (!updateDate[0]) {
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
								fixNum(Number(updateDate[0].increased) + Number(req.body.increased)),
								fixNum(Number(updateDate[0].reduce) + Number(req.body.reduce)),
								req.body.date,
								req.userId
							]
						}
						// 3更新日期
						let updateDateCalc = await (()=>{
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
						// 3更新统计
						let updateUser = await (()=>{
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
					}
					// -------------------------------------------------------------------------------------------------------------------
					// 4更新数据
					let results = await (()=>{
						return new Promise((resolved, rejectd)=>{
							connection.query('UPDATE `accounts_records` SET `typeId` = ?, `increased` = ?, `reduce` = ?, `date` = ? WHERE `recordId` = ? AND `status` = 1 AND `userId` = ?', [
								req.body.typeId,
								req.body.increased,
								req.body.reduce,
								req.body.date,
								req.body.recordId,
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

	del: (req, res, callback)=>{
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
					// -------------------------------------------------------------------------------------------------------------------
					// 1查询自身原有记录
					let checkRecord = await (()=>{
						return new Promise((resolved, rejectd)=>{
							connection.query('SELECT * FROM `accounts_records` WHERE `recordId` = ? AND `status` = 1 AND `userId` = ?', [
								req.body.recordId,
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
					if (!checkRecord[0]) {
						connection.release()
						return connection.rollback(rejectw({
							type: false,
							data: '记录ID不存在'
						}))
					}
					// -------------------------------------------------------------------------------------------------------------------
					// 2查询原有记录类目
					let checkType = await (()=>{
						return new Promise((resolved, rejectd)=>{
							connection.query('SELECT * FROM `accounts_types` WHERE `typeId` = ? AND `status` = 1 AND `userId` = ?', [
								checkRecord[0].typeId,
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
					if (!checkType[0]) {
						connection.release()
						return connection.rollback(rejectw({
							type: false,
							data: '原记录账目ID不存在'
						}))
					}
					// 2更新原有类目
					let checkResults = await (()=>{
						return new Promise((resolved, rejectd)=>{
							connection.query('UPDATE `accounts_types` SET `increased` = ?, `reduce` = ? WHERE `typeId` = ? AND `status` = 1 AND `userId` = ?', [
								fixNum(Number(checkType[0].increased) - Number(checkRecord[0].increased)),
								fixNum(Number(checkType[0].reduce) - Number(checkRecord[0].reduce)),
								checkRecord[0].typeId,
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
					if (checkType[0].calc == 1) {
						// 2查询日期
						let checkDate = await (()=>{
							return new Promise((resolved, rejectd)=>{
								connection.query('SELECT * FROM `accounts_dates` WHERE `date` = ? AND `status` = 1 AND `userId` = ?', [
									checkRecord[0].date,
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
						let ids = 'UPDATE `accounts_dates` SET `increased` = ?, `reduce` = ? WHERE `date` = ? AND `status` = 1 AND `userId` = ?'
						let idd = [
								fixNum(Number(checkDate[0].increased) - Number(checkRecord[0].increased)),
								fixNum(Number(checkDate[0].reduce) - Number(checkRecord[0].reduce)),
								checkRecord[0].date,
								req.userId
							]
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
								connection.query('UPDATE `users` SET `count` = `count` - ? WHERE `status` = 1 AND `userId` = ?', [
									fixNum(Number(checkRecord[0].increased) - Number(checkRecord[0].reduce)),
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
					}
					// -------------------------------------------------------------------------------------------------------------------
					// 3更新数据
					let results = await (()=>{
						return new Promise((resolved, rejectd)=>{
							connection.query('UPDATE `accounts_records` SET `status` = 0 WHERE `recordId` = ? AND `status` = 1 AND `userId` = ?', [
								req.body.recordId,
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
	}
}