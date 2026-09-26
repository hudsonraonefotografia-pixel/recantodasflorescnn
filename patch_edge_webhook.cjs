const fs = require('fs');
let c = fs.readFileSync('supabase/functions/mercadopago-checkout/index.ts', 'utf8');

c = c.replace(
  'const { items, total } = reqBody;',
  `const { items, total } = reqBody;
    const purchaseId = crypto.randomUUID();`
);

c = c.replace(
  'external_reference: user.id',
  'external_reference: purchaseId'
);

c = c.replace(
  'await serviceClient.from("purchase_history").insert({',
  `await serviceClient.from("purchase_history").insert({
      id: purchaseId,`
);

fs.writeFileSync('supabase/functions/mercadopago-checkout/index.ts', c);
