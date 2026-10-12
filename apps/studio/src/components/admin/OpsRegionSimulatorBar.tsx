// apps/studio/src/components/admin/OpsRegionSimulatorBar.tsx
import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, Globe, X, Lock } from 'lucide-react';

interface OpsRegionSimulatorBarProps {
  currentRegion: string;
  simulationExpiresAt?: string;
  onRegionChange: (newRegion: string) => void;
  onExitSimulation: () => void;
}

export const OpsRegionSimulatorBar: React.FC<OpsRegionSimulatorBarProps> = ({
  currentRegion,
  simulationExpiresAt,
  onRegionChange,
  onExitSimulation,
}) => {
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    if (!simulationExpiresAt) return 30 * 60;
    const diff = Math.floor((new Date(simulationExpiresAt).getTime() - Date.now()) / 1000);
    return Math.max(0, diff);
  });

  useEffect(() => {
    if (!simulationExpiresAt) return;
    const interval = setInterval(() => {
      const diff = Math.floor((new Date(simulationExpiresAt).getTime() - Date.now()) / 1000);
      if (diff <= 0) {
        clearInterval(interval);
        setRemainingSeconds(0);
        onExitSimulation();
      } else {
        setRemainingSeconds(diff);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [simulationExpiresAt, onExitSimulation]);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="w-full bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 text-xs text-amber-800 dark:text-amber-200 sticky top-0 z-50 backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded bg-amber-500/20 text-amber-600 dark:text-amber-300">
          <AlertTriangle className="h-3.5 w-3.5" />
        </span>
        <div className="font-semibold flex items-center gap-1.5">
          <span>特权计费区域模拟模式 (Privileged Simulation)</span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/20 text-[10px] text-amber-700 dark:text-amber-300">
            <Lock className="h-2.5 w-2.5" /> 扣款锁已生效
          </span>
        </div>
        <span className="hidden md:inline text-zinc-500 dark:text-zinc-400">|</span>
        <span className="hidden md:inline text-zinc-600 dark:text-zinc-400">
          当前所有标价仅供运营与财务核验，已禁用在线扣款
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Timer */}
        <div className="flex items-center gap-1 font-mono font-medium text-amber-700 dark:text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded">
          <Clock className="h-3 w-3" />
          <span>{timeFormatted}</span>
        </div>

        {/* Region Switcher */}
        <div className="flex items-center gap-1.5">
          <Globe className="h-3 w-3 text-amber-600 dark:text-amber-400" />
          <select
            value={currentRegion}
            onChange={(e) => onRegionChange(e.target.value)}
            className="rounded border border-amber-500/30 bg-white/80 dark:bg-zinc-900/80 px-2 py-0.5 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="CN">🇨🇳 中国 (CN - ¥ 人民币)</option>
            <option value="US">🇺🇸 美国 (US - $ 美元)</option>
            <option value="EU">🇪🇺 欧洲 (EU - € 欧元)</option>
            <option value="JP">🇯🇵 日本 (JP - ¥ 日元)</option>
            <option value="GLOBAL">🌐 全球兜底 (GLOBAL - $ 美元)</option>
            <option value="ALL">📊 全地区大盘对比 (ALL)</option>
          </select>
        </div>

        {/* Exit Button */}
        <button
          type="button"
          onClick={onExitSimulation}
          className="flex items-center gap-1 rounded bg-amber-600 hover:bg-amber-700 text-white px-2 py-0.5 font-medium transition-colors"
        >
          <X className="h-3 w-3" />
          <span>退出模拟</span>
        </button>
      </div>
    </div>
  );
};
