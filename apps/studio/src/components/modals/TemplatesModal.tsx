import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Sparkles, 
  X, 
  Search, 
  Layers, 
  Clock, 
  Flame, 
  ArrowRight 
} from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import { ARCHITECTURE_TEMPLATES, ArchitectureTemplate } from '@/templates';

export interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTemplate: (template: ArchitectureTemplate) => void;
}

export function TemplatesModal({
  isOpen,
  onClose,
  onApplyTemplate,
}: TemplatesModalProps) {
  const { t } = useTranslation('templates');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: t('categoryAll') },
    { id: 'hotel', label: t('categoryHotel') },
    { id: 'microservice', label: t('categoryMicroservice') },
    { id: 'ddd', label: t('categoryDdd') },
    { id: 'cloudnative', label: t('categoryCloudnative') },
    { id: 'database', label: t('categoryDatabase') },
    { id: 'ai', label: t('categoryAi') },
  ];

  const filteredTemplates = ARCHITECTURE_TEMPLATES.filter((tpl) => {
    const matchCategory = selectedCategory === 'all' || tpl.category === selectedCategory;
    const matchQuery =
      tpl.title.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      tpl.desc.toLowerCase().includes(searchQuery.toLowerCase().trim());
    return matchCategory && matchQuery;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        data-testid="templates-modal"
        className="relative w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-900 dark:text-slate-100 transition-colors duration-200"
      >
        {/* 顶部标题栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('modalTitle')}</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{t('subtitle')}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 分类 Tag 与搜索栏 */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
          {/* 分类过滤器 */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition shrink-0 ${
                  selectedCategory === cat.id
                    ? 'bg-cyan-500 text-white dark:text-slate-950 font-semibold shadow-sm shadow-cyan-500/30'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800/60'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* 搜索框 */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500/60"
            />
          </div>
        </div>

        {/* 模板网格卡片列表 */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
          {filteredTemplates.map((tpl) => (
            <div
              key={tpl.id}
              className={`group relative flex flex-col justify-between p-4 rounded-xl border bg-slate-50 dark:bg-slate-950/60 transition-all duration-200 hover:shadow-xl ${
                tpl.featured
                  ? 'border-cyan-500/60 hover:border-cyan-400 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-800/30'
              }`}
            >
              <div>
                {/* 封面与 Badge */}
                <div className="relative h-32 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800/80 mb-3.5 bg-slate-200 dark:bg-slate-900">
                  <img
                    src={tpl.coverImage}
                    alt={tpl.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" />
                  
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <Badge variant="slate" className="backdrop-blur-md bg-slate-900/80 border-slate-700/80 text-[10px] text-white">
                      {tpl.categoryLabel}
                    </Badge>
                    {tpl.featured && (
                      <Badge variant="cyan" className="backdrop-blur-md text-[10px] gap-1">
                        <Flame className="w-3 h-3 fill-current text-cyan-400" />
                        <span>{t('featuredBadge')}</span>
                      </Badge>
                    )}
                  </div>

                  <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-[11px] font-mono text-white">
                    <span className="flex items-center gap-1 bg-slate-950/70 px-2 py-0.5 rounded backdrop-blur-sm border border-slate-800/60">
                      <Layers className="w-3 h-3 text-cyan-400" />
                      <span>{tpl.sceneCount} {t('scenesCount')}</span>
                    </span>
                    <span className="flex items-center gap-1 bg-slate-950/70 px-2 py-0.5 rounded backdrop-blur-sm border border-slate-800/60">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      <span>{tpl.estimatedDuration}s</span>
                    </span>
                  </div>
                </div>

                {/* 标题与描述 */}
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition line-clamp-1">
                  {tpl.title}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {tpl.desc}
                </p>
              </div>

              {/* 底部克隆操作按键 */}
              <div className="pt-3.5 mt-3.5 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                  {tpl.dsl.meta.viewport.width} × {tpl.dsl.meta.viewport.height}
                </span>

                <Button
                  size="sm"
                  variant="cyan"
                  onClick={() => {
                    onApplyTemplate(tpl);
                    onClose();
                  }}
                  className="h-7 text-xs gap-1.5 font-medium shadow-sm"
                >
                  <span>{t('applyTemplate')}</span>
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
