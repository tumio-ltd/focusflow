/**
 * FocusFlow Camera Capturer (Mode 3)
 * Extracts the current viewport zoom and translate offsets and outputs standardized Scene camera JSON
 */

export class CameraCapturer {
  constructor(hud) {
    this.hud = hud;
    this.player = hud.player;
  }

  capture() {
    const cam = this.player.camera.getCurrentCamera();
    const config = {
      zoom: Number(cam.zoom.toFixed(2)),
      x: Number(cam.x.toFixed(1)),
      y: Number(cam.y.toFixed(1)),
      duration: cam.duration || 1.2
    };

    return config;
  }
}
