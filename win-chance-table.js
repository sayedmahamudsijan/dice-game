const AsciiTable = require('ascii-table');

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

module.exports = ProbabilityCalculator;