const crypto = require('crypto');
const readline = require('readline');
const AsciiTable = require('ascii-table');

// Simple die representation
class Die {
  constructor(faces) {
    this.faces = faces;
  }
  getFace(index) {
    return this.faces[index];
  }
  toString() {
    return this.faces.join(',');
  }
}

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

class CryptoUtils {
  static generateKey() {
    return crypto.randomBytes(32);
  }
  static generateRandomInt(max) {
    return crypto.randomBytes(4).readUInt32BE(0) % (max + 1);
  }
  static computeHMAC(key, number) {
    return crypto.createHmac('sha3-256', key).update(String(number)).digest('hex').toUpperCase();
  }
}

class ConsoleUI {
  static rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  
  static async prompt(message, options, dice) {
    console.log(`\n${message}\n  ${options.map((opt, i) => `${i} - ${opt}`).join('\n  ')}\n  X - exit\n  ? - help`);
    const input = await new Promise(resolve => this.rl.question('Your choice: ', resolve));
    if (input.toLowerCase() === 'x') { this.rl.close(); process.exit(0); }
    if (input === '?') {
      console.log('\nProbability of the win for the user:\n', ProbabilityCalculator.generateTable(dice));
      return this.prompt(message, options, dice);
    }
    const choice = parseInt(input);
    if (isNaN(choice) || choice < 0 || choice >= options.length) {
      console.log('Invalid choice. Try again.');
      return this.prompt(message, options, dice);
    }
    return choice;
  }
  static close() {
    this.rl.close();
  }
}

class FairRandomGenerator {
  constructor(rangeMax, dice) {
    this.rangeMax = rangeMax;
    this.dice = dice;
  }
  async generate(label) {
    const key = CryptoUtils.generateKey();
    const compNum = CryptoUtils.generateRandomInt(this.rangeMax);
    const hmac = CryptoUtils.computeHMAC(key, compNum);
    console.log(`\n${label}\nHMAC=${hmac}\nPick a number (0-${this.rangeMax}):`);
    const userNum = await ConsoleUI.prompt('Your turn', Array(this.rangeMax + 1).fill().map((_, i) => i), this.dice);
    const result = (compNum + userNum) % (this.rangeMax + 1);
    console.log(`My number: ${compNum} (KEY=${key.toString('hex').toUpperCase()})\nResult: ${compNum} + ${userNum} = ${result} (mod ${this.rangeMax + 1})`);
    return result;
  }
}

class ProbabilityCalculator {
  static calculateWinProbability(die1, die2) {
    const wins = die1.faces.flatMap(x => die2.faces.map(y => x > y)).filter(Boolean).length;
    const total = die1.faces.length * die2.faces.length;
    return (wins / total).toFixed(4);
  }
  static generateTable(dice) {
    const table = new AsciiTable('Probability of the win for the user');
    table.setHeading('User dice v', ...dice.map(die => die.toString()));
    dice.forEach((rowDie, i) => {
      table.addRow(rowDie.toString(), ...dice.map((colDie, j) => i === j ? '- (0.3333)' : this.calculateWinProbability(rowDie, colDie)));
    });
    return table.toString();
  }
}

class Game {
  constructor(dice) {
    this.dice = dice;
    this.availableDice = [...dice];
    this.userDie = null;
    this.computerDie = null;
  }
  async determineFirstMover() {
    console.log('\n=== Decide Who Goes First ===');
    return (await new FairRandomGenerator(1, this.dice).generate('First move')) === 0;
  }
  async selectDice(isUserFirst) {
    const options = () => this.availableDice.map(die => die.toString());
    if (isUserFirst) {
      const userChoice = await ConsoleUI.prompt('Pick your die:', options(), this.dice);
      this.userDie = this.availableDice.splice(userChoice, 1)[0];
      this.computerDie = this.availableDice.splice(CryptoUtils.generateRandomInt(this.availableDice.length), 1)[0];
      console.log(`You chose [${this.userDie}]. I take [${this.computerDie}].`);
    } else {
      this.computerDie = this.availableDice.splice(CryptoUtils.generateRandomInt(this.availableDice.length), 1)[0];
      console.log(`\nI pick [${this.computerDie}]`);
      const userChoice = await ConsoleUI.prompt('Pick your die:', options(), this.dice);
      this.userDie = this.availableDice[userChoice];
    }
  }
  async rollDice() {
    console.log('\n=== Rolling Dice ===');
    const roll = async (player, die) => die.getFace(await new FairRandomGenerator(5, this.dice).generate(`${player} roll`));
    const computerResult = await roll('My', this.computerDie);
    const userResult = await roll('Your', this.userDie);
    console.log(`I rolled: ${computerResult}\nYou rolled: ${userResult}`);
    return { computerResult, userResult };
  }
  determineWinner(computerResult, userResult) {
    const result = userResult > computerResult ? 'You win!' : computerResult > userResult ? 'I win!' : 'Tie!';
    console.log(`\n${result} (${userResult} vs ${computerResult})`);
  }
  async play() {
    try {
      const isUserFirst = await this.determineFirstMover();
      await this.selectDice(isUserFirst);
      const { computerResult, userResult } = await this.rollDice();
      this.determineWinner(computerResult, userResult);
    } catch (e) {
      console.error('Error:', e.message);
    } finally {
      ConsoleUI.close();
    }
  }
}


try {
  const dice = DiceParser.parse(process.argv.slice(2));
  new Game(dice).play();
} catch (e) {
  console.error('Error:', e.message);
  process.exit(1); 
}
