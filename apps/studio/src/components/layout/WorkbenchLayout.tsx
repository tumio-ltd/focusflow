import React, { ReactNode } from 'react';

export interface WorkbenchLayoutProps {
  topBar: ReactNode;
  leftToolbox: ReactNode;
  centerCanvas: ReactNode;
  rightInspector: ReactNode;
  bottomTimeline: ReactNode;
}

export function WorkbenchLayout({
  topBar,
  leftToolbox,
  centerCanvas,
  rightInspector,
  bottomTimeline,
}: WorkbenchLayoutProps) {
  return (
    <div className="flex flex-col h-screen w-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden select-none transition-colors duration-200">
      {/* 1. 顶部全局控制台 (TopBar) */}
      {topBar}

      {/* 2. 中间三栏主编辑区 */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* 左侧浮动标定工具箱 */}
        {leftToolbox}

        {/* 中央交互式视口画布 */}
        <main data-testid="canvas-viewport" className="flex-1 relative overflow-hidden bg-slate-200 dark:bg-slate-950 flex items-center justify-center transition-colors duration-200">
          {centerCanvas}
        </main>

        {/* 右侧折叠属性检查面板 */}
        {rightInspector}
      </div>

      {/* 3. 底部场景时间轴 (BottomTimeline) */}
      {bottomTimeline}
    </div>
  );
}
