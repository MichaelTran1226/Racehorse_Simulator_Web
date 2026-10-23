const ACCESS_KEY = 'equiflow_sim_access_token';
const REFRESH_KEY = 'equiflow_sim_refresh_token';
const USER_KEY = 'equiflow_sim_user';

export const API_BASE_URL =
  (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api';

export function getAccessToken(): string | null {
  try {
    return sessionStorage.getItem(ACCESS_KEY);
  } catch {
    return null;
  }
}

export function getRefreshToken(): string | null {
  try {
    return sessionStorage.getItem(REFRESH_KEY);
  } catch {
    return null;
  }
}

export function getCurrentUser(): any | null {
  try {
    const raw = sessionStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSession(accessToken: string, refreshToken: string, user: any): void {
  try {
    sessionStorage.setItem(ACCESS_KEY, accessToken);
    sessionStorage.setItem(REFRESH_KEY, refreshToken);
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // sessionStorage might be restricted in some environments
  }
}

export function clearSession(): void {
  try {
    sessionStorage.removeItem(ACCESS_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
    sessionStorage.removeItem(USER_KEY);
  } catch {
    // no-op
  }
}

export function isAuthenticated(): boolean {
  return Boolean(getAccessToken());
}

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearSession();
    return null;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        clearSession();
        return null;
      }

      const json = await res.json();
      const data = json.data || json;
      const newAccessToken = data.accessToken || data.token;
      const newRefreshToken = data.refreshToken || refreshToken;

      if (newAccessToken) {
        const user = getCurrentUser();
        setSession(newAccessToken, newRefreshToken, user);
        return newAccessToken;
      }
      clearSession();
      return null;
    } catch {
      clearSession();
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function api<T>(method: string, path: string, body?: any): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  const token = getAccessToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method,
    headers,
  };
  if (body !== undefined) {
    config.body = JSON.stringify(body);
  }

  let res = await fetch(url, config);

  if (res.status === 401 && token) {
    // Try refreshing once
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      res = await fetch(url, config);
    }
  }

  if (!res.ok) {
    let errorMessage = `HTTP ${res.status}: ${res.statusText}`;
    try {
      const errJson = await res.json();
      errorMessage = errJson.message || errJson.error || errorMessage;
    } catch {
      // ignore
    }
    throw new Error(errorMessage);
  }

  const json = await res.json();
  // Standard EquiFlow BE response envelope: { statusCode, success: true, data, timestamp }
  return (json && typeof json === 'object' && 'data' in json ? json.data : json) as T;
}

export async function login(email: string, pass: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: pass }),
  });

  if (!res.ok) {
    let errorMessage = 'Đăng nhập thất bại';
    try {
      const errJson = await res.json();
      errorMessage = errJson.message || errJson.error || errorMessage;
    } catch {
      // ignore
    }
    throw new Error(errorMessage);
  }

  const json = await res.json();
  const data = json.data || json;
  const user = data.user;
  const accessToken = data.accessToken || data.tokens?.accessToken;
  const refreshToken = data.refreshToken || data.tokens?.refreshToken;

  setSession(accessToken, refreshToken, user);
  return { user, accessToken, refreshToken };
}
