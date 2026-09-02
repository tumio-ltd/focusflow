import type { FocusFlowDSL, PlayerOptions, SceneStep } from '@focusflow/dsl';

export class FocusFlowPlayer {
  container: HTMLElement;
  imgEl: HTMLImageElement | null;
  viewportWidth: number;
  viewportHeight: number;
  constructor(options: PlayerOptions);
  init(): void;
  goToStep(index: number, animate?: boolean): void;
  goToScene(index: number, animate?: boolean): void;
  next(): void;
  prev(): void;
  play(): void;
  pause(): void;
  togglePlay(): void;
  toggleDebugMode(forceState?: boolean): void;
  setShowControls(show: boolean): void;
  toggleControls(): void;
  destroy(): void;
  getCurrentScene(): SceneStep | null;
  getCurrentIndex(): number;
  getSceneCount(): number;
}
