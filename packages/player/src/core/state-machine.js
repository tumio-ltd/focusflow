/**
 * FocusFlow State Machine & Transition Dispatcher
 * Controls scene sequencing, double-RAF activation, and auto-play timers
 */

export class StateMachine {
  constructor(scenes, options = {}) {
    this.scenes = scenes || [];
    this.curIndex = typeof options.initialIndex === 'number' && options.initialIndex >= 0 ? options.initialIndex : 0;
    this.isPlaying = false;
    this.playTimer = null;
    this.autoPlayInterval = options.autoPlayInterval || 3800;
    this.loop = options.loop !== undefined ? !!options.loop : false;
    this.onStepChange = options.onStepChange || (() => {});
    this.onPlayStateChange = options.onPlayStateChange || (() => {});
    this.onEnded = options.onEnded || (() => {});
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

  getSceneDuration(index) {
    const scene = this.scenes[index];
    if (scene && typeof scene.duration === 'number' && scene.duration > 0) {
      return scene.duration;
    }
    return this.autoPlayInterval;
  }

  getTotalDuration() {
    return this.scenes.reduce((total, _, i) => total + this.getSceneDuration(i), 0);
  }

  goTo(index, animate = true) {
    if (index < 0 || index >= this.scenes.length) return;
    this.curIndex = index;
    this.onStepChange(this.curIndex, this.scenes[this.curIndex], animate);
    if (this.isPlaying) {
      this.startPlayTimer();
    }
  }

  seekTo(timeMs) {
    if (this.scenes.length === 0) return { index: 0, localOffset: 0, ended: false };
    const clampedTime = Math.max(0, timeMs);
    let accum = 0;
    let targetIdx = 0;
    let localOffset = 0;

    for (let i = 0; i < this.scenes.length; i++) {
      const dur = this.getSceneDuration(i);
      if (accum + dur > clampedTime) {
        targetIdx = i;
        localOffset = clampedTime - accum;
        break;
      }
      accum += dur;
      targetIdx = i;
      localOffset = dur;
    }

    const totalDur = accum;
    const isEnded = clampedTime >= totalDur && totalDur > 0;

    this.curIndex = targetIdx;
    this.onStepChange(this.curIndex, this.scenes[this.curIndex], false);

    if (isEnded) {
      this.onEnded();
      if (this.isPlaying) {
        this.pause();
      }
    }

    return { index: targetIdx, localOffset, ended: isEnded };
  }

  next() {
    if (this.curIndex < this.scenes.length - 1) {
      this.goTo(this.curIndex + 1, true);
    } else {
      // Reached the end
      this.onEnded();
      if (this.loop) {
        this.goTo(0, true);
      } else {
        this.pause();
      }
    }
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

  play() {
    if (!this.isPlaying) {
      this.isPlaying = true;
      this.startPlayTimer();
      this.onPlayStateChange(this.isPlaying);
    }
  }

  pause() {
    if (this.isPlaying) {
      this.isPlaying = false;
      this.stopPlayTimer();
      this.onPlayStateChange(this.isPlaying);
    }
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
    if (this.scenes.length === 0) return;
    const duration = this.getSceneDuration(this.curIndex);
    this.playTimer = setTimeout(() => {
      this.next();
    }, duration);
  }

  stopPlayTimer() {
    if (this.playTimer) {
      clearTimeout(this.playTimer);
      this.playTimer = null;
    }
  }

  destroy() {
    this.stopPlayTimer();
  }
}
