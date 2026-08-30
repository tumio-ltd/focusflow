import type { FocusFlowDSL, PlayerOptions, SceneStep } from '@focusflow/dsl';

export class FocusFlowPlayer {
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
