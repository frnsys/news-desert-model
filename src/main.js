import Sim from './model/sim';
import SimUI from './ui/sim';
import CapturedRun from './capture';

const url = new URL(window.location.href);
const rec = url.searchParams.get('record') !== null;

// const sim = new Sim(10, 10);
const sim = new Sim(40, 40);
const ui = new SimUI(sim, 'stage', 15);

if (rec) {
  const steps = url.searchParams.get('steps') || 100;
  const cap = new CapturedRun(sim, ui, steps);
  cap.start();
} else {
  const interval = 200;
  setInterval(() => {
    if (!ui.paused) {
      sim.step();
      ui.render();
    }
  }, interval);
}
