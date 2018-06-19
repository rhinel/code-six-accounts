const db = require('./models')
const superagent = require('superagent')

module.exports = {

  one: (req, res, callback) => {
    if (!req.body.date) {
      return callback({
        type: false,
        data: '缺少日期',
      })
    }
    return new Promise((resolvew, rejectw) => {
      db.pool
        .getConnection((err, connection) => {
          if (err) {
            return rejectw({
              type: false,
              data: err,
            })
          }
          connection.query('SELECT * FROM `accounts_dates` WHERE `date` = ? AND `status` = 1 AND `userId` = ?', [
            req.body.date,
            req.userId,
          ], (err, results, fields) => {
            connection.release()
            if (err) {
              return rejectw({
                type: false,
                data: err,
              })
            }
            return resolvew(results)
          })
        })
    })
      .then((results) => Promise.reject({
        type: true,
        data: results,
      }))
      .catch((err) => {
        callback({
          type: err.type || false,
          data: err.data || err.message,
        })
      })
  },

  list: (req, res, callback) => new Promise((resolvew, rejectw) => {
    db.pool
      .getConnection((err, connection) => {
        if (err) {
          return rejectw({
            type: false,
            data: err,
          })
        }
        connection.query('SELECT * FROM `accounts_dates` WHERE `status` = 1 AND `userId` = ? ORDER BY `date` DESC LIMIT ?, ?', [
          req.userId,
          (req.body.page - 1) * req.body.size,
          req.body.size,
        ], (err, results, fields) => {
          connection.release()
          if (err) {
            return rejectw({
              type: false,
              data: err,
            })
          }
          return resolvew(results)
        })
      })
  })
    .then((results) => Promise.reject({
      type: true,
      data: results,
    }))
    .catch((err) => {
      callback({
        type: err.type || false,
        data: err.data || err.message,
      })
    }),

  dateDetList: (req, res, callback) => {
    if (!req.body.date) {
      return callback({
        type: false,
        data: '缺少日期',
      })
    }
    return new Promise((resolvew, rejectw) => {
      db.pool
        .getConnection((err, connection) => {
          if (err) {
            return rejectw({
              type: false,
              data: err,
            })
          }
          connection.query(`
				SELECT
				 *,
				 a.increased AS rIncreased,
				 a.reduce AS rReduce,
				 a.updateTime AS rUpdateTime,
				 a.createTime AS rCreateTime
				FROM
				 accounts_records AS a,
				 accounts_types AS b
				WHERE
				 a.date = ?
				 AND a.status = 1
				 AND b.status = 1
				 AND a.userId = ?
				 AND b.userId = ?
				 AND a.typeId = b.typeId
				ORDER BY a.recordId DESC LIMIT ?, ?`, [
            req.body.date,
            req.userId,
            req.userId,
            (req.body.page - 1) * req.body.size,
            req.body.size,
          ], (err, results, fields) => {
            connection.release()
            if (err) {
              return rejectw({
                type: false,
                data: err,
              })
            }
            return resolvew(results)
          })
        })
    })
      .then((results) => Promise.reject({
        type: true,
        data: results,
      }))
      .catch((err) => {
        callback({
          type: err.type || false,
          data: err.data || err.message,
        })
      })
  },
}
