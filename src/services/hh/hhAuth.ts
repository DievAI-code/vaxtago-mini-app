"use client";

import { supabase } from "@/integrations/supabase/client";

const HH_OAUTH_AUTHORIZE_URL = "https://hh.ru/oauth/authorize";
const STATE_STORAGE_KEY = "hh_oauth_state";
const TOKEN_STORAGE_KEY = "hh_token_data";

interface StoredToken {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

function getClientId(): string {
  return (import.meta.env.VITE_HH_CLIENT_ID as string) || "";
}

function getRedirectUri(): string {
  const fromEnv = import.meta.env.VITE_HH_REDIRECT_URI as string;
  if (fromEnv) return fromEnv;
  if (typeof window !== "undefined") return `${window.location.origin}/`;
  return "";
}

function getStoredToken(): StoredToken | null {
  try {
    const raw = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data.access_token || !data.expires_at) return null;
    return data;
  } catch {
    return null;
  }
}

function saveToken(token: StoredToken): void {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(token));
  } catch {
    // localStorage может быть недоступен
  }
}

function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function generateOAuthState(): string {
  const state =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
  try {
    sessionStorage.setItem(STATE_STORAGE_KEY, state);
  } catch {
    // sessionStorage недоступен
  }
  return state;
}

export function verifyOAuthState(state: string | null): boolean {
  if (!state) return false;
  try {
    return sessionStorage.getItem(STATE_STORAGE_KEY) === state;
  } catch {
    return false;
  }
}

/**
 * Возвращает URL для перенаправления пользователя на страницу авторизации HH.ru.
 * Фронтенд НЕ знает client_secret.
 */
export function loginWithHH(): void {
  const clientId = getClientId();
  if (!clientId) {
    console.error("[HH] VITE_HH_CLIENT_ID is not set");
    return;
  }
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: getRedirectUri(),
    state: generateOAuthState(),
  });
  window.location.href = `${HH_OAUTH_AUTHORIZE_URL}?${params.toString()}`;
}

export function getHHAuthUrl(): string {
  const clientId = getClientId();
  if (!clientId) return "";
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: getRedirectUri(),
    state: generateOAuthState(),
  });
  return `${HH_OAUTH_AUTHORIZE_URL}?${params.toString()}`;
}

export interface HHCallbackParams {
  code: string | null;
  state: string | null;
}

export function parseHHCallback(search: string): HHCallbackParams {
  const params = new URLSearchParams(search);
  return { code: params.get("code"), state: params.get("state") };
}

/**
 * Обмен authorization_code на access_token через серверный Edge Function.
 * client_secret используется ТОЛЬКО на сервере.
 */
export async function exchangeCodeForToken(code: string): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: "SUPABASE_NOT_CONFIGURED" };

  try {
    const { data, error } = (await supabase.functions.invoke("hh-auth", {
      body: { action: "exchange", code, redirect_uri: getRedirectUri() },
    })) as { data: { success?: boolean; error?: string } | null; error: { message: string } | null };

    if (error) return { success: false, error: error.message };
    if (!data?.success) return { success: false, error: data?.error || "EXCHANGE_FAILED" };

    saveToken({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: Date.now() + data.expires_in * 1000,
    });
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "NETWORK_ERROR" };
  }
}

/**
 * Обновляет access_token по refresh_token (через сервер).
 * Вызывается автоматически при истёкшем токене.
 */
export async function refreshToken(): Promise<{ success: boolean; error?: string }> {
  const stored = getStoredToken();
  if (!stored?.refresh_token) return { success: false, error: "NO_REFRESH_TOKEN" };
  if (!supabase) return { success: false, error: "SUPABASE_NOT_CONFIGURED" };

  try {
    const { data, error } = (await supabase.functions.invoke("hh-auth", {
      body: { action: "refresh", refresh_token: stored.refresh_token },
    })) as { data: { success?: boolean; error?: string } | null; error: { message: string } | null };

    if (error) return { success: false, error: error.message };
    if (!data?.success) {
      clearToken();
      return { success: false, error: data?.error || "REFRESH_FAILED" };
    }

    saveToken({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: Date.now() + data.expires_in * 1000,
    });
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "NETWORK_ERROR" };
  }
}

/**
 * Возвращает валидный access_token, при необходимости автоматически обновляя.
 */
export async function getValidAccessToken(): Promise<string | null> {
  const stored = getStoredToken();
  if (!stored) return null;

  // Если токен истёк — пробуем обновить
  if (Date.now() >= stored.expires_at - 60_000) {
    const refreshResult = await refreshToken();
    if (!refreshResult.success) {
      return null;
    }
  }

  const current = getStoredToken();
  return current?.access_token ?? null;
}

export function logoutHH(): void {
  clearToken();
}

export function isHHAuthenticated(): boolean {
  return getStoredToken() !== null;
}