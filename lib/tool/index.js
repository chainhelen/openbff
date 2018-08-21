const cor = require('./cor')
const httpStatus = require('http-status')
const clients = require('../client/index')

let Alias = {
  'TOPIC': ['$b_topic', '$b_t'],
  'DEBUG': ['$b_debug', '$b_d'],
  'ACTION': ['$b_action', '$b_a']
}

for (let prop in Alias) {
  if (!Alias.hasOwnProperty(prop)) {
    continue
  }
  Alias['get' + prop] = (context) => {
    if ('[object Object]' !== Object.prototype.toString.apply(context)) {
      return undefined
    }
    let arr = Alias[prop]
    for (let i = 0; i < arr.length; i++) {
      if (context[arr[i]]) {
        return context[arr[i]]
      }
    }
  }
}

exports.checkBffParam = (req) => {
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

  let topic = Alias.getTopic(body)
  if (undefined === topic) {
    return {
      code: httpStatus.BAD_REQUEST,
      msg: 'err, miss topic'
    }
  }

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
