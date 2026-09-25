const fs = require('fs');
let c = fs.readFileSync('src/pages/Payment.tsx', 'utf8');

c = c.replace(
  'fetch("https://api.mercadopago.com/v1/payments", {',
  `supabase.functions.invoke("mercadopago-checkout", {`
);
c = c.replace(
  'headers: {',
  `/* headers: {`
);
c = c.replace(
  '"Content-Type": "application/json",',
  `*/`
);
c = c.replace(
  'Authorization: `Bearer APP_USR-1449171391149187-092512-afee3742158d85011fb4c82eed50fee5-74343311`',
  ''
);
c = c.replace(
  '},',
  ''
);
c = c.replace(
  'body: JSON.stringify(param)',
  'body: { action: "process", formData: param }'
);
c = c.replace(
  '.then((res) => res.json())',
  ''
);
c = c.replace(
  '.then((data) => {',
  '.then(({ data, error }) => { if (error) throw error;'
);

fs.writeFileSync('src/pages/Payment.tsx', c);
