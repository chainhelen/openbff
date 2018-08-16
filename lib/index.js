const Koa = require('koa')
const app = new Koa()
const config = require('./config/index')
const bodyparser = require('koa-bodyparser')
const onerror = require('koa-onerror')
const bffrouter = require('./router/bff')
const bffadminrouter = require('./router/bffadmin')
const clients = require('./client/index')

onerror(app)

app.use(bodyparser({
  enableTypes: ['json', 'form', 'text']
}))

app.use(bffrouter.routes(), bffrouter.allowedMethods())
app.use(bffadminrouter.routes(), bffadminrouter.allowedMethods())

let bff = {}
bff.setConfig = config.setConfig

bff.start = () => {
  let cfg = config.cfg
  clients.init(cfg)

  app.listen(cfg.port, cfg.addr)
  console.log(`Bff listen on ${cfg.addr} ${cfg.port}`)
}

module.exports = bff
