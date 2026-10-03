const fs = require('fs');

// Patch AdminOrders.tsx
let ordersC = fs.readFileSync('src/components/AdminOrders.tsx', 'utf8');
ordersC = ordersC.replace(
  '.select("*, profiles(display_name, endereco, telefone, cidade, cep)")',
  '.select("*, profiles(*)")'
);
fs.writeFileSync('src/components/AdminOrders.tsx', ordersC);

// Patch Admin.tsx
let adminC = fs.readFileSync('src/pages/Admin.tsx', 'utf8');
adminC = adminC.replace(
  '.select("user_id, display_name, user_type, created_at, endereco, cidade, cep, ponto_referencia, whatsapp")',
  '.select("*")'
);
fs.writeFileSync('src/pages/Admin.tsx', adminC);

// Patch DeliveryAddressDialog.tsx
let delC = fs.readFileSync('src/components/DeliveryAddressDialog.tsx', 'utf8');
delC = delC.replace(
  '.select("endereco, cep, cidade, ponto_referencia")',
  '.select("*")'
);
fs.writeFileSync('src/components/DeliveryAddressDialog.tsx', delC);

console.log('Patched selects to * to avoid 400 errors!');
