import K from 'konva';
import Color from 'color';
import HexGridUI from './grid';
import Tweakpane from 'tweakpane';
import interpolate from 'color-interpolate';

const tipEl = document.getElementById('tip');

const colormaps = {
  agents: interpolate(['#FFFFFF', '#0000FF']),
  wealth: interpolate(['#FFFFFF', '#9504d3']),
  values: interpolate(['#f9714f', '#FFFFFF', '#4f80f9'])
};
const colormap2 = interpolate(['#FFFFFF', '#000000']);
const colormap3 = interpolate(['#FF0000', '#00FF00']);
const colormap4 = interpolate(['#c4fcd7', '#25ba56']);
const colormap5 = interpolate(['red', 'yellow']);

class SimUI {
  constructor(sim, stageId) {
    this.sim = sim;

    const stageEl = document.getElementById('stage');
    const stageWidth = stageEl.clientWidth;
    const stageHeight = stageEl.clientHeight;
    this.stage = new K.Stage({
      container: stageId,
      width: stageWidth,
      height: stageHeight
    });

    this.settings = {
      prop: 'agents'
    };
    this.pane = new Tweakpane();
    this.pane.addInput(this.settings, 'prop', {
      options: {
        agents: 'agents',
        wealth: 'wealth',
        values: 'values'
      }
    }).on('change', (val) => {
      this.setProperty(val);
    });

    Object.keys(this.sim.params).forEach((k) => {
      this.pane.addInput(this.sim.params, k);
    });

    // Graphs
    ['coverage', 'attention', 'users', 'concen'].forEach((k) => {
      this.pane.addMonitor(this.sim.stats, k, {
        view: 'graph',
        min: 0,
        max: 1
      });
    });
    this.pane.addMonitor(this.sim.stats, 'publishers', {
      view: 'graph',
      min: 0,
      max: this.sim.stats['publishers']
    });
    this.pane.addMonitor(this.sim.stats, 'revenue_a');
    this.pane.addMonitor(this.sim.stats, 'revenue_s');

    this.init();
    this.setProperty('agents');
    this.grid.draw();
    this.eventGrid.draw();
  }

  init() {
    // Setup grid
    let self = this;
    let grid = this.sim.grid;
    let settings = this.settings;
    let highlightedPubs = [];
    this.grid = new HexGridUI(this.stage, grid, 15, {
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
            circ.fill('#43CC70').draw();
          });
          highlightedPubs = [];
        }
      }
    });

    this.eventGrid = new HexGridUI(this.stage, grid, 15, {}, {
      padding: 1.5,
      visible: false,
      listening: false,
      strokeWidth: 0
    });

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
        listening: false
      });
      circ.publisher = pub;
      layer.add(circ);
      return circ;
    });
    this.stage.add(layer);
    this.publishersLayer = layer;
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
          default:
            color = colormaps[prop](cell[prop]);
        }
        cellUI.baseColor = color;
        cellUI.fill(color).draw();
      });
    });
  }

  showEvents() {
    this.eventGrid.layer.clear();
    this.sim.grid.cells.forEach((c) => {
      let cell = this.eventGrid.cell(c.pos);
      if (c.event.n > 0) {
        cell.fill(colormap5(c.event.reported/c.publishers.length));
        cell.show();
      } else {
        cell.hide();
      }
      cell.draw();
    });
  }

  showPublishers() {
    this.publishersLayer.clear();
    this.sim.publishers.forEach((pub, i) => {
      if (pub.bankrupt) {
        this.publishers[i].hide();
      } else {
        this.publishers[i].show();
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
