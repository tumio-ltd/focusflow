import React from 'react';
import { useTranslation } from 'react-i18next';

export interface BrandLogoProps {
  /** 尺寸预设：sm(24px), md(28px), lg(36px) */
  size?: 'sm' | 'md' | 'lg';
  /** 是否显示右侧品牌文字标 */
  showWordmark?: boolean;
  /** 是否显示 Studio 副标徽章 */
  showBadge?: boolean;
  /** 是否允许点击交互（例如跳转或回调） */
  onClick?: () => void;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showWordmark = true,
  showBadge = true,
  onClick,
  className = '',
}) => {
  const { i18n } = useTranslation('common');
  const isZh = (i18n.language || 'zh').startsWith('zh');

  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-7 h-7',
    lg: 'w-9 h-9',
  };

  const svgSizes = {
    sm: 'w-4 h-4',
    md: 'w-4.5 h-4.5',
    lg: 'w-6 h-6',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* 官方矢量对焦微标 (Concept A Mark) */}
      <div
        className={`${iconSizes[size]} rounded-lg bg-sky-500/10 border border-sky-500/25 flex items-center justify-center text-sky-400 shadow-sm transition-all duration-200 hover:border-sky-400/50 hover:bg-sky-500/15 group shrink-0`}
        title="FocusFlow · 流镜"
      >
        <svg
          viewBox="0 0 128 128"
          className={`${svgSizes[size]} transition-transform duration-300 group-hover:scale-105`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="ffBrandGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="50%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>
            <filter id="ffBrandGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* 摄像机 4 个对焦角标 */}
          <g stroke="#38bdf8" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" opacity="0.9">
            <path d="M 40 24 L 28 24 A 4 4 0 0 0 24 28 L 24 40" />
            <path d="M 88 24 L 100 24 A 4 4 0 0 1 104 28 L 104 40" />
            <path d="M 24 88 L 24 100 A 4 4 0 0 0 28 104 L 40 104" />
            <path d="M 104 88 L 104 100 A 4 4 0 0 1 100 104 L 88 104" />
          </g>

          {/* 发光贝塞尔运镜流光 */}
          <path
            d="M 28 96 C 52 96, 56 32, 100 32"
            stroke="url(#ffBrandGrad)"
            strokeWidth="11"
            strokeLinecap="round"
            filter="url(#ffBrandGlow)"
          />

          {/* 目标中心焦点光斑 */}
          <circle cx="100" cy="32" r="7" fill="#ffffff" filter="url(#ffBrandGlow)" />
        </svg>
      </div>

      {/* 官方标准水平字标 (Horizontal Lockup) */}
      {showWordmark && (
        <div className="flex items-center gap-1.5 leading-none">
          {isZh ? (
            <div className="flex items-baseline gap-1">
              <span className={`font-extrabold tracking-tight text-foreground ${textSizes[size]}`}>
                流镜
              </span>
              <span className={`font-semibold tracking-tight bg-gradient-to-r from-sky-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent ${textSizes[size]}`}>
                FocusFlow
              </span>
            </div>
          ) : (
            <div className="flex items-baseline gap-0.5">
              <span className={`font-extrabold tracking-tight text-foreground ${textSizes[size]}`}>
                Focus
              </span>
              <span className={`font-semibold tracking-tight bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent ${textSizes[size]}`}>
                Flow
              </span>
            </div>
          )}

          {showBadge && (
            <span className="text-[10px] font-mono font-semibold text-muted-foreground uppercase px-1.5 py-0.5 rounded bg-muted/60 tracking-wider hidden sm:inline">
              Studio
            </span>
          )}
        </div>
      )}
    </div>
  );
};
