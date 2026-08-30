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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        data-testid="project-manager-modal"
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* 顶部标题栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <FolderGit2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">{t('managerTitle')}</h3>
              <span className="text-[11px] text-slate-400">
                {projectList.length} {t('projectCount')}
              </span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 搜索与新建控制栏 */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-slate-800 bg-slate-950/40">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
            />
          </div>
          <Button size="sm" variant="cyan" onClick={() => { onNewProject(); onClose(); }} className="gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            <span>{t('createNew')}</span>
          </Button>
        </div>

        {/* 工程卡片列表 */}
        <div className="p-6 overflow-y-auto space-y-2.5 flex-1 min-h-[250px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2 text-xs text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
              <span>正在读取本地 IndexedDB...</span>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-slate-500">
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
                  className={`group relative flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                    isCurrent
                      ? 'border-cyan-500/70 bg-cyan-950/20 text-slate-100 shadow-md ring-1 ring-cyan-500/30'
                      : 'border-slate-800 bg-slate-950/50 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-lg bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-400 shrink-0 font-mono text-xs">
                      {isCurrent ? <span className="text-cyan-400 font-bold">●</span> : <Layers className="w-4 h-4" />}
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
                            className="bg-slate-900 border border-cyan-500 rounded px-2 py-0.5 text-xs text-white focus:outline-none"
                          />
                          <Button size="sm" variant="ghost" onClick={() => handleSaveRename(p.id)} className="h-6 w-6 p-0">
                            <Check className="w-3.5 h-3.5 text-cyan-400" />
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
                            className="text-xs font-semibold truncate hover:text-cyan-300 cursor-pointer transition"
                          >
                            {p.title}
                          </span>
                          {isCurrent && <Badge variant="cyan">{t('currentBadge')}</Badge>}
                          <button
                            onClick={() => handleStartRename(p.id, p.title)}
                            className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-cyan-400 transition"
                            title={t('rename')}
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono mt-1">
                        <span className="flex items-center gap-1">
                          <Layers className="w-3 h-3 text-cyan-500/70" />
                          <span>{p.sceneCount} {t('scenesCount')}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
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
                        className="h-7 text-xs gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>{t('openProject')}</span>
                      </Button>
                    )}

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => duplicateProject(p.id)}
                      className="h-7 w-7 text-slate-400 hover:text-cyan-300"
                      title={t('duplicate')}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleExportJson(p.id, p.title)}
                      className="h-7 w-7 text-slate-400 hover:text-cyan-300"
                      title={t('exportJson')}
                    >
                      <Download className="w-3.5 h-3.5" />
                    </Button>

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        if (confirm(t('deleteConfirm'))) {
                          deleteProject(p.id);
                        }
                      }}
                      className="h-7 w-7 text-slate-500 hover:text-rose-400"
                      title={t('delete')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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
