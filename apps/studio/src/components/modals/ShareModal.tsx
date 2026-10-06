import React, { useState, useEffect } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Share2, 
  Code, 
  ExternalLink, 
  ShieldCheck, 
  Sparkles, 
  Globe 
} from 'lucide-react';
import { toast } from '@/components/ui';

export interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
  projectTitle?: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  projectId = 'default_project',
  projectTitle = 'FocusFlow Presentation',
}) => {
  const [activeTab, setActiveTab] = useState<'link' | 'embed'>('link');
  const [slug, setSlug] = useState<string>('');
  const [customSlugInput, setCustomSlugInput] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [embedHeight, setEmbedHeight] = useState<number>(600);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://focusflow.io';

  const shareUrl = slug ? `${origin}/s/${slug}` : `${origin}/share/${projectId}`;
  const embedUrl = slug ? `${origin}/embed/${slug}` : `${origin}/share/${projectId}`;

  const iframeSnippet = `<iframe
  src="${embedUrl}"
  width="100%"
  height="${embedHeight}"
  frameborder="0"
  allow="fullscreen; clipboard-write"
  style="border: 0; border-radius: 8px; overflow: hidden;"
></iframe>`;

  // Auto-generate or fetch existing shortlink on open
  useEffect(() => {
    if (!isOpen) return;

    async function ensureShortlink() {
      if (slug) return;
      setIsGenerating(true);
      try {
        const res = await fetch('/api/platform/shortlinks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetUrl: `${origin}/share/${projectId}`,
            resourceType: 'PROJECT',
            resourceId: projectId,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.slug) {
            setSlug(data.slug);
          }
        }
      } catch (e) {
        console.warn('Auto shortlink generation failed, falling back to direct share URL', e);
      } finally {
        setIsGenerating(false);
      }
    }

    ensureShortlink();
  }, [isOpen, projectId, origin, slug]);

  const handleCreateCustomSlug = async () => {
    if (!customSlugInput.trim()) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/platform/shortlinks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: customSlugInput.trim(),
          targetUrl: `${origin}/share/${projectId}`,
          resourceType: 'PROJECT',
          resourceId: projectId,
        }),
      });

      if (res.status === 409) {
        toast('Slug already taken', { description: 'Please choose a different custom slug.' });
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setSlug(data.slug);
        toast('Custom shortlink generated!', { description: `${origin}/s/${data.slug}` });
      }
    } catch {
      toast('Failed to create custom shortlink');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string, isEmbedSnippet = false) => {
    try {
      await navigator.clipboard.writeText(text);
      if (isEmbedSnippet) {
        setCopiedEmbed(true);
        setTimeout(() => setCopiedEmbed(false), 2000);
        toast('Embed code copied!', { description: 'Paste it into Notion, Feishu, or Yuque.' });
      } else {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
        toast('Link copied to clipboard!');
      }
    } catch {
      toast('Failed to copy to clipboard');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden text-neutral-200 animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Share & Embed</h3>
              <p className="text-xs text-neutral-400">{projectTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-neutral-800 px-6 pt-3 gap-6 text-sm">
          <button
            onClick={() => setActiveTab('link')}
            className={`pb-3 font-medium flex items-center gap-2 border-b-2 transition ${
              activeTab === 'link'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Public Link</span>
          </button>
          <button
            onClick={() => setActiveTab('embed')}
            className={`pb-3 font-medium flex items-center gap-2 border-b-2 transition ${
              activeTab === 'embed'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>Knowledge Base Embed (iframe)</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 space-y-5">
          {activeTab === 'link' ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-neutral-400 mb-1.5 block">
                  Audience Presentation URL (Read-Only)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-200 font-mono select-all focus:outline-none"
                  />
                  <button
                    onClick={() => copyToClipboard(shareUrl)}
                    className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black text-sm font-medium rounded-lg flex items-center gap-1.5 transition shrink-0"
                  >
                    {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
                  </button>
                  <a
                    href={shareUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg transition shrink-0"
                    title="Open Preview"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Custom Slug Creator */}
              <div className="pt-3 border-t border-neutral-800/80">
                <label className="text-xs font-medium text-neutral-400 mb-1.5 block">
                  Customize Shortlink Slug (Optional)
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-sm text-neutral-400">
                    <span className="text-neutral-500 select-none mr-1">{origin}/s/</span>
                    <input
                      type="text"
                      placeholder="e.g. q4-architecture"
                      value={customSlugInput}
                      onChange={(e) => setCustomSlugInput(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                      className="bg-transparent text-neutral-200 focus:outline-none flex-1 font-mono text-sm"
                    />
                  </div>
                  <button
                    onClick={handleCreateCustomSlug}
                    disabled={isGenerating || !customSlugInput.trim()}
                    className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-neutral-200 text-sm font-medium rounded-lg flex items-center gap-1.5 transition shrink-0"
                  >
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>Apply</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-neutral-400">
                  Responsive &lt;iframe&gt; HTML Code
                </label>
                <div className="flex items-center gap-2 text-xs text-neutral-400">
                  <span>Height:</span>
                  <select
                    value={embedHeight}
                    onChange={(e) => setEmbedHeight(Number(e.target.value))}
                    className="bg-neutral-800 border border-neutral-700 rounded px-2 py-0.5 text-xs text-neutral-200"
                  >
                    <option value={480}>480 px</option>
                    <option value={600}>600 px (Recommended)</option>
                    <option value={720}>720 px</option>
                    <option value={900}>900 px</option>
                  </select>
                </div>
              </div>

              <div className="relative">
                <pre className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-xs font-mono text-cyan-300 overflow-x-auto whitespace-pre leading-relaxed select-all">
                  {iframeSnippet}
                </pre>
                <button
                  onClick={() => copyToClipboard(iframeSnippet, true)}
                  className="absolute top-2.5 right-2.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-md flex items-center gap-1.5 transition border border-neutral-700"
                >
                  {copiedEmbed ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedEmbed ? 'Copied' : 'Copy Code'}</span>
                </button>
              </div>

              {/* CSP & Security Compliance Badge (WBS 10.2.2) */}
              <div className="p-3 bg-cyan-950/20 border border-cyan-800/40 rounded-xl flex items-start gap-2.5 text-xs text-neutral-300">
                <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium text-cyan-200">
                    Enterprise CSP Whitelist Enabled
                  </p>
                  <p className="text-neutral-400 leading-normal">
                    This presentation can be safely embedded in <strong>Feishu (飞书)</strong>, <strong>Notion</strong>, and <strong>Yuque (语雀)</strong>. Third-party clickjacking is strictly blocked via <code className="text-cyan-300 bg-neutral-900 px-1 py-0.5 rounded">frame-ancestors</code> policy.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-neutral-950/60 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-500">
          <span>Powered by FocusFlow Presentation Engine</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
