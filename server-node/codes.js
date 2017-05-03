'use strict'

//提供默认错误提示
const codeList = {
	//outer类
	1000: '接口失败，请联系管理员',
	1001: '登陆失败',
	//auth类
	2001: '长时间无操作或登陆失效，请重新登陆',
	//
	3001: '添加账目类型失败',
	3002: '查询账目列表失败',
	3003: '查询账目失败',
	3004: '查询账目详情列表失败',
	3005: '修改账目类型失败',
	//
	9999: '接口不存在'
}

//根据接口使用返回格式化
module.exports = (code, data)=>{
	!code && (code = 1000)
	!data && (data = {
		type: false,
		data: ''
	})

	if (!data.type) {
		return {
			code: data.code || code,
			msg: data.data || codeList[code] || '未定义错误'
		}
	} else {
		return {
			code: 0,
			data: data.data || ''
		}
	}
}