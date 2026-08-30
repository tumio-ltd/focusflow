/**
 * FocusFlow State Machine & Transition Dispatcher
 * Controls scene sequencing, double-RAF activation, and auto-play timers
 */

export class StateMachine {
  constructor(scenes, options = {}) {
    this.scenes = scenes || [];
    this.curIndex = 0;
    this.isPlaying = false;
    this.playTimer = null;
    this.autoPlayInterval = options.autoPlayInterval || 3800;
    this.onStepChange = options.onStepChange || (() => {});
    this.onPlayStateChange = options.onPlayStateChange || (() => {});
  }

  get currentScene() {
    return this.scenes[this.curIndex];
  }

  get currentIndex() {
    return this.curIndex;
  }

  get totalScenes() {
    return this.scenes.length;
  }

  goTo(index, animate = true) {
    if (index < 0 || index >= this.scenes.length) return;
    this.curIndex = index;
    this.onStepChange(this.curIndex, this.scenes[this.curIndex], animate);
  }

  next() {
    const nextIdx = (this.curIndex + 1) % this.scenes.length;
    this.goTo(nextIdx, true);
  }

  prev() {
    const prevIdx = (this.curIndex - 1 + this.scenes.length) % this.scenes.length;
    this.goTo(prevIdx, true);
  }

  first() {
    this.goTo(0, true);
  }

  last() {
    this.goTo(this.scenes.length - 1, true);
  }

  togglePlay() {
    this.isPlaying = !this.isPlaying;
    if (this.isPlaying) {
      this.startPlayTimer();
    } else {
      this.stopPlayTimer();
    }
    this.onPlayStateChange(this.isPlaying);
  }

  startPlayTimer() {
    this.stopPlayTimer();
    this.playTimer = setInterval(() => {
      this.next();
    }, this.autoPlayInterval);
  }

  stopPlayTimer() {
    if (this.playTimer) {
      clearInterval(this.playTimer);
      this.playTimer = null;
    }
  }

  destroy() {
    this.stopPlayTimer();
  }
}
