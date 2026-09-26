const fs = require('fs');
let c = fs.readFileSync('src/components/DeliveryAddressDialog.tsx', 'utf8');

c = c.replace(
  '.update({ endereco, cep, cidade, ponto_referencia: pontoReferencia })',
  '.upsert({ user_id: user.id, endereco, cep, cidade, ponto_referencia: pontoReferencia })'
);

c = c.replace(
  '.eq("user_id", user.id);',
  ';'
);

fs.writeFileSync('src/components/DeliveryAddressDialog.tsx', c);
