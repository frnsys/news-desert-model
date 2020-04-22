class Owner {
  constructor(publishers, rng) {
    this.publishers = publishers;
    this.name = rng().toString(36)
      .replace(/[^a-z]+/g, '').substr(0, 5);

    let p = rng();
    this.weights = {
      civic: p,
      profit: 1-p
    };
    this.funds = 0;
  }

  buy(publisher, cost) {
    this.funds -= cost;
    publisher.owner.publishers = publisher.owner.publishers.filter((pub) => pub != publisher);
    publisher.owner = this;
    this.publishers.push(publisher);
  }
}

class Publisher {
  constructor(cell, radius, baseFunds, rng) {
    this.cell = cell;
    this.radius = radius;
    this.funds = baseFunds;
    this.bankrupt = false;

    this.eventQueue = [];
    this.owner = new Owner([this], rng);
  }

  report(events, params) {
    let sorted = events.map((ev) => {
      let cost = this.cost(ev, params.baseCost);
      let reward = this.reward(ev, cost);
      return {ev, cost, reward};
    }).sort((a, b) => {
      return b.reward - a.reward;
    });

    let reported = [];
    for (let i=0; i<sorted.length; i++) {
      let story = sorted[i];
      if (story.reward == 0) break;

      let cost = story.cost * story.ev.n;
      this.funds -= cost;
      reported.push(story.ev);
      if (this.funds < 0) break;
    }
    return reported;
  }

  reward(event, cost) {
    let cell = event.cell;
    // if (cost > this.funds) return 0;
    let civic = this.owner.weights.civic * cell.agents;
    let profit = this.owner.weights.profit * (cell.agents * cell.wealth - cost);
    return civic + profit;
  }

  cost(event, baseCost) {
    return baseCost + Math.sqrt(event.cell.agents);
  }
}

export default Publisher;
