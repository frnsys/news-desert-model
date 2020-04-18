const ODD_ADJACENT_POSITIONS = [
    [-1,  0], // upper left
    [-1,  1], // upper right
    [ 0, -1], // left
    [ 0,  1], // right
    [ 1,  0], // bottom left
    [ 1,  1], // bottom right
];

const EVEN_ADJACENT_POSITIONS = [
    [-1, -1], // upper left
    [-1,  0], // upper right
    [ 0, -1], // left
    [ 0,  1], // right
    [ 1, -1], // bottom left
    [ 1,  0], // bottom right
];

class HexGrid {
  constructor(nRows, nCols) {
    this.nRows = nRows;
    this.nCols = nCols;
    this.cells = [];
  }

  posToIdx([r, c]) {
    return r * this.nCols + c;
  }

  setCell(pos, val) {
    this.cells[this.posToIdx(pos)] = val;
  }

  getCell(pos) {
    return this.cells[this.posToIdx(pos)];
  }

  get rows() {
    return [...Array(this.nRows).keys()];
  }

  get cols() {
    return [...Array(this.nCols).keys()];
  }

  filterBounds(pos) {
    return pos[0] >= 0 && pos[0] < this.nRows &&
      pos[1] >= 0 && pos[1] < this.nCols;
  }

  adjacent(pos) {
    const shifts = pos[0] % 2 == 1 ? EVEN_ADJACENT_POSITIONS : ODD_ADJACENT_POSITIONS;
    return shifts.map((shift) => [pos[0] + shift[0], pos[1] + shift[1]]).filter((pos) => this.filterBounds(pos));
  }

  // Positions within a radius of the specified position
  radius(pos, r) {
    let [R, C] = pos;
    let rStart = R-r;
    let d = 2*r+1;
    let neighbs = [];

    [...new Array(d).keys()].forEach((i) => {
      let row = rStart + i;
      if (row >= 0 && row < this.nRows) {
        let nCells = d - Math.abs(r-i);
        let offset = row % 2 == 0 || R % 2 == 1 ? 0 : 1;
        let cStart = C - Math.floor(nCells/2) + offset;
        [...new Array(nCells).keys()].forEach((j) => {
          let col = cStart + j;
          if (col >= 0 && col < this.nCols) {
            neighbs.push([row, col]);
          }
        });
      }
    });
    return neighbs;
  }
}

export default HexGrid;
