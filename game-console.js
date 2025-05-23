const readline = require('readline');
const ProbabilityCalculator = require('./win-chance-table');

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

module.exports = ConsoleUI;