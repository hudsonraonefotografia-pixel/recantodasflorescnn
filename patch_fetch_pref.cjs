const fs = require('fs');
let c = fs.readFileSync('src/pages/Payment.tsx', 'utf8');

c = c.replace(
  'if (data?.preferenceId) {',
  `if (data?.preferenceId) {`
);

c = c.replace(
  '          if (data?.preferenceId) {\n            setPreferenceId(data.preferenceId);\n          }',
  `          if (data?.preferenceId) {
            setPreferenceId(data.preferenceId);
          } else {
            console.error("MP Preference Error:", data);
            toast.error("Erro ao gerar painel: " + JSON.stringify(data));
          }`
);

fs.writeFileSync('src/pages/Payment.tsx', c);
console.log('Patched fetchPreference!');
