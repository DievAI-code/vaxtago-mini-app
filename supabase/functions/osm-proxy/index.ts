/// <reference path="../deno-env.d.ts" />
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query, city, viewbox } = await req.json();

    if (!query) {
      return new Response(JSON.stringify({ error: "Query required" }), { status: 400, headers: corsHeaders });
    }

    // Standardize query
    const searchUrl = new URL("https://nominatim.openstreetmap.org/search");
    searchUrl.searchParams.append("q", query);
    searchUrl.searchParams.append("format", "json");
    searchUrl.searchParams.append("addressdetails", "1");
    searchUrl.searchParams.append("limit", "5");
    searchUrl.searchParams.append("accept-language", "ru");

    if (viewbox) {
      searchUrl.searchParams.append("viewbox", viewbox);
      searchUrl.searchParams.append("bounded", "1");
    }

    console.log(`[OSM PROXY] Fetching: ${searchUrl.toString()}`);

    const response = await fetch(searchUrl.toString(), {
      headers: {
        "User-Agent": "VAQTA-AI-Server/1.0 (contact: support@vaxtago.app)",
      },
    });

    if (!response.ok) {
      throw new Error(`OSM HTTP ${response.status}`);
    }

    const results = await response.json();

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});