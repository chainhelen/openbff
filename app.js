const Koa = require('koa')
const app = new Koa()
const bodyparser = require('koa-bodyparser')
const onerror = require('koa-onerror')
const bff = require('./router/bff')
const bffadmin = require('./router/bffadmin')

onerror(app)

app.use(bodyparser({
  enableTypes: ['json', 'form', 'text']
}))

app.use(bff.routes(), bff.allowedMethods())
app.use(bffadmin.routes(), bffadmin.allowedMethods())

// todo hardcode
const server = app.listen(3000)
let addr = server.address()
let bind = 'string' === typeof addr
  ? 'pipe ' + addr
  : 'port ' + addr.port
console.log('Listening on ' + bind)
