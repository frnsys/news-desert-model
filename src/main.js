import Sim from './model/sim';
import SimUI from './ui/sim';
import CapturedRun from './capture';

const url = new URL(window.location.href);
const rec = url.searchParams.get('record') !== null;

const tipEl = document.getElementById('tip');
const sim = new Sim(40, 40);
const ui = new SimUI(sim, 'stage', {
  panes: true,
  mouseenter: (c, pos) => {
    if (c.publisher && !c.publisher.bankrupt) {
      tipEl.style.display = 'block';
      tipEl.style.left = `${pos.x}px`;
      tipEl.style.top = `${pos.y}px`;
      tipEl.innerHTML = `<div>
        <div>Owner:${c.publisher.owner.name}</div>
        <div>Civic:${c.publisher.owner.weights.civic.toFixed(2)}</div>
        <div>Profit:${c.publisher.owner.weights.profit.toFixed(2)}</div>
        <div>Funds:${c.publisher.funds.toFixed(0)}</div>
      </div>`;
    }
  },
  mouseleave: (c) => {
   tipEl.style.display = 'none';
  }
});

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
