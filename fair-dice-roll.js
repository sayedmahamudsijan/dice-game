const crypto = require('crypto');
const CryptoUtils = require('./crypto-tools');
const ConsoleUI = require('./game-console');

class FairRandomGenerator {
  constructor(rangeMax, dice) {
    this.rangeMax = rangeMax;
    this.dice = dice;
  }
  async generate(label) {
    const key = CryptoUtils.generateKey();
    const compNum = crypto.randomInt(0, this.rangeMax + 1);
    const hmac = CryptoUtils.computeHMAC(key, compNum);
    console.log(`\n${label}\nHMAC=${hmac}\nPick a number (0-${this.rangeMax}):`);
    const userNum = await ConsoleUI.prompt('Your turn', Array(this.rangeMax + 1).fill().map((_, i) => i), this.dice);
    const result = (compNum + userNum) % (this.rangeMax + 1);
    console.log(`My number: ${compNum} (KEY=${key.toString('hex').toUpperCase()})\nResult: ${compNum} + ${userNum} = ${result} (mod ${this.rangeMax + 1})`);
    return result;
  }
}
module.exports = FairRandomGenerator;
