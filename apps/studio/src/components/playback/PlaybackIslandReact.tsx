import React, { useEffect, useRef } from 'react';
import { PlaybackIsland, type PlaybackHudMode } from '@focusflow/player';

export interface PlaybackIslandReactProps {
  isPlaying: boolean;
  currentSceneIdx: number;
  totalScenes: number;
  currentSceneTitle?: string;
  sceneElapsedMs: number;
  sceneDurationMs: number;
  hudMode: PlaybackHudMode;
  isRecording?: boolean;
  isUserActive?: boolean;
  elementCount?: number;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onCycleHudMode?: () => void;
  onRestoreFull?: () => void;
}

export const PlaybackIslandReact: React.FC<PlaybackIslandReactProps> = (props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const islandRef = useRef<PlaybackIsland | null>(null);

  // Keep callback refs fresh so event listeners always call the latest callbacks without remounting
  const callbacksRef = useRef(props);
  useEffect(() => {
    callbacksRef.current = props;
  });

  // 1. Mount Phase: instantiate native PlaybackIsland once
  useEffect(() => {
    if (!containerRef.current) return;

    const island = new PlaybackIsland({
      container: containerRef.current,
      hudMode: props.hudMode,
      isRecording: props.isRecording,
      isPlaying: props.isPlaying,
      currentSceneIdx: props.currentSceneIdx,
      totalScenes: props.totalScenes,
      currentSceneTitle: props.currentSceneTitle,
      sceneElapsedMs: props.sceneElapsedMs,
      sceneDurationMs: props.sceneDurationMs,
      elementCount: props.elementCount,
      isUserActive: props.isUserActive,
      onTogglePlay: () => callbacksRef.current.onTogglePlay(),
      onPrev: () => callbacksRef.current.onPrev(),
      onNext: () => callbacksRef.current.onNext(),
      onCycleHudMode: () => callbacksRef.current.onCycleHudMode?.(),
      onRestoreFull: () => callbacksRef.current.onRestoreFull?.(),
    });

    islandRef.current = island;

    return () => {
      island.destroy();
      islandRef.current = null;
    };
  }, []);

  // 2. Update Phase: incremental fine-grained updates (zero DOM recreation)
  useEffect(() => {
    if (!islandRef.current) return;
    islandRef.current.update({
      isPlaying: props.isPlaying,
      currentSceneIdx: props.currentSceneIdx,
      totalScenes: props.totalScenes,
      currentSceneTitle: props.currentSceneTitle || '',
      sceneElapsedMs: props.sceneElapsedMs,
      sceneDurationMs: props.sceneDurationMs,
      hudMode: props.hudMode,
      isRecording: !!props.isRecording,
      isUserActive: props.isUserActive !== undefined ? props.isUserActive : true,
      elementCount: props.elementCount || 0,
    });
  }, [
    props.isPlaying,
    props.currentSceneIdx,
    props.totalScenes,
    props.currentSceneTitle,
    props.sceneElapsedMs,
    props.sceneDurationMs,
    props.hudMode,
    props.isRecording,
    props.isUserActive,
    props.elementCount,
  ]);

  return <div ref={containerRef} className="focusflow-island-react-portal pointer-events-none" />;
};
