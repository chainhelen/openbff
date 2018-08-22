const router = require('koa-router')()
const tool = require('../tool/index')
const httpStatus = require('http-status')

router.prefix('/bff')

router.post('/', async (ctx, next) => {
  let needFlag = tool.supportCORSOptions(ctx.req)
  if (true === needFlag) {
    ctx.setHeader('Access-Control-Allow-Origin', '*')
    ctx.setHeader('Access-Control-Allow-Methods', '*')
    ctx.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    if (ctx.method && 'OPTIONS' === ctx.method.toUpperCase()) {
      return
    }
  }
  let errMsgJson
  errMsgJson = tool.checkBffParam(ctx)
  if (null !== errMsgJson) {
    ctx.status = httpStatus.BAD_REQUEST
    ctx.body = errMsgJson
    return
  }
  errMsgJson = tool.checkPackPath(ctx)
  if (null != errMsgJson) {
    ctx.status = httpStatus.BAD_GATEWAY
    ctx.body = errMsgJson
    return
  }
  tool.bindHookHanlder(ctx)
  try {
    ctx.body = await tool.process(ctx)
  } catch (err) {
    ctx.status = httpStatus.INTERNAL_SERVER_ERROR
    ctx.body = {
      '$bff_reply': [{
        err: httpStatus.INTERNAL_SERVER_ERROR,
        msg: err.message
      }]
    }
  }
})

module.exports = router
