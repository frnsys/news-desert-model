import K from 'konva';

const tipEl = document.getElementById('tip');

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
  constructor(stage, grid, cellSize) {
    this.grid = grid;
    this.stage = stage;
    this.cellSize = cellSize;
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

  showRadius(pos, r, areaFill, focusFill) {
    focusFill = focusFill || areaFill;
    let idxs = this.grid.radius(pos, r).map((pos) => this.grid.posToIdx(pos));
    idxs.forEach((idx) => {
      this.cells[idx].fill(areaFill).draw();
    });
    this.cell(pos).fill(focusFill).draw();
  }

  init() {
    const cellSize = this.cellSize/2;
    const cellHeight = this.cellSize;
    const cellWidth = Math.sqrt(3)/2 * cellHeight;

    this.hex = new K.Shape({
      sceneFunc: makeHex,
      width: this.cellSize,
      height: this.cellSize,
      fill: 'blue',
      stroke: 'black',
      strokeWidth: 1
    });
    this.hex.cache();

    this.cells = [];
    this.layer = new K.Layer();
    this.grid.rows.forEach((r) => {
      let xOffset = r % 2 == 0 ? cellWidth/2 : 0;
      let y = r * (cellHeight*3/4);
      this.grid.cols.forEach((c) => {
        let cell = this.hex.clone({
          x: c * cellWidth + xOffset,
          y: y,
        });
        this.cells.push(cell);

        cell.on('mouseenter touchstart', () => {
          let stageEl = this.stage.attrs.container;
          let x = stageEl.clientLeft + cell.attrs.x + this.cellSize;
          let y = stageEl.clientLeft + cell.attrs.y + cellHeight/2;
          tipEl.style.display = 'block';
          tipEl.style.left = `${x}px`;
          tipEl.style.top = `${y}px`;
          tipEl.innerText = 'testing';
          this.showRadius([r,c], 8, 'yellow', 'red');
        });
        cell.on('mouseout touchend', () => {
          tipEl.style.display = 'none';
          this.showRadius([r,c], 8, 'blue');
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
