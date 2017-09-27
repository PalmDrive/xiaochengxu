/**
 * A logger that logs duration
 */

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
}

module.exports = Logger;