const fs = require('fs');
let c = fs.readFileSync('src/pages/Payment.tsx', 'utf8');

// Fix: extract formData from the Brick param object
c = c.replace(
  /onSubmit=\{async \(param\) =>/,
  'onSubmit={async (param: any) =>'
);

c = c.replace(
  'body: { action: "process", formData: param }',
  'body: { action: "process", formData: param.formData || param }'
);

fs.writeFileSync('src/pages/Payment.tsx', c);
console.log('Done!');
