import { create } from 'zustand';
import type { ToolType } from '@/components/layout';

const SMART_SNAP_STORAGE_KEY = 'focusflow_smart_snap';
const PLAYBACK_HUD_MODE_STORAGE_KEY = 'focusflow_playback_hud_mode';

export type PlaybackHudMode = 'full' | 'minimal' | 'zen';

const getInitialSmartSnap = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const saved = localStorage.getItem(SMART_SNAP_STORAGE_KEY);
    return saved !== null ? saved === 'true' : false;
  } catch {
    return false;
  }
};

const getInitialPlaybackHudMode = (): PlaybackHudMode => {
  if (typeof window === 'undefined') return 'full';
  try {
    const saved = localStorage.getItem(PLAYBACK_HUD_MODE_STORAGE_KEY);
    if (saved === 'full' || saved === 'minimal' || saved === 'zen') {
      return saved;
    }
  } catch {}
  return 'full';
};

export interface EditorState {
  activeTool: ToolType;
  selectedElementId: string | null;
  activeSceneIndex: number;
  isPlaying: boolean;
  isHUDVisible: boolean;
  playbackHudMode: PlaybackHudMode;
  isSmartSnapEnabled: boolean;
  isCrosshairEnabled: boolean;
  activeDrawingColor: string;
  cursorCoords: { x: number; y: number } | null;
  
  // Actions
  setActiveTool: (tool: ToolType) => void;
  setSelectedElementId: (id: string | null) => void;
  setActiveDrawingColor: (color: string) => void;
  setActiveSceneIndex: (index: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  togglePlay: () => void;
  toggleHUD: () => void;
  setPlaybackHudMode: (mode: PlaybackHudMode) => void;
  cyclePlaybackHudMode: () => void;
  toggleSmartSnap: () => void;
  setSmartSnapEnabled: (enabled: boolean) => void;
  toggleCrosshair: () => void;
  setCursorCoords: (coords: { x: number; y: number } | null) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  activeTool: 'select',
  selectedElementId: null,
  activeDrawingColor: '#38bdf8',
  activeSceneIndex: 0,
  isPlaying: false,
  isHUDVisible: true,
  playbackHudMode: getInitialPlaybackHudMode(),
  isSmartSnapEnabled: getInitialSmartSnap(),
  isCrosshairEnabled: false,
  cursorCoords: null,

  setActiveTool: (activeTool) => set({ activeTool }),
  setSelectedElementId: (selectedElementId) => set({ selectedElementId }),
  setActiveDrawingColor: (activeDrawingColor) => set({ activeDrawingColor }),
  setActiveSceneIndex: (activeSceneIndex) => set({ activeSceneIndex }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  toggleHUD: () => set((state) => ({ isHUDVisible: !state.isHUDVisible })),
  setPlaybackHudMode: (mode: PlaybackHudMode) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(PLAYBACK_HUD_MODE_STORAGE_KEY, mode);
      }
    } catch {}
    set({ playbackHudMode: mode });
  },
  cyclePlaybackHudMode: () => {
    set((state) => {
      const order: PlaybackHudMode[] = ['full', 'minimal', 'zen'];
      const currentIndex = order.indexOf(state.playbackHudMode);
      const nextMode = order[(currentIndex + 1) % order.length];
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem(PLAYBACK_HUD_MODE_STORAGE_KEY, nextMode);
        }
      } catch {}
      return { playbackHudMode: nextMode };
    });
  },
  toggleSmartSnap: () =>
    set((state) => {
      const nextVal = !state.isSmartSnapEnabled;
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem(SMART_SNAP_STORAGE_KEY, String(nextVal));
        }
      } catch {}
      return { isSmartSnapEnabled: nextVal };
    }),
  setSmartSnapEnabled: (enabled: boolean) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(SMART_SNAP_STORAGE_KEY, String(enabled));
      }
    } catch {}
    set({ isSmartSnapEnabled: enabled });
  },
  toggleCrosshair: () => set((state) => ({ isCrosshairEnabled: !state.isCrosshairEnabled })),
  setCursorCoords: (cursorCoords) => set({ cursorCoords }),
}));
