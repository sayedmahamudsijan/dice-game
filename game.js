const Die = require('./dice-unit');
const DiceParser = require('./dice-reader');
const CryptoUtils = require('./crypto-tools');
const ConsoleUI = require('./game-console');
const FairRandomGenerator = require('./fair-dice-roll');
const ProbabilityCalculator = require('./win-chance-table');
const Game = require('./dice-game-core');

try {
  const dice = DiceParser.parse(process.argv.slice(2));
  new Game(dice).play();
} catch (e) {
  console.error('Error:', e.message);
  process.exit(1);
}