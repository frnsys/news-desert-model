import K from 'konva';

const hexParts = [...Array(6).keys()].map((i) => {
  let angle_deg = 60 * i + 30;
  let angle_rad = Math.PI / 180 * angle_deg;
  return [Math.cos(angle_rad), Math.sin(angle_rad)];
});

function makeHex(ctx, shape) {
  let w = shape.getAttr('width')/2;
  let h = shape.getAttr('height')/2;
  let x = w;
  let y = 0;
  ctx.beginPath();
  hexParts.forEach(([xa, ya]) => {
    x = x + w * xa;
    y = y + h * ya;
    ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fillStrokeShape(shape);
}


class HexGridUI {
  constructor(stage, grid, cellSize, eventHandlers) {
    this.grid = grid;
    this.stage = stage;
    this.eventHandlers = eventHandlers;

    this.cellSize = cellSize;
    this.cellHeight = this.cellSize;
    this.cellWidth = Math.sqrt(3)/2 * this.cellHeight;
    this.width = grid.nCols * this.cellWidth;
    this.height = grid.nRows * this.cellHeight;

    this.init();
  }

  cell(pos) {
    return this.cells[this.grid.posToIdx(pos)];
  }

  blink(pos, fill) {
    let tween = new K.Tween({
      node: this.cell(pos),
      duration: 0.5,
      fill: fill,
      easing: K.Easings.EaseInOut,
      onFinish: () => {
        tween.reverse();
      }
    });
    tween.play();
  }

  showRadius(pos, r, fill) {
    let fillFn = typeof fill == 'function' ? fill : () => fill;
    this.grid.radius(pos, r).forEach((pos) => {
      let idx = this.grid.posToIdx(pos);
      let cell = this.cells[idx]
      cell.fill(fillFn(cell, pos)).draw();
    });
    let cell = this.cell(pos);
    cell.fill(fillFn(cell, pos)).draw();
  }

  init() {
    this.hex = new K.Shape({
      sceneFunc: makeHex,
      width: this.cellSize,
      height: this.cellSize,
      fill: 'blue',
      stroke: 'black',
      strokeWidth: 0.5
    });
    this.hex.cache();

    this.cells = [];
    this.layer = new K.Layer();
    let stageWidth = this.stage.attrs.width;
    let stageHeight = this.stage.attrs.height;
    let xCenterOffset = stageWidth/2 - this.width/2;
    let yCenterOffset = stageHeight/2 - this.height/2;
    this.grid.rows.forEach((r) => {
      let xOffset = r % 2 == 0 ? this.cellWidth/2 : 0;
      let y = r * (this.cellHeight*3/4) + yCenterOffset;
      this.grid.cols.forEach((c) => {
        let cell = this.hex.clone({
          x: c * this.cellWidth + xOffset + xCenterOffset,
          y: y,
        });
        cell.pos = [r, c];
        this.cells.push(cell);

        Object.keys(this.eventHandlers).forEach((ev) => {
          cell.on(ev, this.eventHandlers[ev].bind(this));
        });

        this.layer.add(cell);
      });
    });
    this.stage.add(this.layer);
  }

  draw() {
    this.layer.draw();
  }
}

export default HexGridUI;
