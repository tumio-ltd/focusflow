import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { StudioVoiceRecorder } from '@/services/audio/StudioVoiceRecorder';
import { useProjectStore } from '@/stores/useProjectStore';
import { Button } from '@/components/ui';
import { Mic, MicOff, Square, BookmarkPlus, Play, CheckCircle2, X } from 'lucide-react';
import type { AudioTrackConfig } from '@focusflow/dsl';

interface VoiceoverPreflightModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VoiceoverPreflightModal: React.FC<VoiceoverPreflightModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { dsl, setAudioTrack, updateSceneDuration } = useProjectStore();
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [echoCancel, setEchoCancel] = useState(true);
  const [noiseSuppress, setNoiseSuppress] = useState(true);
  const [vuLevel, setVuLevel] = useState(0);
  const [vuDbfs, setVuDbfs] = useState(-60);

  // States: 'idle' | 'preflight' | 'countdown' | 'recording' | 'finished'
  const [recordState, setRecordState] = useState<'idle' | 'preflight' | 'countdown' | 'recording' | 'finished'>('idle');
  const [countdown, setCountdown] = useState(3);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [markersCount, setMarkersCount] = useState(0);

  const recorderRef = useRef<StudioVoiceRecorder | null>(null);

  // Initialize and load devices when modal opens
  useEffect(() => {
    if (!isOpen) {
      if (recorderRef.current) {
        recorderRef.current.stopPreflight();
        recorderRef.current = null;
      }
      setRecordState('idle');
      return;
    }

    (async () => {
      const devs = await StudioVoiceRecorder.getAudioInputDevices();
      setDevices(devs);
      if (devs.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(devs[0].deviceId);
      }

      // Start preflight for VU meter
      const rec = new StudioVoiceRecorder({
        deviceId: devs[0]?.deviceId,
        echoCancellation: echoCancel,
        noiseSuppression: noiseSuppress,
        onVuLevel: (level, dbfs) => {
          setVuLevel(level);
          setVuDbfs(dbfs);
        },
        onTick: (ms) => {
          setElapsedMs(ms);
        },
      });

      recorderRef.current = rec;
      try {
        await rec.startPreflight();
        setRecordState('preflight');
        // Re-enumerate devices after microphone permission is granted to get real hardware labels
        const activeDevs = await StudioVoiceRecorder.getAudioInputDevices();
        if (activeDevs.length > 0) {
          setDevices(activeDevs);
          if (!selectedDeviceId && activeDevs[0]?.deviceId) {
            setSelectedDeviceId(activeDevs[0].deviceId);
          }
        }
      } catch (err) {
        console.warn('Microphone access denied or unavailable in preflight:', err);
      }
    })();

    return () => {
      if (recorderRef.current) {
        recorderRef.current.stopPreflight();
      }
    };
  }, [isOpen]);

  // Handle countdown before recording
  useEffect(() => {
    if (recordState !== 'countdown') return;

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((c) => c - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Countdown complete, start actual recording
      (async () => {
        if (recorderRef.current) {
          await recorderRef.current.start();
          setRecordState('recording');
        }
      })();
    }
  }, [recordState, countdown]);

  // Global hotkey 'M' for Punch-in Marker
  useEffect(() => {
    if (recordState !== 'recording') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'm' || e.key === 'M') {
        punchMarker();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [recordState]);

  const handleDeviceChange = async (devId: string) => {
    setSelectedDeviceId(devId);
    if (recorderRef.current && (recordState === 'preflight' || recordState === 'idle')) {
      recorderRef.current.stopPreflight();
      const rec = new StudioVoiceRecorder({
        deviceId: devId,
        echoCancellation: echoCancel,
        noiseSuppression: noiseSuppress,
        onVuLevel: (level, dbfs) => {
          setVuLevel(level);
          setVuDbfs(dbfs);
        },
        onTick: (ms) => {
          setElapsedMs(ms);
        },
      });
      recorderRef.current = rec;
      try {
        await rec.startPreflight();
      } catch (err) {
        console.warn('Switch mic preflight error:', err);
      }
    }
  };

  const startCountdown = () => {
    setCountdown(3);
    setRecordState('countdown');
  };

  const punchMarker = () => {
    if (recorderRef.current && recordState === 'recording') {
      const count = markersCount + 1;
      recorderRef.current.punchInMarker(`分幕打点 #${count}`, count - 1);
      setMarkersCount(count);
    }
  };

  const stopAndCommit = async () => {
    if (!recorderRef.current) return;
    const result = await recorderRef.current.stop();

    const trackUrl = URL.createObjectURL(result.blob);
    const newTrack: AudioTrackConfig = {
      id: `track-mic-${Date.now()}`,
      name: '演播麦克风解说录音',
      url: trackUrl,
      durationMs: result.durationMs,
      volume: 1.0,
      muted: false,
      markers: result.markers,
    };

    setAudioTrack(newTrack);

    // If punch-in markers exist, automatically stretch scenes to match real intervals!
    if (result.markers.length > 0) {
      let prevTimeMs = 0;
      result.markers.forEach((marker, idx) => {
        if (idx < dsl.scenes.length) {
          const duration = marker.timeMs - prevTimeMs;
          if (duration > 500) {
            updateSceneDuration(idx, duration);
          }
          prevTimeMs = marker.timeMs;
        }
      });
      // Last scene duration
      if (result.markers.length < dsl.scenes.length) {
        const lastIdx = result.markers.length;
        const remainMs = Math.max(1000, result.durationMs - prevTimeMs);
        updateSceneDuration(lastIdx, remainMs);
      }
    }

    onClose();
  };

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      data-testid="voiceover-preflight-modal"
    >
      <div className="relative w-full max-w-lg max-h-[90vh] bg-panel border border-border rounded-xl shadow-2xl overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2">
            <Mic className="w-5 h-5 text-primary animate-pulse" />
            <h3 className="text-sm font-semibold text-foreground">同屏演播麦克风录音器</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          {/* Countdown Overlay */}
          {recordState === 'countdown' && (
            <div className="py-8 flex flex-col items-center justify-center space-y-2">
              <div className="text-6xl font-black text-primary animate-ping">
                {countdown > 0 ? countdown : 'GO!'}
              </div>
              <p className="text-xs text-muted-foreground">准备开始演播讲解...</p>
            </div>
          )}

          {/* Recording Mode Active */}
          {recordState === 'recording' && (
            <div className="py-4 flex flex-col items-center justify-center space-y-3 bg-red-950/20 border border-red-900/40 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                <span className="text-xs font-mono font-semibold text-red-400">
                  正在演播录音中: {(elapsedMs / 1000).toFixed(1)}s
                </span>
              </div>
              <div className="text-[11px] text-muted-foreground">
                分幕打点数量: <span className="text-foreground font-mono font-bold">{markersCount}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={punchMarker}
                className="border-primary/50 text-primary gap-1.5 shadow-sm"
              >
                <BookmarkPlus className="w-4 h-4" />
                打入分幕转场标记 (快捷键: M)
              </Button>
            </div>
          )}

          {/* Device & VU Controls (During Preflight / Idle) */}
          {(recordState === 'preflight' || recordState === 'idle') && (
            <>
              {/* Microphone Selector */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  输入音频设备
                </label>
                <select
                  value={selectedDeviceId}
                  onChange={(e) => handleDeviceChange(e.target.value)}
                  className="w-full h-8 text-xs bg-muted/40 border border-border rounded-md px-2.5 text-foreground focus:outline-none focus:border-primary"
                >
                  {devices.map((d, idx) => (
                    <option key={d.deviceId || idx} value={d.deviceId}>
                      {d.label || (d.deviceId ? `麦克风 (${d.deviceId.slice(0, 8)})` : `系统默认麦克风`)}
                    </option>
                  ))}
                  {devices.length === 0 && <option value="">系统默认麦克风</option>}
                </select>
              </div>

              {/* Audio Enhancement Switches */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={echoCancel}
                    onChange={(e) => setEchoCancel(e.target.checked)}
                    className="accent-primary"
                  />
                  <span>回声消除 (AEC)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={noiseSuppress}
                    onChange={(e) => setNoiseSuppress(e.target.checked)}
                    className="accent-primary"
                  />
                  <span>背景降噪 (ANS)</span>
                </label>
              </div>
            </>
          )}

          {/* Real-time Dynamic VU Meter Bar */}
          <div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
              <span>立体声 VU 电平监视:</span>
              <span className="font-mono">{vuDbfs} dBFS</span>
            </div>
            <div className="h-3 w-full bg-slate-900 rounded overflow-hidden p-0.5 border border-border/50 flex">
              <div
                className="h-full rounded-sm transition-all duration-75"
                style={{
                  width: `${Math.round(vuLevel * 100)}%`,
                  background:
                    vuLevel > 0.85
                      ? 'linear-gradient(to right, #10b981 60%, #f59e0b 85%, #ef4444 100%)'
                      : vuLevel > 0.6
                      ? 'linear-gradient(to right, #10b981 70%, #f59e0b 100%)'
                      : '#10b981',
                }}
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border bg-muted/10">
          <Button variant="secondary" size="sm" onClick={onClose}>
            取消
          </Button>

          {recordState === 'recording' ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={stopAndCommit}
              className="gap-1.5 shadow-md"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              完成录制并校准时间轴
            </Button>
          ) : (
            <Button
              variant="cyan"
              size="sm"
              onClick={startCountdown}
              className="gap-1.5 shadow-md"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              3-2-1 开启同屏演播录音
            </Button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
