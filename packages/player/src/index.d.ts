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
  goTo(index: number, animate?: boolean): void;
  next(): void;
  prev(): void;
  play(): void;
  pause(): void;
  togglePlay(): void;
  toggleDebugMode(forceState?: boolean): void;
  setShowControls(show: boolean): void;
  toggleControls(): void;
  clearElements(): void;
  updateDSL(dsl: FocusFlowDSL): void;
  destroy(): void;
  getCurrentScene(): SceneStep | null;
  getCurrentIndex(): number;
  getSceneCount(): number;
  getSceneDuration(index: number): number;
  getTotalDuration(): number;
  seekTo(timeMs: number): { index: number; localOffset: number; ended: boolean };
  on(event: 'ready', callback: (player: FocusFlowPlayer) => void): () => void;
  on(event: 'sceneChange', callback: (payload: { sceneIndex: number; scene: SceneStep; duration: number }) => void): () => void;
  on(event: 'ended', callback: () => void): () => void;
  on(event: 'playStateChange', callback: (isPlaying: boolean) => void): () => void;
  on(event: string, callback: (...args: any[]) => void): () => void;
  off(event: string, callback: (...args: any[]) => void): void;
  emit(event: string, data?: any): void;
}
