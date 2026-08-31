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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        data-testid="templates-modal"
        className="relative w-full max-w-4xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-card-foreground transition-colors duration-200"
      >
        {/* 顶部标题栏 */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">{t('modalTitle')}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{t('subtitle')}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition p-1.5 rounded-lg hover:bg-muted"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* 分类 Tag 与搜索栏 */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-6 py-3.5 border-b border-border bg-muted/40">
          {/* 分类过滤器 */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition shrink-0 ${
                  selectedCategory === cat.id
                    ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* 搜索框 */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* 模板网格卡片列表 */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4.5 flex-1">
          {filteredTemplates.map((tpl) => (
            <div
              key={tpl.id}
              className={`group relative flex flex-col justify-between p-4.5 rounded-xl border bg-card hover:bg-muted/30 transition-all duration-200 hover:shadow-xl ${
                tpl.featured
                  ? 'border-primary/60 hover:border-primary shadow-sm'
                  : 'border-border hover:border-border'
              }`}
            >
              <div>
                {/* 封面与 Badge */}
                <div className="relative h-34 rounded-lg overflow-hidden border border-border mb-3.5 bg-muted">
                  <img
                    src={tpl.coverImage}
                    alt={tpl.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <Badge variant="slate" className="backdrop-blur-md bg-black/60 border-white/20 text-xs text-white">
                      {tpl.categoryLabel}
                    </Badge>
                    {tpl.featured && (
                      <Badge variant="cyan" className="backdrop-blur-md text-xs gap-1">
                        <Flame className="w-3.5 h-3.5 fill-current text-cyan-400" />
                        <span>{t('featuredBadge')}</span>
                      </Badge>
                    )}
                  </div>

                  <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-xs font-mono text-white">
                    <span className="flex items-center gap-1 bg-black/60 px-2.5 py-0.5 rounded backdrop-blur-sm border border-white/20">
                      <Layers className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{tpl.sceneCount} {t('scenesCount')}</span>
                    </span>
                    <span className="flex items-center gap-1 bg-black/60 px-2.5 py-0.5 rounded backdrop-blur-sm border border-white/20">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{tpl.estimatedDuration}s</span>
                    </span>
                  </div>
                </div>

                {/* 标题与描述 */}
                <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition line-clamp-1">
                  {tpl.title}
                </h4>
                <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                  {tpl.desc}
                </p>
              </div>

              {/* 底部克隆操作按键 */}
              <div className="pt-3.5 mt-3.5 border-t border-border flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-mono">
                  {tpl.dsl.meta.viewport.width} × {tpl.dsl.meta.viewport.height}
                </span>

                <Button
                  size="sm"
                  variant="cyan"
                  onClick={() => {
                    onApplyTemplate(tpl);
                    onClose();
                  }}
                  className="h-8 text-xs gap-1.5 font-medium shadow-sm"
                >
                  <span>{t('applyTemplate')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
