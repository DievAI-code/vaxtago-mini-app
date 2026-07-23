/// <reference path="../deno-env.d.ts" />
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { action, params } = await req.json();
    const clientId = Deno.env.get("HH_CLIENT_ID");
    const clientSecret = Deno.env.get("HH_CLIENT_SECRET");

    if (!clientId || !clientSecret) {
      return new Response(JSON.stringify({ 
        error: "API_NOT_CONNECTED",
        message: "Источник вакансий ожидает подключения API" 
      }), { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    let url = "https://api.hh.ru/vacancies";
    if (action === "get_one") url = `https://api.hh.ru/vacancies/${params.id}`;
    else if (action === "areas") url = "https://api.hh.ru/areas";
    else if (action === "roles") url = "https://api.hh.ru/professional_roles";

    const queryParams = new URLSearchParams(params || {});
    const finalUrl = action === "search" ? `${url}?${queryParams.toString()}` : url;

    const response = await fetch(finalUrl, {
      headers: {
        "User-Agent": "VaqtaAI/1.0",
        // В будущем здесь будет OAuth токен, если потребуется расширенный доступ
      }
    });

    const data = await response.json();
    return new Response(JSON.stringify(data), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});