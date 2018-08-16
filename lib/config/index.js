let config = {
  addr: '0.0.0.0',
  port: 3000,
  redis: 'redis://:@127.0.0.1:6379/0'
}

exports.setConfig = (options) => {
  if ('[object Object]' !== Object.prototype.toString.apply(options)) {
    throw new Error(`The param of Config should be Object`)
  }
  for (let i in options) {
    if (!options.hasOwnProperty(i)) {
      continue
    }
    if (config.hasOwnProperty(i)) {
      config[i] = options[i]
    }
  }
}

exports.cfg = config
