const service = require('./services')
const serviceTypes = require('./services-types')
const serviceRecords = require('./services-records')
const serviceDates = require('./services-dates')
const serviceUsers = require('./services-users')
const code = require('./codes')

// outer类，失败则跳过
const outer = (req, res, next) => {
  // 登陆类
  if (req.params.class === 'log') {
    // 登录接口
    if (req.params.function === 'login') {
      service.login(req, res, (data) => {
        res.json(code(1001, data))
      })
    } else {
      next()
    }
  } else {
    next()
  }
}

// auth类，成功则跳过
const auth = (req, res, next) => {
  // 接口校验
  const _token = req.body.token || req.query.token || ''
  if (!_token) {
    res.json(code(2001))
  } else {
    service.auth(req, res, (data) => {
      if (!data.type) {
        res.json(code(2001, data))
      } else {
        next()
      }
    })
  }
}

// inner类，失败则跳过
const inner = (req, res, next) => {
  if (req.params.class === 'auth') {
    res.json(code(0, { type: true }))
  } else if (req.params.class === 'types') {
    if (req.params.function === 'add') {
      serviceTypes.add(req, res, (data) => {
        res.json(code(3001, data))
      })
    } else if (req.params.function === 'list') {
      serviceTypes.list(req, res, (data) => {
        res.json(code(3002, data))
      })
    } else if (req.params.function === 'one') {
      serviceTypes.one(req, res, (data) => {
        res.json(code(3003, data))
      })
    } else if (req.params.function === 'typeDetList') {
      serviceTypes.typeDetList(req, res, (data) => {
        res.json(code(3004, data))
      })
    } else if (req.params.function === 'edit') {
      serviceTypes.edit(req, res, (data) => {
        res.json(code(3005, data))
      })
    } else if (req.params.function === 'minlist') {
      serviceTypes.minlist(req, res, (data) => {
        res.json(code(3006, data))
      })
    } else {
      next()
    }
  } else if (req.params.class === 'record') {
    if (req.params.function === 'add') {
      serviceRecords.add(req, res, (data) => {
        res.json(code(4001, data))
      })
    } else if (req.params.function === 'one') {
      serviceRecords.one(req, res, (data) => {
        res.json(code(4002, data))
      })
    } else if (req.params.function === 'edit') {
      serviceRecords.edit(req, res, (data) => {
        res.json(code(4003, data))
      })
    } else if (req.params.function === 'del') {
      serviceRecords.del(req, res, (data) => {
        res.json(code(4004, data))
      })
    } else {
      next()
    }
  } else if (req.params.class === 'date') {
    if (req.params.function === 'list') {
      serviceDates.list(req, res, (data) => {
        res.json(code(5001, data))
      })
    } else if (req.params.function === 'dateDetList') {
      serviceDates.dateDetList(req, res, (data) => {
        res.json(code(5002, data))
      })
    } else if (req.params.function === 'one') {
      serviceDates.one(req, res, (data) => {
        res.json(code(5003, data))
      })
    } else {
      next()
    }
  } else if (req.params.class === 'user') {
    if (req.params.function === 'count') {
      serviceUsers.count(req, res, (data) => {
        res.json(code(6001, data))
      })
    } else {
      next()
    }
  } else {
    next()
  }
}

// default类，最后返回
const def = (req, res) => {
  res.json(code(9999))
}

module.exports = {
  outer,
  auth,
  inner,
  def,
}
