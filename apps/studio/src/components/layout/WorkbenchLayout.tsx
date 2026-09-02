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
    <div className="fixed inset-0 flex flex-col bg-background text-foreground overflow-hidden select-none">
      {/* 1. 顶部全局控制台 (TopBar) */}
      {topBar}

      {/* 2. 中间三栏主编辑区 */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* 左侧浮动标定工具箱 */}
        {leftToolbox}

        {/* 中央交互式视口画布 */}
        <main data-testid="canvas-viewport" className="flex-1 relative overflow-hidden bg-canvas flex items-center justify-center">
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
