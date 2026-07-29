"use client";

import { supabase } from "@/integrations/supabase/client";

const HH_OAUTH_AUTHORIZE_URL = "https://hh.ru/oauth/authorize";
const STATE_STORAGE_KEY = "hh_oauth_state";

function getClientId(): string {
  return (import.meta.env.VITE_HH_CLIENT_ID as string) || "";
}

function getRedirectUri(): string {
  const fromEnv = import.meta.env.VITE_HH_REDIRECT_URI as string;
  if (fromEnv) return fromEnv;
  if (typeof window !== "undefined") return `${window.location.origin}/`;
  return "";
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

export interface HHTokenExchangeResult {
  success: boolean;
  error?: string;
}

/**
 * Обмен authorization_code на access_token.
 * Выполняется ТОЛЬКО через серверный слой (Supabase Edge Function "hh-oauth"),
 * где хранится HH_CLIENT_SECRET. Секрет никогда не попадает во фронтенд.
 */
export async function exchangeCodeForToken(code: string): Promise<HHTokenExchangeResult> {
  if (!supabase) {
    return { success: false, error: "SUPABASE_NOT_CONFIGURED" };
  }
  try {
    const { data, error } = (await supabase.functions.invoke("hh-oauth", {
      body: { action: "exchange", code, redirect_uri: getRedirectUri() },
    })) as {
      data: { success?: boolean; error?: string } | null;
      error: { message: string } | null;
    };

    if (error) return { success: false, error: error.message };
    return { success: Boolean(data?.success), error: data?.error };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "UNKNOWN_ERROR" };
  }
}