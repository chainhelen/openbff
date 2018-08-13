const Koa = require('koa')
const app = new Koa()
const bodyparser = require('koa-bodyparser')
const onerror = require('koa-onerror')
const bff = require('./route/bff')
const bffadmin = require('route/bffadmin')
const config = require('config')

onerror(app)

app.use(bodyparser({
  enableTypes: ['json', 'form', 'text']
}))

app.use(bff.routes(), bff.allowedMethods())
app.use(bffadmin.routes(), bffadmin.allowedMethods())

app.listen(config.port)
app.on('listen', () => {
  let addr = app.address()
  let bind = 'string' === typeof addr
    ? 'pipe ' + addr
    : 'port ' + addr.port
  console.log('Listening on ' + bind)
})
