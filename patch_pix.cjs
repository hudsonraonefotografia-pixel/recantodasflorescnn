const fs = require('fs');
let c = fs.readFileSync('src/pages/Payment.tsx', 'utf8');

// Fix: Don't navigate away for pending/in_process (PIX) - let the Brick show the QR code
c = c.replace(
  /if \(data\.status === "approved" \|\| data\.status === "in_process" \|\| data\.status === "pending"\) \{\s*toast\.success\("Pagamento iniciado com sucesso!"\);\s*clearCart\(\);\s*navigate\(`\/home\?payment=\$\{data\.status\}`\);/,
  `if (data.status === "approved") {
                            toast.success("Pagamento aprovado! 🎉");
                            clearCart();
                            navigate("/home?payment=approved");
                          } else if (data.status === "pending" || data.status === "in_process") {
                            toast.success("PIX gerado! Copie o código abaixo para pagar.");`
);

fs.writeFileSync('src/pages/Payment.tsx', c);
console.log('Patched!');
