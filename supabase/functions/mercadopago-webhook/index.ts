import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("topic") || url.searchParams.get("type");
    const id = url.searchParams.get("id") || url.searchParams.get("data.id");

    const bodyText = await req.text();
    let body = {};
    try {
      body = JSON.parse(bodyText);
    } catch (e) {
      // Body might be empty
    }

    const eventAction = body.action || action;
    const paymentId = body?.data?.id || id;

    if (eventAction === "payment.created" || eventAction === "payment.updated") {
      const ACCESS_TOKEN = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
      
      // Busca detalhes do pagamento no Mercado Pago
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { "Authorization": `Bearer ${ACCESS_TOKEN}` }
      });
      const paymentData = await mpResponse.json();

      if (paymentData.status === "approved") {
        const purchaseId = paymentData.external_reference;

        if (purchaseId) {
          const serviceClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
          );

          // Atualiza status do pedido
          await serviceClient.from("purchase_history").update({
            status: "approved"
          }).eq("id", purchaseId);

          // Cria notificação para o Admin
          await serviceClient.from("admin_notifications").insert({
            title: "Novo Pagamento Aprovado! 🎉",
            message: `Pagamento aprovado via Mercado Pago no valor de R$ ${paymentData.transaction_amount}`,
            type: "payment"
          });
        }
      }
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
