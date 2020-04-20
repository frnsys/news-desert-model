import Sim from './model/sim';
import SimUI from './ui/sim';

const interval = 200;
const sim = new Sim(40, 40)
const ui = new SimUI(sim, 'stage');
setInterval(() => {
  sim.step();
  ui.render();
}, interval);
