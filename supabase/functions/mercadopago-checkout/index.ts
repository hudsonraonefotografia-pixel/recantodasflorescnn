import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    if (!authHeader) throw new Error("Missing Authorization header");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabaseClient.auth.getUser(token);
    
    if (!user) throw new Error("User not authenticated");

    const reqBody = await req.json();
    if (reqBody.action === "process") {
      const ACCESS_TOKEN = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
      const response = await fetch("https://api.mercadopago.com/v1/payments", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
          "X-Idempotency-Key": crypto.randomUUID()
        },
        body: JSON.stringify(reqBody.formData)
      });
      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const { items, total } = reqBody;
    const purchaseId = crypto.randomUUID();
    if (!items || !total) throw new Error("items and total are required");

    const ACCESS_TOKEN = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!ACCESS_TOKEN) throw new Error("MERCADO_PAGO_ACCESS_TOKEN not configured");

    const preferenceData = {
      items: items.map((i: any) => ({
        title: i.name,
        quantity: i.quantity,
        unit_price: Number(i.price),
        currency_id: "BRL"
      })),
      payer: {
        email: user.email
      },
      back_urls: {
        success: `${req.headers.get("origin")}/home?payment=success`,
        failure: `${req.headers.get("origin")}/home?payment=failure`,
        pending: `${req.headers.get("origin")}/home?payment=pending`
      },
      auto_return: "approved",
      external_reference: purchaseId
    };

    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(preferenceData)
    });

    const preference = await response.json();
    
    if (!response.ok) {
      throw new Error(`Mercado Pago API error: ${JSON.stringify(preference)}`);
    }

    // Save purchase history as pending
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    await serviceClient.from("purchase_history").insert({
      id: purchaseId,
      user_id: user.id,
      items: JSON.stringify(items),
      total,
      payment_method: "mercadopago",
      status: "pending",
    });

    return new Response(JSON.stringify({ url: preference.init_point, preferenceId: preference.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
