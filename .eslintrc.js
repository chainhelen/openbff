module.exports = {
  extends: 'standard',
  env: {
      "mocha": true,
      "node": true
  },
  rules : {
      'semi': 'error',
      'indent' : ['error', 2],
      "yoda": [2, "always", {
          "exceptRange": false,
          "onlyEquality": false
      }]       
  }
}
