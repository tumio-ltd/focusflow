import { create } from 'zustand';
import type { ToolType } from '@/components/layout';

export interface EditorState {
  activeTool: ToolType;
  selectedElementId: string | null;
  activeSceneIndex: number;
  isPlaying: boolean;
  isHUDVisible: boolean;
  
  // Actions
  setActiveTool: (tool: ToolType) => void;
  setSelectedElementId: (id: string | null) => void;
  setActiveSceneIndex: (index: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  togglePlay: () => void;
  toggleHUD: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  activeTool: 'select',
  selectedElementId: null,
  activeSceneIndex: 0,
  isPlaying: false,
  isHUDVisible: true,

  setActiveTool: (activeTool) => set({ activeTool }),
  setSelectedElementId: (selectedElementId) => set({ selectedElementId }),
  setActiveSceneIndex: (activeSceneIndex) => set({ activeSceneIndex }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  toggleHUD: () => set((state) => ({ isHUDVisible: !state.isHUDVisible })),
}));
