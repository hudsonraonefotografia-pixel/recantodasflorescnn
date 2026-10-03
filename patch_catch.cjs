const fs = require('fs');
let c = fs.readFileSync('src/pages/Payment.tsx', 'utf8');

c = c.replace(/if \(data\.status === "approved"[\s\S]*?\.catch\(\(err\) =>/m, `if (data.status === "approved" || data.status === "in_process" || data.status === "pending") {
                            toast.success("Pagamento iniciado com sucesso!");
                            clearCart();
                            navigate(\`/home?payment=\${data.status}\`);
                          } else {
                            toast.error(\`Erro: \${data.message || data.error || "Pagamento recusado"}\`);
                            console.error("MP Error:", data);
                          }
                        })
                        .catch((err) =>`);

fs.writeFileSync('src/pages/Payment.tsx', c);
