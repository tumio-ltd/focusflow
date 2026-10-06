/**
 * 高鲁棒性多策略剪贴板复制工具函数 (Robust Multi-Strategy Clipboard Copy)
 * 
 * 依次尝试：
 * 1. 现代异步剪贴板 API: navigator.clipboard.writeText (适用于 HTTPS / localhost 环境)
 * 2. 经典隐式 DOM 文本域机制: document.execCommand('copy') (兼容 HTTP、局域网 IP、Safari 严格安全限制及未聚焦上下文)
 * 3. 若均失败，返回 false，由调用方给用户清晰的错误提示
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;

  // 策略 1: navigator.clipboard.writeText
  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('[clipboard] navigator.clipboard.writeText failed, falling back to execCommand:', err);
    }
  }

  // 策略 2: document.execCommand('copy') 兜底
  if (typeof document !== 'undefined') {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      // 避免引起页面滚动或视口闪烁
      textarea.style.position = 'fixed';
      textarea.style.top = '0';
      textarea.style.left = '0';
      textarea.style.width = '2em';
      textarea.style.height = '2em';
      textarea.style.padding = '0';
      textarea.style.border = 'none';
      textarea.style.outline = 'none';
      textarea.style.boxShadow = 'none';
      textarea.style.background = 'transparent';
      textarea.setAttribute('readonly', '');
      document.body.appendChild(textarea);

      textarea.focus();
      textarea.select();
      textarea.setSelectionRange(0, text.length);

      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);
      if (successful) return true;
    } catch (err) {
      console.warn('[clipboard] document.execCommand fallback failed:', err);
    }
  }

  return false;
}
