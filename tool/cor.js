const httpStatus = require('http-status')
const qs = require('querystring')
const getInfoBySingleReqParam = require('./getInfoBySingleReqParam.js')
const rp = require('request-promise')
const requestBeforeHook = require('./requestBeforeHook.js')

function linkArr (arr) {
  let len = arr.length
  let re = []
  for (let i = 0; i < len; i++) {
    re = re.concat(arr[i])
  }
  return re
}

async function handleSingleReq (node, hook, step, debugInfo, $bffData) {
  let res = {}
  let curDebugInfo = {}
  let apiInfo = {}
  let requestInfo = {}

  let reqBeginTime = process.uptime()
  try {
    let info = getInfoBySingleReqParam(node, $bffData)
    apiInfo = info['apiInfo']
    requestInfo = info['requestInfo']

    requestBeforeHook(apiInfo, requestInfo, hook, step, $bffData)
    if (requestInfo.query) {
      requestInfo.url = requestInfo.url + requestInfo.path + '?' + qs.stringify(requestInfo.query)
      delete requestInfo.query
      delete requestInfo.path
    }

    // debug
    curDebugInfo['requestInfo'] = requestInfo

    let data = await rp(requestInfo)
    try {
      data = JSON.parse(data)
    } catch (e) {
      // nothing, just return this "not json" to client
    }
    res = {
      code: httpStatus.OK,
      result: data
    }
  } catch (e) {
    res = {
      code: httpStatus.OK,
      msg: e.message
    }
  }

  // TODO, should add debug secret
  curDebugInfo['reply'] = res
  curDebugInfo['costTime'] = process.uptime() - reqBeginTime
  if (1 === parseInt(apiInfo['_debug']) || true === apiInfo['_debug']) {
    debugInfo.push(curDebugInfo)
  }

  return res
}

exports.recursionHandleTreeRoot = async (node, handlers, step, debugInfo, $bffData) => {
  if (node['sync'] && node['async']) {
    return {
      code: httpStatus.BAD_REQUEST,
      msg: 'err, has "sync" and "async" in one object'
    }
  }

  // http.request
  if (!node['sync'] && !node['async']) {
    let res = await handleSingleReq(node, handlers, step, debugInfo, $bffData)
    return [res]
  }
  let result = []
  let asyncArr = node['async']
  if (asyncArr) {
    if ('[object Array]' !== Object.prototype.toString.apply(asyncArr)) {
      return [{
        code: httpStatus.BAD_REQUEST,
        msg: 'err, there is "async" but not array'
      }]
    }
    // handle asyncArr
    let asyncPromiseArr = []
    for (let i = 0; i < asyncArr.length; i++) {
      let curAsyncNode = asyncArr[i]
      asyncPromiseArr.push(exports.recursionHandleTreeRoot(curAsyncNode, step + 1, debugInfo, $bffData))
    }
    result = await Promise.all([...asyncPromiseArr])
    let links = linkArr(result)
    $bffData = links
    return links
  }

  let syncArr = node['sync']
  if (syncArr) {
    if ('[object Array]' !== Object.prototype.toString.apply(syncArr)) {
      return [{
        code: httpStatus.BAD_REQUEST,
        msg: 'err, there is "sync" but not array'
      }]
    }
    // handle syncArr
    for (let i = 0; i < syncArr.length; i++) {
      let curRes = await exports.recursionHandleTreeRoot(syncArr[i], step + 1, debugInfo, $bffData)
      result = result.concat(curRes)
      $bffData = result
      if (!curRes || (!curRes.length && httpStatus.OK !== curRes[curRes.lenght - 1].code)) {
        break // a error, no need to continue
      }
    }
    return result
  }
  return [{
    code: httpStatus.BAD_REQUEST,
    msg: 'err, there is no way here'
  }]
}
