const FairRandomGenerator = require('./fair-dice-roll');
const CryptoUtils = require('./crypto-tools');
const ConsoleUI = require('./game-console');

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

module.exports = Game;