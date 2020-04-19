import HexGrid from './grid';
import Publisher from './publisher';
import {Noise} from 'noisejs';
import Prob from 'prob.js';

class Sim {
  constructor(rows, cols) {
    this.grid = new HexGrid(rows, cols);
    this.params = {
      baseFunds: 10
    };
    this.init();
  }

  init() {
    // Initialize cells
    let generators = ['agents', 'wealth', 'values'].reduce((acc, k) => {
      acc[k] = new Noise(Math.random());
      return acc;
    }, {});
    this.grid.cells.forEach((cell) => {
      let [r, c] = cell.pos;
      Object.keys(generators).forEach((k) => {
        cell[k] = Math.max(0.1, generators[k].simplex2(r/10, c/10));
      });
      cell.eventGenerator = Prob.poisson(cell.agents);
      cell.publishers = [];
    });

    // Initialize publishers
    this.publishers = [];
    this.grid.cells.forEach((cell) => {
      if (Math.random() < cell.agents**2) {
        let r = cell.agents * Math.random();
        r = Math.ceil(Math.max(this.grid.nRows, this.grid.nCols) * r);
        cell.publisher = new Publisher(cell, r, this.params.baseFunds);
        this.grid.radius(cell.pos, r).forEach((pos) => {
          this.grid.cell(pos).publishers.push(cell.publisher);
        });
        this.publishers.push(cell.publisher);
      }
    });
  }

  step() {
    // Generate events
    this.grid.cells.forEach((cell) => {
      cell.events = cell.eventGenerator();
      if (cell.events > 0) {
        cell.publishers.forEach((pub) => {
          pub.eventQueue.push({ cell });
        });
      }
    });

    // publishers.forEach((pub, i) => {
    //   let reported = pub.report(pub.eventQueue, {
    //     baseCost: 1
    //   });
    //   pub.eventQueue = [];
    // });
  }
}

export default Sim;
