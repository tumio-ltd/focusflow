import { useEffect } from 'react';
import { useProjectStore, useEditorStore } from '@/stores';

export interface StudioKeyboardOptions {
  onSave?: () => void;
  onExport?: () => void;
  onPresent?: () => void;
  onOpenTemplates?: () => void;
  onOpenProjects?: () => void;
  onOpenImport?: () => void;
}

export function useStudioKeyboard(options: StudioKeyboardOptions = {}) {
  const undo = useProjectStore((s) => s.undo);
  const redo = useProjectStore((s) => s.redo);
  const past = useProjectStore((s) => s.past);
  const future = useProjectStore((s) => s.future);
  const setActiveTool = useEditorStore((s) => s.setActiveTool);
  const togglePlay = useEditorStore((s) => s.togglePlay);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      const isCtrlOrCmd = e.metaKey || e.ctrlKey;

      // 1. Command / Ctrl 系列组合键
      if (isCtrlOrCmd) {
        const key = e.key.toLowerCase();

        // ⌘ + Shift + Z 或 Ctrl + Y -> Redo
        if ((e.shiftKey && key === 'z') || key === 'y') {
          if (!isInput && future.length > 0) {
            e.preventDefault();
            redo();
          }
          return;
        }

        // ⌘ + Z 或 Ctrl + Z -> Undo
        if (key === 'z') {
          if (!isInput && past.length > 0) {
            e.preventDefault();
            undo();
          }
          return;
        }

        // ⌘ + E 或 Ctrl + E -> 导出独立 HTML 模态框
        if (key === 'e') {
          e.preventDefault();
          options.onExport?.();
          return;
        }

        // ⌘ + S 或 Ctrl + S -> 保存草稿
        if (key === 's') {
          e.preventDefault();
          options.onSave?.();
          return;
        }
      }

      // 2. 非输入框下的快捷键
      if (isInput) return;

      // F5 或 ⌥+P -> 演播模式
      if (e.key === 'F5' || (e.altKey && e.key.toLowerCase() === 'p')) {
        e.preventDefault();
        options.onPresent?.();
        return;
      }

      // 1 ~ 6 -> 切换工具
      if (e.key === '1' || e.key === 'v' || e.key === 'V') {
        setActiveTool('select');
      } else if (e.key === '2' || e.key === 'r' || e.key === 'R') {
        setActiveTool('box');
      } else if (e.key === '3' || e.key === 'l' || e.key === 'L') {
        setActiveTool('path');
      } else if (e.key === '4' || e.key === 'd' || e.key === 'D') {
        setActiveTool('dot');
      } else if (e.key === '5' || e.key === 'c' || e.key === 'C' || e.key === 't' || e.key === 'T') {
        setActiveTool('callout');
      } else if (e.key === '6' || e.key === 'i' || e.key === 'I') {
        setActiveTool('image');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [undo, redo, past.length, future.length, setActiveTool, togglePlay, options]);
}
