import React, { useState, useEffect } from 'react';
import type { FocusFlowDSL } from '@focusflow/dsl';
import { 
  Code2, 
  Copy, 
  Check, 
  RotateCcw, 
  Save, 
  X, 
  AlertCircle, 
  Sparkles,
  FileCode
} from 'lucide-react';
import { Button } from '@/components/ui';

export interface DslEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  dsl: FocusFlowDSL;
  onApplyDSL: (newDSL: FocusFlowDSL) => void;
}

export function DslEditorModal({
  isOpen,
  onClose,
  dsl,
  onApplyDSL,
}: DslEditorModalProps) {
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [hasCopied, setHasCopied] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Sync with current DSL whenever opened
  useEffect(() => {
    if (isOpen) {
      setJsonText(JSON.stringify(dsl, null, 2));
      setError(null);
      setIsSuccess(false);
    }
  }, [isOpen, dsl]);

  if (!isOpen) return null;

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setJsonText(text);
    try {
      JSON.parse(text);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'JSON 语法错误');
    }
  };

  const handleApply = () => {
    try {
      const parsed = JSON.parse(jsonText);
      if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.scenes)) {
        throw new Error('DSL 必须包含有效的 scenes 场景数组');
      }

      onApplyDSL(parsed);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 700);
    } catch (err: any) {
      setError(err.message || '解析 DSL 失败，请检查语法结构');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonText);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  const handleReset = () => {
    setJsonText(JSON.stringify(dsl, null, 2));
    setError(null);
  };

  return (
    <div
      data-testid="dsl-editor-modal"
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div className="bg-card border border-border rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col text-card-foreground">
        {/* 顶部标题栏 */}
        <div className="px-6 py-3.5 border-b border-border flex items-center justify-between bg-panel/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-foreground">DSL JSON 实时代码编辑器 (Live DSL Editor)</h2>
                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono border border-primary/20">
                  FocusFlow v1.0
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">支持直接修改坐标、连线动画模式与高级属性，应用后即刻热更新演播画布</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopy}
              className="h-8 gap-1.5 text-xs border-border"
              title="复制全部 JSON 到剪贴板"
            >
              {hasCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{hasCopied ? '已复制' : '复制 JSON'}</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleReset}
              className="h-8 gap-1.5 text-xs border-border text-muted-foreground hover:text-foreground"
              title="重置为当前工程数据"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>重置</span>
            </Button>

            <Button
              size="icon"
              variant="ghost"
              onClick={onClose}
              className="w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground ml-1"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* 中间代码编辑区 */}
        <div className="flex-1 p-4 overflow-hidden flex flex-col bg-background/50">
          <div className="relative flex-1 rounded-xl border border-border bg-[#0d1117] overflow-hidden flex flex-col shadow-inner">
            {/* 编辑器状态标签条 */}
            <div className="h-7 px-3 bg-[#161b22] border-b border-border/40 flex items-center justify-between text-[11px] font-mono text-muted-foreground select-none">
              <div className="flex items-center gap-2">
                <FileCode className="w-3.5 h-3.5 text-primary" />
                <span className="text-foreground font-semibold">focusflow.dsl.json</span>
              </div>
              <div>
                {error ? (
                  <span className="text-rose-400 flex items-center gap-1 font-sans">
                    <AlertCircle className="w-3 h-3" />
                    <span>语法错误</span>
                  </span>
                ) : (
                  <span className="text-emerald-400 flex items-center gap-1 font-sans">
                    <Check className="w-3 h-3" />
                    <span>JSON 结构正常</span>
                  </span>
                )}
              </div>
            </div>

            {/* 代码输入文本域 */}
            <textarea
              value={jsonText}
              onChange={handleTextChange}
              spellCheck={false}
              className="flex-1 w-full bg-transparent text-slate-200 font-mono text-xs p-3 leading-relaxed focus:outline-none resize-none overflow-y-auto selection:bg-primary/30"
              placeholder="在此粘贴或编辑 FocusFlow DSL JSON..."
            />
          </div>

          {/* 错误提示栏 */}
          {error && (
            <div className="mt-2.5 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-[11px] flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="font-mono">{error}</span>
            </div>
          )}
        </div>

        {/* 底部操作栏 */}
        <div className="px-6 py-3 border-t border-border flex items-center justify-between bg-panel/40">
          <span className="text-[11px] text-muted-foreground">
            提示：修改 <code className="text-primary bg-muted px-1 py-0.5 rounded font-mono">elements.paths[].style.mode</code> 为 <code className="text-primary font-mono">"stream"</code>、<code className="text-primary font-mono">"draw"</code> 或 <code className="text-primary font-mono">"pulse"</code>
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-8 text-xs px-4"
            >
              取消
            </Button>

            <Button
              size="sm"
              onClick={handleApply}
              disabled={!!error}
              className="h-8 gap-1.5 text-xs px-5 font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md cursor-pointer"
            >
              {isSuccess ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Save className="w-3.5 h-3.5" />}
              <span>{isSuccess ? '已成功应用！' : '应用修改 (Hot Sync)'}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
