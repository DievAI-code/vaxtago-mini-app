/// <reference path="../deno-env.d.ts" />
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { source, query, action } = await req.json();

    // Проверка статуса подключения (для админки)
    if (action === "check_status") {
      const hhKey = Deno.env.get("HH_CLIENT_SECRET");
      const trudvsemKey = Deno.env.get("TRUDVSEM_API_KEY");
      return new Response(JSON.stringify({
        hh: !!hhKey,
        trudvsem: !!trudvsemKey
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (source === "hh") {
      const clientId = Deno.env.get("HH_CLIENT_ID");
      const clientSecret = Deno.env.get("HH_CLIENT_SECRET");

      if (!clientSecret) throw new Error("HH_NOT_CONFIGURED");

      const response = await fetch(`https://api.hh.ru/vacancies?text=${encodeURIComponent(query)}&per_page=10`, {
        headers: { "User-Agent": "VaqtaAI/1.0" }
      });
      const data = await response.json();
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (source === "trudvsem") {
      const apiKey = Deno.env.get("TRUDVSEM_API_KEY");
      if (!apiKey) throw new Error("TRUDVSEM_NOT_CONFIGURED");

      const response = await fetch(`https://opendata.trudvsem.ru/api/v1/vacancies/any?text=${encodeURIComponent(query)}&limit=10`);
      const data = await response.json();
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    throw new Error("INVALID_SOURCE");
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});