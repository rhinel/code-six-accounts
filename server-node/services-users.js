const db = require('./models')
const superagent = require('superagent')

module.exports = {

  count: (req, res, callback) => new Promise((resolvew, rejectw) => {
    db.pool
      .getConnection((err, connection) => {
        if (err) {
          return rejectw({
            type: false,
            data: err,
          })
        }
        connection.query('SELECT `count` FROM `users` WHERE `status` = 1 AND `userId` = ?', [
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
    }),
}
