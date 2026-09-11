import { toast } from 'sonner';
import i18n from '@/i18n';
import { saveStoredTTSConfig } from './ttsConfigStore';

export interface AudioErrorToastOptions {
  title?: string;
  message: string;
  details?: string;
  provider?: string;
  model?: string;
  onOpenSettings?: () => void;
  onRetry?: () => void;
}

/**
 * Dispatch an elegant, non-blocking interactive Toast for audio TTS errors
 * Replaces the disruptive modal with an actionable Sonner toast (offline fallback & settings entry)
 */
export function showAudioErrorToast(options: AudioErrorToastOptions): string | number {
  const t = (key: string, defaultText: string) => i18n.t(`audio:${key}`, defaultText);

  const errStr = `${options.title || ''} ${options.message || ''} ${options.details || ''}`.toLowerCase();

  const isHighDemand =
    errStr.includes('503') ||
    errStr.includes('high demand') ||
    errStr.includes('spikes in demand') ||
    errStr.includes('unavailable');

  const isModelUnsupported =
    errStr.includes('不支持语音合成') ||
    errStr.includes('stop') ||
    errStr.includes('仅返回了文本') ||
    errStr.includes('404') ||
    errStr.includes('not found') ||
    errStr.includes('not supported') ||
    errStr.includes('flash-lite');

  const isQuota =
    errStr.includes('429') ||
    errStr.includes('quota') ||
    errStr.includes('resource_exhausted') ||
    errStr.includes('rate limit');

  const isAuth =
    errStr.includes('401') ||
    errStr.includes('403') ||
    errStr.includes('api key') ||
    errStr.includes('unauthenticated') ||
    errStr.includes('permission_denied');

  const isNetwork =
    errStr.includes('failed to fetch') ||
    errStr.includes('network') ||
    errStr.includes('load failed') ||
    errStr.includes('econnrefused');

  let title = options.title;
  let description = options.message;

  if (isHighDemand) {
    title = t('errorDiagnoseHighDemandBadge', '服务商临时繁忙 (503)');
    description = `${t('errorDiagnoseHighDemandDesc', 'Google Gemini 官方语音服务当前正遭遇临时并发高峰（Spikes in demand）。这通常是短期的服务商侧波动。')} ${options.message}`;
  } else if (isModelUnsupported) {
    title = t('errorDiagnoseModelUnsupportedBadge', '模型功能不符 (不支持 TTS)');
    description = `${t('errorDiagnoseModelUnsupportedDesc', '当前所选模型仅支持文本生成，不支持音频模态输出。')} ${options.message}`;
  } else if (isQuota) {
    title = t('errorDiagnoseQuotaBadge', '请求超频或额度不足 (429)');
    description = `${t('errorDiagnoseQuotaDesc', 'API 额度已耗尽或单位时间请求并发超出服务商阈值限制。')} ${options.message}`;
  } else if (isAuth) {
    title = t('errorDiagnoseAuthBadge', 'API Key 无效或未授权');
    description = `${t('errorDiagnoseAuthDesc', '服务商拒绝了本次请求，API 密钥可能已过期、填写有误或未开启相应权限。')} ${options.message}`;
  } else if (isNetwork) {
    title = t('errorDiagnoseNetworkBadge', '网络连接异常');
    description = `${t('errorDiagnoseNetworkDesc', '未能连接到语音服务商服务器，请求被网络断开或代理拦截。')} ${options.message}`;
  }

  if (!title) {
    title = t('toastAudioErrorTitle', '语音合成遇到问题');
  }

  return toast.error(title, {
    id: 'focusflow-audio-error-toast',
    duration: 8000,
    description,
    action: {
      label: t('toastSwitchToOffline', '⚡ 转为离线'),
      onClick: () => {
        saveStoredTTSConfig({ mode: 'offline' });
        toast.success(t('toastSwitchedToOfflineSuccess', '已切换为离线语音朗读 (Web Speech)'), {
          description: t('toastSwitchedToOfflineDesc', '无需外部 API Key，可直接在时间轴与检查器中继续演播。'),
          duration: 4000,
        });
        options.onRetry?.();
      },
    },
    cancel: options.onOpenSettings
      ? {
          label: t('toastOpenSettings', '配音设置'),
          onClick: () => {
            options.onOpenSettings?.();
          },
        }
      : undefined,
  });
}
