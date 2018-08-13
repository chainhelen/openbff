let pathMappingToUrl = require('./pathMappingToUrl.js')
let util = require('util')
let vm = require('vm')
const TimeOut = 1000

function checkPreVm (str) {
  if (!str) {
    return false
  }
  if ('[object Object]' !== Object.prototype.toString.apply(str) &&
    '[object Array]' !== Object.prototype.toString.apply(str)) {
    return false
  }
  str = util.inspect(str)
  // $bff_data、$bff_func、$bff_calc
  if (str.indexOf('$bff_')) {
    return true
  }
  return false
}

function runVm (obj, sb) {
  let q = []
  q.push(obj)
  while (q.length) {
    let cur = q.shift()
    for (let key in cur) {
      if (!cur.hasOwnProperty(key)) {
        continue
      }
      let value = cur[key]
      if ('[object String]' === Object.prototype.toString.apply(key) && '_$bff_calc_' === key.substr(0, 11)) {
        let truePro = key.substr(11)
        delete cur[key]
        cur[truePro] = value
        // to do, just support one rank
        if ('[object String]' === Object.prototype.toString.apply(value)) {
          sb[truePro] = value
          vm.runInNewContext('' + truePro + '=' + value, sb)
          cur[truePro] = sb[truePro]
        }
        if ('[object Array]' === Object.prototype.toString.apply(value)) {
          // to do, need to write
        }
      } else if ('[object Object]' === Object.prototype.toString.apply(value) || '[object Array]' === Object.prototype.toString.apply(value)) {
        q.push(value)
      }
    }
  }
}

module.exports = (obj, $bffData) => {
  let requestInfo = {}
  let apiInfo = {}
  if (obj && obj.alias_host && obj.url) {
    throw new Error('duplicate alias_host and url')
  }
  for (let key in obj) {
    if (!obj.hasOwnProperty(key)) {
      continue
    }
    let value = obj[key]
    if ('[object String]' === Object.prototype.toString.apply(key)) {
    // !!! depend on lexicographical order , don't change the order

      key = key.trim().toLocaleLowerCase()

      if (key.trim() && 0 !== key.length && '_' === key[0]) {
        apiInfo[key] = value
      }

      // handle alias_hot
      if ('alias_host' === key) {
        let url = pathMappingToUrl(value)
        requestInfo.url = url
      }
      // handle body
      if ('body' === key) {
        let body = value
        requestInfo.body = body
      }
      // handle headers
      if ('headers' === key) {
        let headers = value
        requestInfo.headers = headers
      }
      // handle method
      if ('method' === key) {
        let method = value
        requestInfo.method = method
      }
      // handle path
      if ('path' === key) {
        // if (!requestInfo.url) {
        //   throw new Error('cant not found url ', value)
        // }
        let path = value
        requestInfo.path = path
        requestInfo.url += '/' + path
      }
      // handle query
      if ('query' === key) {
        let query = value
        requestInfo.query = query
      }
      // handle url
      if ('url' === key) {
        let url = value
        // if (requestInfo.url) {
        //   throw new Error('repeat url ', url, requestInfo.url)
        // }
        requestInfo.url = url
      }

      // first step calc need to save, to do
    }
      // defalut value
    if (!requestInfo.method) {
      requestInfo.method = 'get'
    }
    if (!requestInfo.timeout) {
      requestInfo.timeout = TimeOut
    }
  }

  let str = util.inspect(requestInfo)
  if (str && (-1 !== str.indexOf('$bff_data') || -1 !== str.indexOf('$bff_func') || -1 !== str.indexOf('$bff_calc'))) {
    // to do, inject $bff_func
    let sb = {
      '$bff_data': $bffData,
      requestInfo: {}
    }

    let query = requestInfo.query
    if (checkPreVm(query)) {
      runVm({query: query}, sb)
    }
    let body = requestInfo.body
    if (checkPreVm(body)) {
      runVm({body: body}, sb)
    }
    let header = requestInfo.header
    if (checkPreVm(header)) {
      runVm({header: header}, sb)
    }
  }
  // handle for request package
  if (requestInfo.body) {
    // to do, default json
    requestInfo.json = true
  }
  if (requestInfo.query) {
    requestInfo.qs = requestInfo.query
    delete requestInfo.query
  }
  return {requestInfo, apiInfo}
}
