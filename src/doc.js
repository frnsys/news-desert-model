import K from 'konva';
import Sim from './model/sim';
import SimUI from './ui/sim';
import interpolate from 'color-interpolate';

let cost = 0.5;

let weights = {
  civic: 0.5,
  profit: 0.5
};
weights.profit = document.getElementById('motive').value;
weights.civic = 1 - weights.profit;

let valueRange = interpolate(['#ff0000', '#FFC106'])

function reward(cell) {
  let civic = weights.civic * cell.agents;
  let profit = weights.profit * (cell.agents * cell.wealth - cost);
  return civic + profit + cost;
}

function pointer(ui, layer, cell) {
  let c = ui.grid.cell(cell.pos);
  let circ = new K.Circle({
    x: c.attrs.x + c.attrs.width/2,
    y: c.attrs.y + c.attrs.height/2,
    radius: c.attrs.width/4,
    fill: '#E780A0',
    stroke: 'black',
    strokeWidth: 0.5,
    listening: false,
    perfectDrawEnabled: false
  });

  layer.add(circ);
  layer.draw();
}

function generate() {
  const sim = new Sim(20, 20);
  const ui_1 = new SimUI(sim, 'stage-1', {
    cellSize: 15,
    pubsOpacity: 0,
    eventsOpacity: 0,
    showRadius: false,
    prop: 'agents'
  });
  const ui_2 = new SimUI(sim, 'stage-2', {
    cellSize: 15,
    pubsOpacity: 0,
    eventsOpacity: 0,
    showRadius: false,
    prop: 'wealth'
  });
  const ui_3 = new SimUI(sim, 'stage-3', {
    cellSize: 15,
    pubsOpacity: 1,
    eventsOpacity: 0,
    prop: 'agents'
  });
  const ui_4 = new SimUI(sim, 'stage-4', {
    cellSize: 15,
    pubsOpacity: 1,
    eventsOpacity: 0,
    prop: 'agents',
    pubs: 'weights'
  });

  const showPointer = (cell) => {
    document.getElementById('cell-value').innerText = reward(cell).toFixed(2);

    pointer(ui_5, hover_layer_1, cell);
    pointer(ui_6, hover_layer_2, cell);
    pointer(ui_7, hover_layer_3, cell);
  };
  const clearPointer = (cell) => {
    hover_layer_1.removeChildren();
    hover_layer_2.removeChildren();
    hover_layer_3.removeChildren();
    hover_layer_1.draw();
    hover_layer_2.draw();
    hover_layer_3.draw();
  };

  const ui_5 = new SimUI(sim, 'stage-5', {
    cellSize: 12,
    pubsOpacity: 0,
    eventsOpacity: 0,
    prop: 'agents',
    showRadius: false,
    mouseenter: showPointer,
    mouseleave: clearPointer
  });
  const hover_layer_1 = new K.Layer();
  ui_5.stage.add(hover_layer_1);

  const ui_6 = new SimUI(sim, 'stage-6', {
    cellSize: 12,
    pubsOpacity: 0,
    eventsOpacity: 0,
    prop: 'wealth',
    showRadius: false,
    mouseenter: showPointer,
    mouseleave: clearPointer
  });
  const hover_layer_2 = new K.Layer();
  ui_6.stage.add(hover_layer_2);

  let colorByValue = (cell) => {
    return valueRange(reward(cell));
  };
  const ui_7 = new SimUI(sim, 'stage-7', {
    cellSize: 12,
    pubsOpacity: 0,
    eventsOpacity: 0,
    prop: colorByValue,
    showRadius: false,
    mouseenter: showPointer,
    mouseleave: clearPointer
  });
  const hover_layer_3 = new K.Layer();
  ui_7.stage.add(hover_layer_3);

  document.getElementById('motive').addEventListener('input', (ev) => {
    weights.profit = ev.target.value;
    weights.civic = 1 - weights.profit;
    ui_7.setProperty(colorByValue);
  });
}

[...document.querySelectorAll('.reset-button')].forEach((b) => {
  b.addEventListener('click', () => {
    [...document.querySelectorAll('.stage')].forEach((s) => {
      s.innerHTML = '';
    });
    generate();
  });
});

generate();
