var Redis = require('ioredis')
let clients = {
  redis: null
}
exports.init = (cfg) => {
  clients.redis = new Redis(cfg.redis)
}

exports.getRedisClient = () => {
  return clients.redis
}
