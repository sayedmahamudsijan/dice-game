const Die = require('./dice-unit');

class DiceParser {
  static parse(args) {
    if (args.length < 3) throw new Error('At least 3 dice required. Example: node game.js 2,2,4,4,9,9 6,8,1,1,8,6 7,5,3,7,5,3');
    return args.map((arg, i) => {
      const faces = arg.split(',').map(num => {
        const parsed = parseInt(num, 10);
        if (isNaN(parsed)) throw new Error(`Invalid integer in die ${i + 1}: "${num}"`);
        return parsed;
      });
      if (faces.length !== 6) throw new Error(`Die ${i + 1} must have 6 faces, got ${faces.length}`);
      return new Die(faces);
    });
  }
}

module.exports = DiceParser;