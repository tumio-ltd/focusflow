import { useEffect } from 'react';
import { useProjectStore } from '@/stores';

export function useHistoryKeyboard() {
  const { undo, redo, past, future } = useProjectStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 如果焦点在 input / textarea 内，不拦截普通输入，但支持 ⌘Z
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isCtrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

      if (!isCtrlOrCmd) return;

      // ⌘ + Shift + Z 或 Ctrl + Y -> Redo
      if ((e.shiftKey && (e.key === 'z' || e.key === 'Z')) || (!isMac && (e.key === 'y' || e.key === 'Y'))) {
        if (!isInput && future.length > 0) {
          e.preventDefault();
          redo();
        }
      } 
      // ⌘ + Z 或 Ctrl + Z -> Undo
      else if (e.key === 'z' || e.key === 'Z') {
        if (!isInput && past.length > 0) {
          e.preventDefault();
          undo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [undo, redo, past.length, future.length]);
}
