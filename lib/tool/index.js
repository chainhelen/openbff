const cor = require('./cor')
const httpStatus = require('http-status')
const clients = require('../client/index')

let Alias = {
  'TOPIC': ['$b_topic', '$b_t'],
  'DEBUG': ['$b_debug', '$b_d'],
  'VARIABLE': ['$b_variable', '$b_v']
}

for (let prop in Alias) {
  if (!Alias.hasOwnProperty(prop)) {
    continue
  }
  Alias['get' + prop] = (body) => {
    if ('[object Object]' !== Object.prototype.toString.apply(body)) {
      return undefined
    }
    let arr = Alias[prop]
    for (let i = 0; i < arr.length; i++) {
      if (body[arr[i]]) {
        return body[arr[i]]
      }
    }
  }
}

for (let prop in Alias) {
  if (!Alias.hasOwnProperty(prop)) {
    continue
  }
  Alias['set' + prop] = (ctx, v) => {
    if (undefined === ctx.bff) {
      ctx.bff = Object.create(null)
    }
    if ('[object String]' === Object.prototype.toString.apply(Alias[prop])) {
      ctx.bff[Alias[prop]] = v
    }
    if ('[object Array]' === Object.prototype.toString.apply(Alias[prop])) {
      for (let i = 0; i < Alias[prop].length; i++) {
        ctx.bff[Alias[prop][i]] = v
      }
    }
  }
}

exports.checkBffParam = (ctx) => {
  let req = ctx
  let body = req.body
  if (!body) {
    return {
      code: httpStatus.BAD_REQUEST,
      msg: 'err, no body'
    }
  }

  let method = req.method
  if (!method || 'POST' !== method.toLocalUpperCase()) {
    return {
      code: httpStatus.BAD_REQUEST,
      msg: 'err, not support method = ' + method
    }
  }

  let topic = Alias.getTOPIC(body)
  if (undefined === topic) {
    return {
      code: httpStatus.BAD_REQUEST,
      msg: 'err, miss topic'
    }
  }
  let variable = Alias.getVARIABLE(body)
  if (undefined === variable) {
    return {
      code: httpStatus.BAD_REQUEST,
      msg: 'err, miss variable'
    }
  }
  let debug = Alias.getDEBUG(body)

  // mount
  Alias.setTOPIC(ctx, topic)
  Alias.setVARIABLE(ctx, variable)
  Alias.setDEBUG(ctx, debug)
  return null
}

exports.supportCORSOptions = (req) => {
  return true
}

exports.checkPackPath = (req) => {
  return true
}

exports.getBindHookObj = async (ctx) => {
  let redisClient = clients.getRedisClient()
  let bindHookObjStr = redisClient.get(ctx.body.topic)
  if ('undefined' === typeof ctx.body.bbf) {
    ctx.body.bff = Object.create(null)
  }
  let bffObj = ctx.body.bff
  let bindHookObj = null
  try {
    bindHookObj = JSON.parse(bindHookObjStr)
  } catch (e) {
    console.error(`JSON.parse error ` + e.message)
    bindHookObj = Object.create(null)
  }
  bffObj[bindHookObj.topic] = bindHookObj
}

exports.process = async (ctx) => {
  let debugInfo = []
  let $bffData = []
  let returnDataArr = []
  let treeRoot = ctx.req.body
  let handlers = ctx.bff.handlers

  returnDataArr = await cor.recursionHandleTreeRoot(treeRoot, handlers, 0, debugInfo, $bffData)
  let bffReturnData = {}
  bffReturnData['$bff_reply'] = returnDataArr
  if (0 !== debugInfo.lenght) {
    bffReturnData['$bff_debug'] = debugInfo
  }
  return bffReturnData
}
