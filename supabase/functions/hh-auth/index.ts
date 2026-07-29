/// <reference path="../deno-env.d.ts" />
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
};

const HH_TOKEN_URL = "https://oauth.hh.ru/token";

function hhSecret(): string {
  const secret = Deno.env.get("HH_CLIENT_SECRET");
  if (!secret) {
    throw new Error("HH_CLIENT_SECRET is not configured on the server");
  }
  return secret;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

async function exchangeCode(code: string, redirectUri: string): Promise<TokenResponse> {
  const clientId = Deno.env.get("HH_CLIENT_ID") || "";
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: clientId,
    client_secret: hhSecret(),
    redirect_uri: redirectUri,
  });

  const res = await fetch(HH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const data = await res.json();
  if (!res.ok) {
    const msg = data?.error_description || data?.error || `HH token exchange failed (${res.status})`;
    throw new Error(msg);
  }
  return data as TokenResponse;
}

async function refreshToken(refreshToken: string): Promise<TokenResponse> {
  const clientId = Deno.env.get("HH_CLIENT_ID") || "";
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: hhSecret(),
  });

  const res = await fetch(HH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const data = await res.json();
  if (!res.ok) {
    const msg = data?.error_description || data?.error || `HH refresh failed (${res.status})`;
    throw new Error(msg);
  }
  return data as TokenResponse;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { action } = body as { action?: string };

    if (action === "exchange") {
      const { code, redirect_uri } = body;
      if (!code || !redirect_uri) {
        return new Response(JSON.stringify({ success: false, error: "MISSING_CODE_OR_REDIRECT" }), {
          status: 400, headers: corsHeaders,
        });
      }
      const token = await exchangeCode(code, redirect_uri);
      return new Response(JSON.stringify({ success: true, ...token }), {
        status: 200, headers: corsHeaders,
      });
    }

    if (action === "refresh") {
      const { refresh_token } = body;
      if (!refresh_token) {
        return new Response(JSON.stringify({ success: false, error: "MISSING_REFRESH_TOKEN" }), {
          status: 400, headers: corsHeaders,
        });
      }
      const token = await refreshToken(refresh_token);
      return new Response(JSON.stringify({ success: true, ...token }), {
        status: 200, headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({ success: false, error: "UNKNOWN_ACTION" }), {
      status: 400, headers: corsHeaders,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "INTERNAL_ERROR";
    console.error("[HH-AUTH]", message);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500, headers: corsHeaders,
    });
  }
});