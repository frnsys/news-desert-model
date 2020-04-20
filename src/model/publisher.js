class Owner {
  constructor(publishers, funds) {
    this.funds = funds;
    this.publishers = publishers;
    this.name = Math.random().toString(36)
      .replace(/[^a-z]+/g, '').substr(0, 5);

    let p = Math.random();
    this.weights = {
      civic: p,
      profit: 1-p
    };
  }

  buy(publisher) {
    this.funds -= publisher.owner.funds;
    publisher.owner.publishers = publisher.owner.publishers.filter((pub) => pub != publisher);
    publisher.owner = this;
    this.publishers.push(publisher);
  }
}

class Publisher {
  constructor(cell, radius, baseFunds) {
    this.cell = cell;
    this.radius = radius;
    this.bankrupt = false;

    this.eventQueue = [];
    this.owner = new Owner([this], baseFunds);
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
      this.owner.funds -= cost;
      reported.push(story.ev);
      if (this.owner.funds < 0) break;
    }
    return reported;
  }

  reward(event, cost) {
    let cell = event.cell;
    // if (cost > this.owner.funds) return 0;
    let civic = this.owner.weights.civic * cell.agents;
    let profit = this.owner.weights.profit * (cell.agents * cell.wealth - cost);
    return civic + profit;
  }

  cost(event, baseCost) {
    return baseCost + Math.sqrt(event.cell.agents);
  }
}

export default Publisher;
