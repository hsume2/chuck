module.exports = (process && process.env && process.env.CHUCK_COV)
  ? require('./lib-cov/chuck')
  : require('./lib/chuck');
