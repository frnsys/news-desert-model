import HexGrid from './grid';
import Publisher from './publisher';
import {Noise} from 'noisejs';
import Prob from 'prob.js';
import seedrandom from 'seedrandom';

class Sim {
  constructor(rows, cols, seed) {
    this.size = [rows, cols];
    this.seed = seed || Math.random();
    this.params = {
      subsidy: 0,
      baseFunds: 5000,
      baseCost: 2,
      dataPerUser: 0.01,
      subRate: 0.1,
      revenuePerAd: 1000,
      revenuePerSub: 100,
      platformGrowth: 1.01,
      ownerRevenueShare: 0.1,
      valuationMultiplier: 2,
      ownershipLimit: 0.1,
      economy: 1
    };

    this.reset();
  }

  reset() {
    this.rng = seedrandom(this.seed);

    this.steps = 0;
    this.stats = {
      revenue_s: 0,
      revenue_a: 0,
      attention: 0,
      users: 0,
      concen: 0,
      publishers: 0,
      profit: 0
    };

    this.grid = new HexGrid(...this.size);

    // Initialize cells
    let generators = ['agents', 'wealth'].reduce((acc, k) => {
      acc[k] = new Noise(this.rng());
      return acc;
    }, {});
    generators['values'] = Prob.normal(0.5, 0.1);
    this.grid.cells.forEach((cell) => {
      let [r, c] = cell.pos;
      Object.keys(generators).forEach((k) => {
        if (k == 'values') {
          cell[k] = Math.max(0, Math.min(1, generators[k]()));
        } else {
          cell[k] = Math.max(0.1, generators[k].simplex2(r/10, c/10));
        }
      });
      cell.eventGenerator = Prob.poisson(cell.agents);
      cell.publishers = [];
    });

    // Initialize publishers
    this.publishers = [];
    this.grid.cells.forEach((cell) => {
      if (this.rng() < (cell.agents**2 + cell.wealth**2)/2) {
        let r = cell.agents * this.rng();
        r = Math.ceil(Math.max(this.grid.nRows, this.grid.nCols) * r);
        let funds = this.params.baseFunds * cell.agents * (1 + cell.wealth);
        cell.publisher = new Publisher(cell, r, funds, this.rng);
        let area = this.grid.radius(cell.pos, r).map((pos) => this.grid.cell(pos));
        area.forEach((c) => {
          c.publishers.push(cell.publisher);
        });

        cell.publisher.cells = area;
        cell.publisher.value = area.reduce((acc, cell) => acc + cell.agents * cell.wealth, 0);

        this.publishers.push(cell.publisher);
      }
    });
    this.owners = this.publishers.map((pub) => pub.owner);
    this.stats.publishers = this.publishers.length;

    // Initialize platforms
    this.platforms = {
      users: 2, // Need at least 2 users for growth
      data: 0
    };

    this.population = this.grid.cells.reduce((acc, cell) => acc + cell.agents, 0);
  }

  step() {
    this.steps += 1;
    this.stats.revenue_a = 0;
    this.stats.revenue_s = 0;
    this.stats.attention = 0;

    // Generate events
    this.grid.cells.forEach((cell) => {
      let nEvents = cell.eventGenerator();
      cell.event = {
        cell: cell,
        reported: 0,
        n: nEvents
      };
      if (nEvents > 0) {
        cell.publishers.forEach((pub) => {
          pub.eventQueue.push(cell.event);
        });
      }
    });

    // Publishers report on events
    this.publishers.forEach((pub, i) => {
      pub.funds += this.params.subsidy;
      pub.covered = new Set();
      if (!pub.bankrupt) {
        let reported = pub.report(pub.eventQueue, this.params);
        reported.forEach((event) => {
          event.reported += 1;
          pub.covered.add(event.cell);
        });
      }
      pub.covered = [...pub.covered];
      pub.eventQueue = [];
    });

    // Advertisers buy ads
    this.grid.cells.forEach((cell) => {
      let ads = this.params.revenuePerAd * cell.wealth * cell.agents * this.params.economy;
      let covered = cell.publishers.filter((pub) => pub.covered.includes(cell));
      let z = covered.length + this.platforms.data;
      covered.forEach((pub) => {
        let adRevenue = ads/z;
        this.stats.revenue_a += adRevenue;

        // Subscribers
        let subscriberRevenue = (cell.agents * cell.wealth)/covered.length * this.params.subRate * this.params.revenuePerSub * this.params.economy;
        this.stats.revenue_s += subscriberRevenue;

        let revenue = adRevenue + subscriberRevenue;
        pub.funds += (1-this.params.ownerRevenueShare) * revenue;
        pub.owner.funds += this.params.ownerRevenueShare * revenue;
      });

      this.stats.attention += covered.length/cell.publishers.length;
    });

    // Platform growth
    this.platforms.users = Math.min(this.population, this.platforms.users**this.params.platformGrowth);
    this.platforms.data += (this.platforms.users**2) * this.params.dataPerUser;

    // Bankruptcies
    this.publishers.forEach((pub) => {
      if (!pub.bankrupt && pub.funds < 0) {
        pub.bankrupt = true;
        this.stats.publishers -= 1;
      }
    });

    // Consolidation
    let profitOwners = this.owners.filter((own) => own.weights.profit > own.weights.civic);
    profitOwners.sort(() => this.rng() - 0.5);
    let alive = this.publishers.filter((pub) => !pub.bankrupt);
    alive.sort((a, b) => b.civic - a.civic);
    let bought = new Set();
    profitOwners.forEach((own) => {
      if (own.publishers.length/alive >= this.params.ownershipLimit) return;

      alive.forEach((pub) => {
        if (pub.owner == own) return;
        if (bought.has(pub)) return;

        let cost = Math.max(0, pub.funds) * this.params.valuationMultiplier * this.params.economy;
        if (cost < own.funds) {
          own.buy(pub, cost);
          bought.add(pub);
        }
      });
    });

    this.stats.users = this.platforms.users/this.population;
    this.stats.attention /= this.grid.cells.length;
    this.stats.profit = alive.reduce((acc, pub) => acc + pub.owner.weights.profit, 0)/alive.length
    this.stats.concen = 1-this.owners.length/alive.length;
    return this.stats;
  }
}

export default Sim;
