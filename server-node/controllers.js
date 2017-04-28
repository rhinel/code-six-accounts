'use strict'

let service = require('./services')
let code = require('./codes')

//outer类，失败则跳过
const outer = (req, res, next)=>{
	//登陆类
	if (req.params.class === 'log') {
		//登录接口
		if (req.params.function === 'login') {
			service.login(req, res, (data)=>{
				res.json(code(1001, data))
			})
		} else {
			next()
		}
	} else {
		next()
	}
}

//auth类，成功则跳过
const auth = (req, res, next)=>{
	//接口校验
	let _token = req.body.token || req.query.token || ''
	if (!_token) {
		res.json(code(2001))
	} else {
		service.auth(req, res, (data)=>{
			if (!data.type) {
				res.json(code(2001, data))
			} else {
				next()
			}
		})
	}
}

//inner类，失败则跳过
const inner = (req, res, next)=>{
	if (req.params.class == 'auth') {
		res.json(code(0, {type:true}))
	} else {
		next()
	}
}

//default类，最后返回
const def = (req, res, next)=>{
	res.json(code(9999))
}

module.exports = {
	outer:outer,
	auth:auth,
	inner:inner,
	def:def
}