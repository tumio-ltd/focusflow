import type { FocusFlowDSL, PlayerOptions, SceneStep } from '@focusflow/dsl';

export class FocusFlowPlayer {
  container: HTMLElement;
  imgEl: HTMLImageElement | null;
  viewportWidth: number;
  viewportHeight: number;
  constructor(options: PlayerOptions);
  init(): Promise<void>;
  goToScene(index: number): void;
  next(): void;
  prev(): void;
  play(): void;
  pause(): void;
  togglePlay(): void;
  destroy(): void;
  getCurrentScene(): SceneStep | null;
  getCurrentIndex(): number;
  getSceneCount(): number;
}
