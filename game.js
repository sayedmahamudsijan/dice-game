const crypto = require('crypto');
const readline = require('readline');
const AsciiTable = require('ascii-table');

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
    if (args.length < 3) {
      throw new Error('At least 3 dice are required. Example: node game.js 2,2,4,4,9,9 6,8,1,1,8,6 7,5,3,7,5,3');
    }
    const dice = args.map((arg, index) => {
      const faces = arg.split(',').map(num => {
        const parsed = parseInt(num, 10);
        if (isNaN(parsed)) {
          throw new Error(`Invalid integer in die ${index + 1}: "${num}". Use comma-separated integers.`);
        }
        return parsed;
      });
      if (faces.length !== 6) {
        throw new Error(`Die ${index + 1} must have exactly 6 faces, got ${faces.length}.`);
      }
      return new Die(faces);
    });
    return dice;
  }
}

class CryptoUtils {
  static generateKey() {
    return crypto.randomBytes(32);
  }

  static generateRandomInt(max) {
    const bytes = crypto.randomBytes(4);
    const num = bytes.readUInt32BE(0) % (max + 1);
    return num;
  }

  static computeHMAC(key, number) {
    return crypto.createHmac('sha3-256', key)
                 .update(number.toString())
                 .digest('hex')
                 .toUpperCase();
  }
}

class ConsoleUI {
  static rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  static async promptNumber(rangeMax, message, dice) {
    console.log(`\n${message}`);
    for (let i = 0; i <= rangeMax; i++) console.log(`  ${i}`);
    console.log('  X - exit');
    console.log('  ? - help');

    const userInput = await new Promise(resolve => {
      this.rl.question('Your choice: ', resolve);
    });
    if (userInput.toLowerCase() === 'x') {
      this.rl.close();
      process.exit(0);
    }
    if (userInput === '?') {
      console.log('\nProbability of the win for the user:');
      console.log(ProbabilityCalculator.generateTable(dice));
      return this.promptNumber(rangeMax, message, dice);
    }
    const userNum = parseInt(userInput);
    if (isNaN(userNum) || userNum < 0 || userNum > rangeMax) {
      console.log(`Invalid input. Please enter a number between 0 and ${rangeMax}.`);
      return this.promptNumber(rangeMax, message, dice);
    }
    return userNum;
  }

  static async promptChoice(options, message, dice) {
    const choiceOptions = options.map((opt, i) => `${i} - ${opt}`).join('\n  ');
    console.log(`${message}\n  ${choiceOptions}\n  X - exit\n  ? - help`);
    const userInput = await new Promise(resolve => {
      this.rl.question('Your choice: ', resolve);
    });
    if (userInput.toLowerCase() === 'x') {
      this.rl.close();
      process.exit(0);
    }
    if (userInput === '?') {
      console.log('\nProbability of the win for the user:');
      console.log(ProbabilityCalculator.generateTable(dice));
      return this.promptChoice(options, message, dice);
    }
    const choice = parseInt(userInput);
    if (isNaN(choice) || choice < 0 || choice >= options.length) {
      console.log('Invalid choice. Please select a number from the list.');
      return this.promptChoice(options, message, dice);
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
    const computerNum = CryptoUtils.generateRandomInt(this.rangeMax);
    const hmac = CryptoUtils.computeHMAC(key, computerNum);
    console.log(`\n${label}`);
    console.log(`I selected a random value in the range 0..${this.rangeMax} (HMAC=${hmac}).`);
    const userNum = await ConsoleUI.promptNumber(this.rangeMax, 'Now enter your number to combine:', this.dice);
    const result = (computerNum + userNum) % (this.rangeMax + 1);
    console.log(`My number is ${computerNum} (KEY=${key.toString('hex').toUpperCase()}).`);
    console.log(`The fair number generation result is ${computerNum} + ${userNum} = ${result} (mod ${this.rangeMax + 1}).`);
    return result;
  }
}

class ProbabilityCalculator {
  static calculateWinProbability(die1, die2) {
    let wins = 0;
    const total = 36;
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 6; j++) {
        if (die1.getFace(i) > die2.getFace(j)) wins++;
      }
    }
    return (wins / total).toFixed(4);
  }

  static generateTable(dice) {
    const table = new AsciiTable('Probability of the win for the user');
    table.setHeading('User dice v', ...dice.map(die => die.toString()));
    dice.forEach((rowDie, i) => {
      const row = [rowDie.toString()];
      dice.forEach((colDie, j) => {
        row.push(i === j ? '- (0.3333)' : this.calculateWinProbability(rowDie, colDie));
      });
      table.addRow(...row);
    });
    return table.toString();
  }
}

class Game {
  constructor(dice) {
    this.dice = dice;
    this.availableDice = [...dice];
    this.computerDie = null;
    this.userDie = null;
  }

  async determineFirstMover() {
    console.log('\n=== Decide Who Goes First ===');
    const generator = new FairRandomGenerator(1, this.dice);
    const result = await generator.generate('Determining first move');
    return result === 0;
  }

  async selectDice(isUserFirst) {
    const options = this.availableDice.map(die => die.toString());
    if (isUserFirst) {
      const userChoice = await ConsoleUI.promptChoice(options, 'Pick your die:', this.dice);
      this.userDie = this.availableDice[userChoice];
      this.availableDice.splice(userChoice, 1);
      const computerChoice = Math.floor(CryptoUtils.generateRandomInt(this.availableDice.length));
      this.computerDie = this.availableDice[computerChoice];
      console.log(`You chose [${this.userDie.toString()}]. I take [${this.computerDie.toString()}].`);
      this.availableDice.splice(computerChoice, 1);
    } else {
      const computerChoice = Math.floor(CryptoUtils.generateRandomInt(this.availableDice.length));
      this.computerDie = this.availableDice[computerChoice];
      console.log('\nI pick [' + this.computerDie.toString() + '].');
      this.availableDice.splice(computerChoice, 1);
      const userChoice = await ConsoleUI.promptChoice(this.availableDice.map(die => die.toString()), 'Pick your die:', this.dice);
      this.userDie = this.availableDice[userChoice];
      console.log(`You chose [${this.userDie.toString()}].`);
    }
  }

  async rollDice() {
    console.log('\n=== Rolling Dice ===');
    const computerRollGenerator = new FairRandomGenerator(5, this.dice);
    const computerIndex = await computerRollGenerator.generate('My roll');
    const computerResult = this.computerDie.getFace(computerIndex);

    const userRollGenerator = new FairRandomGenerator(5, this.dice);
    const userIndex = await userRollGenerator.generate('Your roll');
    const userResult = this.userDie.getFace(userIndex);

    console.log(`I rolled: ${computerResult}`);
    console.log(`You rolled: ${userResult}`);
    return { computerResult, userResult };
  }

  determineWinner(computerResult, userResult) {
    if (userResult > computerResult) {
      console.log('\n🎉 You win! (' + userResult + ' > ' + computerResult + ')');
    } else if (computerResult > userResult) {
      console.log('\n😈 I win! (' + computerResult + ' > ' + userResult + ')');
    } else {
      console.log('\n🤝 It\'s a tie! (' + computerResult + ' = ' + userResult + ')');
    }
  }

  async play() {
    try {
      const isUserFirst = await this.determineFirstMover();
      await this.selectDice(isUserFirst);
      const { computerResult, userResult } = await this.rollDice();
      this.determineWinner(computerResult, userResult);
    } catch (error) {
      console.error('Error: ' + error.message);
      process.exit(1);
    } finally {
      ConsoleUI.close();
    }
  }
}

const args = process.argv.slice(2);
try {
  const dice = DiceParser.parse(args);
  const game = new Game(dice);
  game.play();
} catch (error) {
  console.error('Error: ' + error.message);
}