import React, { useState, useEffect, useRef } from 'react';
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
  FileCode,
  Maximize2,
  Minimize2,
  Wand2,
  Layers,
  Square,
  GitCommit
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
  const [isMaximized, setIsMaximized] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  // Sync with current DSL whenever opened
  useEffect(() => {
    if (isOpen) {
      setJsonText(JSON.stringify(dsl, null, 2));
      setError(null);
      setIsSuccess(false);
    }
  }, [isOpen, dsl]);

  if (!isOpen) return null;

  const lineCount = jsonText.split('\n').length;
  const scenesCount = dsl.scenes?.length || 0;
  const boxCount = dsl.elements?.boxes?.length || 0;
  const pathCount = dsl.elements?.paths?.length || 0;

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

  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setJsonText(JSON.stringify(parsed, null, 2));
      setError(null);
    } catch (err: any) {
      setError(err.message || '格式化失败：JSON 语法错误');
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
      }, 600);
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
      className={`fixed inset-0 z-50 bg-background/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150 ${
        isMaximized ? 'p-0' : ''
      }`}
    >
      <div
        className={`bg-card border border-border shadow-2xl overflow-hidden flex flex-col text-card-foreground transition-all duration-200 ${
          isMaximized
            ? 'w-full h-full rounded-none border-none'
            : 'w-[95vw] max-w-6xl h-[92vh] rounded-2xl'
        }`}
      >
        {/* 顶部标题与工具栏 */}
        <div className="px-5 py-3 border-b border-border flex items-center justify-between bg-panel/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-sm">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-foreground">DSL JSON 实时代码编辑器</h2>
                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono border border-primary/20">
                  FocusFlow Schema
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground hidden sm:block">
                直接编辑图元、多幕转场与动画模式，应用后单帧实时热重载演播画布
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 格式化 JSON */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleFormat}
              className="h-8 gap-1.5 text-xs border-border hover:border-primary/50 text-muted-foreground hover:text-foreground hidden sm:flex"
              title="自动对齐缩进格式化 JSON"
            >
              <Wand2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>格式化</span>
            </Button>

            {/* 复制全部 */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopy}
              className="h-8 gap-1.5 text-xs border-border text-muted-foreground hover:text-foreground"
              title="复制全部 JSON 到剪贴板"
            >
              {hasCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{hasCopied ? '已复制' : '复制'}</span>
            </Button>

            {/* 重置 */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleReset}
              className="h-8 gap-1.5 text-xs border-border text-muted-foreground hover:text-foreground"
              title="重置为当前工程数据"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">重置</span>
            </Button>

            {/* 全屏切换 */}
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsMaximized(!isMaximized)}
              className="w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground"
              title={isMaximized ? '还原窗口' : '最大化窗口'}
            >
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>

            {/* 关闭 */}
            <Button
              size="icon"
              variant="ghost"
              onClick={onClose}
              className="w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* 中间超大代码编辑区 (带行号 + 暗黑主题 + 统计状态) */}
        <div className="flex-1 p-3 sm:p-4 overflow-hidden flex flex-col bg-background/50 min-h-0">
          <div className="relative flex-1 rounded-xl border border-border bg-[#0d1117] overflow-hidden flex flex-col shadow-inner min-h-0">
            {/* 编辑器状态标签条 */}
            <div className="h-8 px-4 bg-[#161b22] border-b border-border/40 flex items-center justify-between text-[11px] font-mono text-muted-foreground select-none shrink-0">
              <div className="flex items-center gap-2">
                <FileCode className="w-3.5 h-3.5 text-primary" />
                <span className="text-foreground font-semibold">focusflow.dsl.json</span>
                <span className="text-[10px] text-muted-foreground ml-2 hidden md:inline">
                  ({scenesCount} 幕 · {boxCount} 方框 · {pathCount} 连线 · {lineCount} 行)
                </span>
              </div>
              <div className="flex items-center gap-3">
                {error ? (
                  <span className="text-rose-400 flex items-center gap-1 font-sans font-medium text-[11px]">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>JSON 语法错误</span>
                  </span>
                ) : (
                  <span className="text-emerald-400 flex items-center gap-1 font-sans font-medium text-[11px]">
                    <Check className="w-3.5 h-3.5" />
                    <span>JSON 校验通过</span>
                  </span>
                )}
              </div>
            </div>

            {/* 代码输入与行号区 */}
            <div className="flex-1 flex overflow-hidden min-h-0 relative">
              {/* 左侧行号栏 */}
              <div
                ref={lineNumbersRef}
                className="w-12 py-3 bg-[#090d12] border-r border-border/20 text-slate-600 font-mono text-xs select-none overflow-hidden text-right pr-2.5 leading-relaxed shrink-0 pointer-events-none"
              >
                {Array.from({ length: lineCount }).map((_, i) => (
                  <div key={i} className="leading-relaxed">
                    {i + 1}
                  </div>
                ))}
              </div>

              {/* 右侧文本域 */}
              <textarea
                ref={textareaRef}
                value={jsonText}
                onChange={handleTextChange}
                onScroll={handleScroll}
                spellCheck={false}
                className="flex-1 w-full h-full bg-transparent text-slate-200 font-mono text-xs p-3 leading-relaxed focus:outline-none resize-none overflow-y-auto selection:bg-primary/30"
                placeholder="在此粘贴或编辑 FocusFlow DSL JSON..."
              />
            </div>
          </div>

          {/* 语法错误提示浮条 */}
          {error && (
            <div className="mt-2.5 px-3.5 py-2 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-[11px] flex items-center gap-2 animate-in fade-in shrink-0">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="font-mono truncate">{error}</span>
            </div>
          )}
        </div>

        {/* 底部操作控制栏 */}
        <div className="px-5 py-3 border-t border-border flex items-center justify-between bg-panel/60 shrink-0">
          <div className="text-[11px] text-muted-foreground hidden sm:flex items-center gap-3">
            <span>
              常用字段：<code className="text-primary bg-muted px-1 py-0.5 rounded font-mono">style.mode</code> (
              <code className="text-primary font-mono">stream</code> / <code className="text-primary font-mono">pulse</code> / <code className="text-primary font-mono">draw</code>
              ) · <code className="text-primary bg-muted px-1 py-0.5 rounded font-mono">flowSpeed</code> (
              <code className="text-primary font-mono">0.5~5.0</code>)
            </span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
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
              className="h-8 gap-1.5 text-xs px-5 font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md cursor-pointer transition-all"
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
