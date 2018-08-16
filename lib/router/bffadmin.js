const router = require('koa-router')()

router.prefix('/bff')

router.post('/', async (ctx, next) => {
  ctx.body = 'Not implemented'
})

module.exports = router
