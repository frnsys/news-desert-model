import K from 'konva';
import HexGrid from './grid';
import HexGridUI from './ui/grid';

const stageEl = document.getElementById('stage');
const stageWidth = stageEl.clientWidth;
const stageHeight = stageEl.clientHeight;
const stage = new K.Stage({
  container: 'stage',
  width: stageWidth,
  height: stageHeight
});

const grid = new HexGrid(40, 40);
const gridUI = new HexGridUI(stage, grid, 30);
gridUI.draw();
gridUI.blink([0, 0], 'yellow');

window.addEventListener('resize', () => {
  let containerWidth = stageEl.offsetWidth;
  let scale = containerWidth / stageWidth;
  stage.width(stageWidth * scale);
  stage.height(stageHeight * scale);
  stage.scale({x: scale, y: scale});
  stage.draw();
});
