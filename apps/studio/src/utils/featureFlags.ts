/**
 * FocusFlow Environment & Feature Flag Guard
 * 
 * Determines whether Cloud / Mode B capabilities (such as Cloud Sharing,
 * Pro Subscriptions, Stripe Portal, and Remote 4K Render Workers) are enabled.
 * 
 * Rules:
 * 1. If running under GitHub Pages, local static file://, or standalone OSS mode without cloud API,
 *    Mode B features default to disabled / hidden to maintain a pure Mode A offline experience.
 * 2. If VITE_ENABLE_MODE_B is explicitly configured, or in local development connecting to api (port 4000),
 *    Mode B features are enabled.
 */

export function isModeBEnabled(): boolean {
  if (typeof window === 'undefined') return false;

  // 1. Explicit env flag
  const envFlag = import.meta.env?.VITE_ENABLE_MODE_B;
  if (envFlag === 'true' || envFlag === '1') return true;
  if (envFlag === 'false' || envFlag === '0') return false;

  // 2. OSS demo / GitHub Pages runtime detection (including custom CNAME static domains)
  const host = window.location.hostname;
  if (
    host.endsWith('github.io') ||
    host === 'focusflow.pages.dev' ||
    host === 'focusflow.tumio.site'
  ) {
    return false;
  }

  // 3. Local dev server connecting to backend or production SaaS deployment
  if (host === 'localhost' || host === '127.0.0.1' || host.includes('focusflow.io')) {
    return true;
  }

  return false;
}
