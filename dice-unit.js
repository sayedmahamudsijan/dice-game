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

module.exports = Die;