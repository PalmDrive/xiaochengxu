/**
 * A logger that logs duration
 */
const AV = require('av-weapp-min'),
      Exception = AV.Object.extend('Exception');

class Logger {
  constructor () {
    this.time = +new Date();
    this.enabled = true;
  }

  log() {
    if (!this.enabled) return;

    const now = +new Date(),
        deltaT = now - this.time,
        args = [].slice.call(arguments);

    this.time = now;
    
    console.log.apply(null, args);
    console.log(`spent ${deltaT}ms`);
  }

  disabled() {
    this.enabled = false;
  }

  sendException(err, options) {
    const exp = new Exception();
    exp.set('message', JSON.stringify(err));
    exp.set('options', JSON.stringify(options));
    exp.save();
  }
}

module.exports = Logger;