import K from 'konva';
import Color from 'color';
import HexGridUI from './grid';
import Tweakpane from 'tweakpane';
import interpolate from 'color-interpolate';

const tipEl = document.getElementById('tip');

const colormaps = {
  agents: interpolate(['#FFFFFF', '#0000FF']),
  wealth: interpolate(['#FFFFFF', '#9504d3']),
  values: interpolate(['#f9714f', '#FFFFFF', '#4f80f9']),
  radius: interpolate(['#ffffff', '#1e1e1e']),
  weights: interpolate(['#f4d402', '#FFFFFF', '#5702f4'])
};
const colormap2 = interpolate(['#FFFFFF', '#000000']);
const colormap3 = interpolate(['#FF0000', '#00FF00']);
const colormap4 = interpolate(['#c4fcd7', '#25ba56']);
const colormap5 = interpolate(['red', 'yellow']);

const EWMA_ALPHA = 0.7;
function ewma(val, prev) {
  return EWMA_ALPHA * val + (1 - EWMA_ALPHA) * prev;
}


class SimUI {
  constructor(sim, stageId, cellSize) {
    this.sim = sim;
    this.paused = false;
    this.cellSize = cellSize || 15;

    const stageEl = document.getElementById('stage');
    const stageWidth = stageEl.clientWidth;
    const stageHeight = stageEl.clientHeight;
    this.stage = new K.Stage({
      container: stageId,
      width: stageWidth,
      height: stageHeight
    });

    this.settings = {
      prop: 'agents',
      propOpacity: 1,
      pubs: 'none',
      pubsOpacity: 1,
      eventsOpacity: 1
    };
    this.pane = new Tweakpane();
    let but = this.pane.addButton({
      title: 'Pause'
    }).on('click', () => {
      this.paused = !this.paused;
      but.controller.view.buttonElem_.innerText = this.paused ? 'Resume' : 'Pause';
    });
    this.pane.addButton({
      title: 'Restart'
    }).on('click', () => {
      this.sim.reset();
      this.reset();
    });

    this.pane.addMonitor(this.sim, 'steps');
    let ui = this.pane.addFolder({
      title: 'UI'
    });
    ui.addInput(this.settings, 'prop', {
      options: {
        agents: 'agents',
        wealth: 'wealth',
        values: 'values'
      }
    }).on('change', (val) => {
      this.setProperty(val);
    });
    ui.addInput(this.settings, 'propOpacity', {
      min: 0,
      max: 1
    }).on('change', (val) => {
      this.grid.layer.opacity(val);
      this.grid.layer.batchDraw();
    });
    ui.addInput(this.settings, 'pubs', {
      options: {
        none: 'none',
        weights: 'weights',
        radius: 'radius'
      }
    }).on('change', (val) => {
      this.setPubProperty(val);
    });
    ui.addInput(this.settings, 'pubsOpacity', {
      min: 0,
      max: 1
    }).on('change', (val) => {
      this.publishersLayer.opacity(val);
      this.publishersLayer.batchDraw();
    });
    ui.addInput(this.settings, 'eventsOpacity', {
      min: 0,
      max: 1
    }).on('change', (val) => {
      this.eventGrid.layer.opacity(val);
      this.eventGrid.layer.batchDraw();
    });

    let params = this.pane.addFolder({
      title: 'Parameters'
    });
    Object.keys(this.sim.params).forEach((k) => {
      params.addInput(this.sim.params, k);
    });

    // Graphs
    let graphs = this.pane.addFolder({
      title: 'Graphs'
    });
    ['coverage', 'attention', 'users', 'concen', 'profit'].forEach((k) => {
      graphs.addMonitor(this.sim.stats, k, {
        view: 'graph',
        min: 0,
        max: 1
      });
    });
    graphs.addMonitor(this.sim.stats, 'publishers', {
      view: 'graph',
      min: 0,
      max: this.sim.stats['publishers']
    });
    graphs.addMonitor(this.sim.stats, 'revenue_a');
    graphs.addMonitor(this.sim.stats, 'revenue_s');

    this.reset();
  }

  reset() {
    this.stage.clear();
    this.stage.getLayers().forEach((l) => l.destroy());

    // Setup grid
    let self = this;
    let grid = this.sim.grid;
    let settings = this.settings;
    let highlightedPubs = [];
    this.grid = new HexGridUI(this.stage, grid, this.cellSize, {
      'mouseenter touchstart': function(ev) {
        let cell = ev.currentTarget;
        let c = grid.cell(cell.pos);
        if (c.publisher && !c.publisher.bankrupt) {
          let stageEl = this.stage.attrs.container;
          let x = stageEl.clientLeft + cell.attrs.x + this.cellSize;
          let y = stageEl.clientLeft + cell.attrs.y + this.cellHeight/2;
          tipEl.style.display = 'block';
          tipEl.style.left = `${x}px`;
          tipEl.style.top = `${y}px`;
          tipEl.innerHTML = `<div>
            <div>Owner:${c.publisher.owner.name}</div>
            <div>Civic:${c.publisher.owner.weights.civic.toFixed(2)}</div>
            <div>Profit:${c.publisher.owner.weights.profit.toFixed(2)}</div>
            <div>Funds:${c.publisher.funds.toFixed(0)}</div>
          </div>`;

          this.showRadius(cell.pos, c.publisher.radius, (c, pos) => {
            let pop = grid.cell(pos).agents;
            let color = colormap4(pop);
            c.baseColor = color;
            return color;
          });
          self.publishers.forEach((circ) => {
            if (circ.publisher.owner == c.publisher.owner) {
              circ.fill('black').draw();
              highlightedPubs.push(circ);
            }
          });
        }
      },
      'mouseout touchend': function(ev) {
        let cell = ev.currentTarget;
        tipEl.style.display = 'none';
        let c = grid.cell(cell.pos);
        if (c.publisher) {
          this.showRadius(cell.pos, c.publisher.radius, (cell, pos) => {
            cell.baseColor = colormaps[settings.prop](grid.cell(cell.pos)[settings.prop]);
            return cell.baseColor;
          });
          highlightedPubs.forEach((circ) => {
            circ.fill(circ.baseColor).draw();
          });
          highlightedPubs = [];
        }
      }
    });

    this.eventGrid = new HexGridUI(this.stage, grid, this.cellSize, {}, {
      padding: 4,
      fill: '#ffffff',
      // visible: false,
      listening: false,
      strokeWidth: 0.5
    });
    this.eventGrid.layer.hitGraphEnabled(false);

    // Setup publishers
    let layer = new K.Layer();
    this.publishers = this.sim.publishers.map((pub) => {
      let cell = this.grid.cell(pub.cell.pos);
      let circ = new K.Circle({
        x: cell.attrs.x + cell.attrs.width/2,
        y: cell.attrs.y + cell.attrs.height/2,
        radius: cell.attrs.width/4,
        fill: '#43CC70', //'orange',
        stroke: 'black',
        strokeWidth: 0.5,
        listening: false,
        perfectDrawEnabled: false
      });
      circ.publisher = pub;
      layer.add(circ);
      return circ;
    });
    layer.hitGraphEnabled(false);
    this.stage.add(layer);
    this.publishersLayer = layer;

    this.setProperty('agents');
    this.setPubProperty('none');
    this.grid.draw();
    this.eventGrid.draw();
  }

  setProperty(prop) {
    let grid = this.sim.grid;
    grid.rows.forEach((r) => {
      grid.cols.forEach((c) => {
        let cellUI = this.grid.cell([r, c]);
        let cell = grid.cell([r, c]);
        let color = '#000000';
        switch (prop) {
          case 'mix':
            let colorA = new Color(colormap2(cell.agents));
            let colorB = new Color(colormap3(cell.wealth));
            color = colorA.mix(colorB, 0.5).hex();
            break;
          default:
            color = colormaps[prop](cell[prop]);
        }
        cellUI.baseColor = color;
        cellUI.fill(color).draw();
      });
    });
  }

  setPubProperty(prop) {
    this.sim.publishers.forEach((pub, i) => {
      let circ = this.publishers[i];
      if (prop == 'none') {
        circ.baseColor = '#43CC70'
      } else {
        let cmap = colormaps[prop];
        if (prop == 'weights') {
          circ.baseColor = cmap(pub.owner.weights.civic);
        } else if (prop == 'radius') {
          let r = pub.radius/Math.max(this.sim.grid.nRows, this.sim.grid.nCols);
          circ.baseColor = cmap(r);
        }
      }

      circ.fill(circ.baseColor).draw();
    });
  }

  showEvents() {
    this.eventGrid.layer.clear();
    this.sim.grid.cells.forEach((c) => {
      let cell = this.eventGrid.cell(c.pos);
      if (c.event.n > 0) {
        let alive = c.publishers.filter((pub) => !pub.bankrupt);
        let p = alive.length > 0 ? c.event.reported/alive.length : 0;
        cell.p = cell.p ? ewma(p, cell.p) : p;
        cell.fill(colormap5(cell.p));
      }
      cell.draw();
    });
  }

  showPublishers() {
    this.publishersLayer.clear();
    this.sim.publishers.forEach((pub, i) => {
      if (pub.bankrupt) {
        this.publishers[i].fill('#dadada');
      }
      this.publishers[i].draw();
    });
  }

  render() {
    this.showEvents();
    this.showPublishers();
  }
}

export default SimUI;
