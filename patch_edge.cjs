const fs = require('fs');
let c = fs.readFileSync('supabase/functions/mercadopago-checkout/index.ts', 'utf8');

c = c.replace(
  'const { items, total } = await req.json();',
  `const reqBody = await req.json();
    if (reqBody.action === "process") {
      const ACCESS_TOKEN = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
      const response = await fetch("https://api.mercadopago.com/v1/payments", {
        method: "POST",
        headers: {
          "Authorization": \`Bearer \${ACCESS_TOKEN}\`,
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
    const { items, total } = reqBody;`
);

fs.writeFileSync('supabase/functions/mercadopago-checkout/index.ts', c);
