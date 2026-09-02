import { create } from 'zustand';
import type { ToolType } from '@/components/layout';

export interface EditorState {
  activeTool: ToolType;
  selectedElementId: string | null;
  activeSceneIndex: number;
  isPlaying: boolean;
  isHUDVisible: boolean;
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
  toggleSmartSnap: () => void;
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
  isSmartSnapEnabled: true,
  isCrosshairEnabled: false,
  cursorCoords: null,

  setActiveTool: (activeTool) => set({ activeTool }),
  setSelectedElementId: (selectedElementId) => set({ selectedElementId }),
  setActiveDrawingColor: (activeDrawingColor) => set({ activeDrawingColor }),
  setActiveSceneIndex: (activeSceneIndex) => set({ activeSceneIndex }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  toggleHUD: () => set((state) => ({ isHUDVisible: !state.isHUDVisible })),
  toggleSmartSnap: () => set((state) => ({ isSmartSnapEnabled: !state.isSmartSnapEnabled })),
  toggleCrosshair: () => set((state) => ({ isCrosshairEnabled: !state.isCrosshairEnabled })),
  setCursorCoords: (cursorCoords) => set({ cursorCoords }),
}));
