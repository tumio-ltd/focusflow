import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  FolderGit2, 
  X, 
  Search, 
  Plus, 
  Layers, 
  Clock, 
  Copy, 
  Download, 
  Trash2, 
  Edit3, 
  Check, 
  ExternalLink,
  Loader2
} from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import { useStorageStore } from '@/stores';
import { getProjectRecord } from '@/services/storage';

export interface ProjectManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProject: (id: string) => void;
  onNewProject: () => void;
}

export function ProjectManagerModal({
  isOpen,
  onClose,
  onSelectProject,
  onNewProject,
}: ProjectManagerModalProps) {
  const { t } = useTranslation('projects');
  const { 
    projectList, 
    currentProjectId, 
    loadProjects, 
    renameProject, 
    duplicateProject, 
    deleteProject, 
    isLoading 
  } = useStorageStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadProjects();
    }
  }, [isOpen, loadProjects]);

  if (!isOpen) return null;

  const filteredProjects = projectList.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const handleStartRename = (id: string, currentTitle: string) => {
    setEditingId(id);
    setEditTitle(currentTitle);
  };

  const handleSaveRename = async (id: string) => {
    if (editTitle.trim()) {
      await renameProject(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleExportJson = async (id: string, title: string) => {
    const record = await getProjectRecord(id);
    if (!record) return;

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(record.dsl, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${title.replace(/\s+/g, '_')}_focusflow_dsl.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return '刚刚';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} 分钟前`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} 小时前`;
    const days = Math.floor(hours / 24);
    return `${days} 天前`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        data-testid="project-manager-modal"
        className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-card-foreground transition-colors duration-200"
      >
        {/* 顶部标题栏 */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">{t('managerTitle')}</h3>
              <span className="text-xs text-muted-foreground">
                {projectList.length} {t('projectCount')}
              </span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition p-1.5 rounded-lg hover:bg-muted"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* 搜索与新建控制栏 */}
        <div className="flex items-center gap-3 px-6 py-3.5 border-b border-border bg-muted/40">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
          </div>
          <Button size="sm" variant="cyan" onClick={() => { onNewProject(); onClose(); }} className="gap-1.5 font-medium">
            <Plus className="w-4 h-4" />
            <span>{t('createNew')}</span>
          </Button>
        </div>

        {/* 工程卡片列表 */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1 min-h-[250px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span>正在读取本地 IndexedDB...</span>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground">
              <FolderGit2 className="w-8 h-8 opacity-40" />
              <p className="text-xs">{t('emptyTip')}</p>
            </div>
          ) : (
            filteredProjects.map((p) => {
              const isCurrent = p.id === currentProjectId;
              const isEditing = editingId === p.id;

              return (
                <div
                  key={p.id}
                  className={`group relative flex items-center justify-between p-4 rounded-xl border transition-all ${
                    isCurrent
                      ? 'border-primary bg-primary/10 text-foreground shadow-md ring-1 ring-primary/30'
                      : 'border-border bg-card text-muted-foreground hover:border-border hover:bg-muted/40 hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground shrink-0 font-mono text-sm">
                      {isCurrent ? <span className="text-primary font-bold">●</span> : <Layers className="w-5 h-5" />}
                    </div>

                    <div className="flex flex-col min-w-0 flex-1 pr-2">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onBlur={() => handleSaveRename(p.id)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(p.id)}
                            autoFocus
                            className="bg-background border border-primary rounded px-2.5 py-1 text-sm text-foreground focus:outline-none font-medium"
                          />
                          <Button size="sm" variant="ghost" onClick={() => handleSaveRename(p.id)} className="h-7 w-7 p-0">
                            <Check className="w-4 h-4 text-primary" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span
                            onClick={() => {
                              if (!isCurrent) {
                                onSelectProject(p.id);
                                onClose();
                              }
                            }}
                            className="text-sm font-semibold truncate hover:text-primary cursor-pointer transition text-foreground"
                          >
                            {p.title}
                          </span>
                          {isCurrent && <Badge variant="cyan">{t('currentBadge')}</Badge>}
                          <button
                            onClick={() => handleStartRename(p.id, p.title)}
                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary transition p-0.5"
                            title={t('rename')}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono mt-1">
                        <span className="flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-primary/70" />
                          <span>{p.sceneCount} {t('scenesCount')}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{formatTimeAgo(p.updatedAt)}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 动作按键组 */}
                  <div className="flex items-center gap-1 shrink-0">
                    {!isCurrent && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          onSelectProject(p.id);
                          onClose();
                        }}
                        className="h-8 text-xs gap-1 font-medium"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>{t('openProject')}</span>
                      </Button>
                    )}

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => duplicateProject(p.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                      title={t('duplicate')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleExportJson(p.id, p.title)}
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                      title={t('exportJson')}
                    >
                      <Download className="w-4 h-4" />
                    </Button>

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        if (confirm(t('deleteConfirm'))) {
                          deleteProject(p.id);
                        }
                      }}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      title={t('delete')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
