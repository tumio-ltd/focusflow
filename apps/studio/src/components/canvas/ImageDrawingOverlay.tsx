import React, { useRef, useState, useCallback } from 'react';
import type { ElementImage } from '@focusflow/dsl';
import { Image as ImageIcon, Upload, Check, X } from 'lucide-react';
import { Button, Input } from '@/components/ui';

export interface ImageDrawingOverlayProps {
  contentWidth: number;
  contentHeight: number;
  active: boolean;
  onImageCreated: (image: ElementImage) => void;
}

export function ImageDrawingOverlay({
  contentWidth,
  contentHeight,
  active,
  onImageCreated,
}: ImageDrawingOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [clickPos, setClickPos] = useState<{ x: number; y: number } | null>(null);
  const [imageUrl, setImageUrl] = useState('/system_architecture.png');
  const [imgWidth, setImgWidth] = useState(1200);
  const [imgHeight, setImgHeight] = useState(800);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getCanvasCoords = useCallback(
    (e: React.PointerEvent) => {
      if (!overlayRef.current) return { x: 0, y: 0 };
      const rect = overlayRef.current.getBoundingClientRect();
      const scaleX = contentWidth / rect.width;
      const scaleY = contentHeight / rect.height;

      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      return {
        x: Math.max(0, Math.min(x, contentWidth)),
        y: Math.max(0, Math.min(y, contentHeight)),
      };
    },
    [contentWidth, contentHeight]
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!active || isModalOpen) return;
    if (e.button !== 0) return;

    const coords = getCanvasCoords(e);
    setClickPos({ x: Math.round(coords.x), y: Math.round(coords.y) });
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const result = loadEvent.target?.result as string;
      if (result) {
        setImageUrl(result);
        const img = new Image();
        img.onload = () => {
          if (img.naturalWidth > 0 && img.naturalHeight > 0) {
            setImgWidth(img.naturalWidth);
            setImgHeight(img.naturalHeight);
          }
        };
        img.src = result;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleConfirm = () => {
    if (!clickPos || !imageUrl) return;

    const newImage: ElementImage = {
      id: `img-${Date.now().toString().slice(-4)}`,
      url: imageUrl,
      x: clickPos.x,
      y: clickPos.y,
      width: imgWidth,
      height: imgHeight,
      style: {
        borderRadius: 16,
        boxShadow: true,
        border: '2px solid rgba(56, 189, 248, 0.6)',
        animation: 'zoom-fade',
      },
    };

    onImageCreated(newImage);
    setIsModalOpen(false);
    setClickPos(null);
  };

  if (!active) return null;

  return (
    <>
      <div
        ref={overlayRef}
        data-testid="image-drawing-overlay"
        className="absolute inset-0 z-20 cursor-crosshair select-none touch-none"
        onPointerDown={handlePointerDown}
      />

      {isModalOpen && clickPos && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl p-5 max-w-md w-full space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                <ImageIcon className="w-4 h-4 text-primary" />
                <span>插入场景插图 (Overlay Image)</span>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-muted-foreground block mb-1 font-medium">图片 URL 或 本地文件</label>
                <div className="flex gap-2">
                  <Input
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://... 或 /system_architecture.png"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-1.5 shrink-0"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>本地</span>
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-muted-foreground block mb-1 font-medium">宽度 (px)</label>
                  <Input
                    type="number"
                    value={imgWidth}
                    onChange={(e) => setImgWidth(parseInt(e.target.value) || 400)}
                  />
                </div>
                <div>
                  <label className="text-muted-foreground block mb-1 font-medium">高度 (px)</label>
                  <Input
                    type="number"
                    value={imgHeight}
                    onChange={(e) => setImgHeight(parseInt(e.target.value) || 300)}
                  />
                </div>
              </div>

              <div className="text-[11px] text-muted-foreground bg-muted/40 p-2.5 rounded-lg border border-border/40">
                <span>📍 放置坐标: X={clickPos.x}, Y={clickPos.y} | 默认启用 <code>zoom-fade</code> 进入动效</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button type="button" size="sm" variant="ghost" onClick={() => setIsModalOpen(false)}>
                取消
              </Button>
              <Button type="button" size="sm" variant="cyan" onClick={handleConfirm} className="gap-1.5">
                <Check className="w-3.5 h-3.5" />
                <span>确认插入</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
