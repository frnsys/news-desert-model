class Publisher {
  constructor(cell, radius, baseFunds) {
    this.cell = cell;
    this.radius = radius;
    this.weights = {
      civic: Math.random(),
      profit: Math.random()
    };
    this.funds = baseFunds;
    this.eventQueue = [];
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

      let cost = story.cost;
      if (cost < this.funds) {
        this.funds -= cost;
        reported.push(story.ev);
      }
    }
    return reported;
  }

  reward(event, cost) {
    let cell = event.cell;
    if (cost > this.funds) return 0;
    let civic = this.weights.civic * cell.agents;
    let profit = this.weights.profit * (cell.agents * cell.wealth - cost);
    return civic + profit;
  }

  cost(event, baseCost) {
    return baseCost + Math.sqrt(event.cell.agents);
  }
}

export default Publisher;
