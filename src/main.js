import K from 'konva';
import Sim from './sim';
import SimUI from './ui/sim';

const stageEl = document.getElementById('stage');
const stageWidth = stageEl.clientWidth;
const stageHeight = stageEl.clientHeight;
const stage = new K.Stage({
  container: 'stage',
  width: stageWidth,
  height: stageHeight
});

const sim = new Sim(40, 40)
const ui = new SimUI(sim, stage);

function step() {
  sim.step();
  ui.showEvents();
}

setInterval(() => step(), 1000);

// window.addEventListener('resize', () => {
//   let containerWidth = stageEl.offsetWidth;
//   let scale = containerWidth / stageWidth;
//   stage.width(stageWidth * scale);
//   stage.height(stageHeight * scale);
//   stage.scale({x: scale, y: scale});
//   stage.draw();
// });
