const cor = require('./cor')
const httpStatus = require('http-status')

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
  return null
}

exports.supportCORSOptions = (req) => {
  return true
}

exports.checkPackPath = (req) => {
  return true
}

exports.bindHookHandler = (ctx) => {
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
