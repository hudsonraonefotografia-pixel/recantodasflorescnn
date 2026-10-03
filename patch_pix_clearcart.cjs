const fs = require('fs');
let c = fs.readFileSync('src/pages/Payment.tsx', 'utf8');

// Stop early return if pixData exists
c = c.replace(
  'if (items.length === 0) {',
  'if (items.length === 0 && !pixData) {'
);

// Remove clearCart from the initial PIX success handler
c = c.replace(
  '                              clearCart();\n                            }\n                          } else {',
  '                            }\n                          } else {'
);

// Add clearCart to the Voltar button
c = c.replace(
  '          <button \n            onClick={() => navigate("/home?payment=pending")}',
  '          <button \n            onClick={() => { clearCart(); navigate("/home?payment=pending"); }}'
);

fs.writeFileSync('src/pages/Payment.tsx', c);
console.log('Fixed PIX disappearing cart bug!');
