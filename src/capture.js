import JSZip from 'jszip';
import {saveAs} from 'filesaver.js';

class CapturedRun {
  constructor(sim, ui, steps) {
    this.ui = ui;
    this.sim = sim;
    this.steps = steps;
  }

  step(zip, folders, composite) {
    this.sim.step();
    this.ui.render();

    let complete = 0;
    let layers = this.ui.stage.getLayers();
    let fname = String(this.sim.steps).padStart(4, '0');
    let onComplete = () => {
      complete += 1;
      if (complete == layers.length+1) {
        if (this.sim.steps < this.steps) {
          this.step(zip, folders, composite);
        } else {
          zip.generateAsync({type: 'blob'})
            .then(function(content) {
              saveAs(content, 'news-model.zip');
            });
        }
      }
    }
    layers.forEach((layer, i) => {
      let folder = folders[i];
      let canvas = layer.getCanvas()._canvas;
      canvas.toBlob((blob) => {
        folder.file(`${fname}.png`, blob);
        onComplete();
      });
    });
    let canvas = this.ui.stage.toCanvas();
    canvas.toBlob((blob) => {
      composite.file(`${fname}.png`, blob);
      onComplete();
    });
  }

  start() {
    let zip = new JSZip();
    let folder = zip.folder('news-model');
    let layers = folder.folder('model-layers');
    let composite = folder.folder('model-composite');
    let imgs = this.ui.stage.getLayers().map((l, i) => {
      return layers.folder(`layer-${i}`);
    });
    this.step(zip, imgs, composite);
  }
}

export default CapturedRun;
