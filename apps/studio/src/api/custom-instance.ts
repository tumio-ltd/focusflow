import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';

// Storage keys for authentication tokens and workspace context
const ACCESS_TOKEN_KEY = 'focusflow_access_token';
const REFRESH_TOKEN_KEY = 'focusflow_refresh_token';
const ACTIVE_WORKSPACE_KEY = 'focusflow_active_workspace';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// Token helper functions
export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setAuthTokens(tokens: AuthTokens): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

export function clearAuthTokens(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function getActiveWorkspaceId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACTIVE_WORKSPACE_KEY);
}

export function setActiveWorkspaceId(workspaceId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACTIVE_WORKSPACE_KEY, workspaceId);
}

// Axios instance
export const AXIOS_INSTANCE = axios.create({
  baseURL: (typeof process !== 'undefined' && process.env?.VITE_API_URL) ||
           (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
           'http://localhost:3000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Concurrent refresh token mutex & queue
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

// 1. Request Interceptor: Inject App ID, Workspace ID, and Bearer token
AXIOS_INSTANCE.interceptors.request.use(
  (config) => {
    config.headers = config.headers || {};
    // Monorepo standard App ID header
    config.headers['X-App-Id'] = 'focusflow';

    const token = getAccessToken();
    if (token && !config.headers['Authorization']) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    const workspaceId = getActiveWorkspaceId();
    if (workspaceId && !config.headers['X-Workspace-Id']) {
      config.headers['X-Workspace-Id'] = workspaceId;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// 2. Response Interceptor: 401 Silent Token Refresh & Concurrent Queue
AXIOS_INSTANCE.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Only intercept 401s if request hasn't been retried yet and not already calling refresh
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/api/platform/auth/refresh')
    ) {
      if (isRefreshing) {
        // Queue concurrent requests while token is actively refreshing
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers['Authorization'] = `Bearer ${token}`;
            }
            return AXIOS_INSTANCE(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        clearAuthTokens();
        isRefreshing = false;
        return Promise.reject(error);
      }

      try {
        const refreshResponse = await axios.post(
          `${AXIOS_INSTANCE.defaults.baseURL}/api/platform/auth/refresh`,
          { refreshToken },
          {
            headers: {
              'Content-Type': 'application/json',
              'X-App-Id': 'focusflow',
            },
          },
        );

        const newAccessToken = refreshResponse.data?.tokens?.accessToken;
        const newRefreshToken = refreshResponse.data?.tokens?.refreshToken || refreshToken;

        if (newAccessToken) {
          setAuthTokens({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
          });

          AXIOS_INSTANCE.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
          if (originalRequest.headers) {
            originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
          }

          processQueue(null, newAccessToken);
          return AXIOS_INSTANCE(originalRequest);
        } else {
          throw new Error('Refresh response missing access token');
        }
      } catch (refreshErr) {
        processQueue(refreshErr as Error, null);
        clearAuthTokens();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

// Custom instance mutator function for Orval
export const customInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<T> => {
  const source = axios.CancelToken.source();
  const promise = AXIOS_INSTANCE({
    ...config,
    ...options,
    cancelToken: source.token,
  }).then(({ data }) => data);

  // @ts-expect-error cancel token attached for abort support
  promise.cancel = () => {
    source.cancel('Query was cancelled');
  };

  return promise;
};

export default customInstance;
