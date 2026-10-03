const fs = require('fs');
let c = fs.readFileSync('src/pages/Historico.tsx', 'utf8');

c = c.replace(
  '  const methodLabel = (m: string) => {',
  `  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending": return { text: "Aguardando Pagamento", color: "bg-orange-500/20 text-orange-400" };
      case "approved": return { text: "Preparando Pedido", color: "bg-blue-500/20 text-blue-400" };
      case "processing": return { text: "Produzindo", color: "bg-yellow-500/20 text-yellow-500" };
      case "shipping": return { text: "A Caminho", color: "bg-purple-500/20 text-purple-400" };
      case "delivered": return { text: "Entregue", color: "bg-green-500/20 text-green-400" };
      default: return { text: status, color: "bg-gray-500/20 text-gray-400" };
    }
  };

  const methodLabel = (m: string) => {`
);

c = c.replace(
  '                    <div className="flex items-center gap-1.5 text-xs">\n                      <CreditCard size={14} className="text-muted-foreground" />\n                      <span className="text-muted-foreground">{methodLabel(purchase.payment_method)}</span>\n                    </div>',
  `                    <div className="flex items-center gap-2">
                      <span className={\`text-[10px] font-bold px-2 py-0.5 rounded-full \${getStatusLabel(purchase.status).color}\`}>
                        {getStatusLabel(purchase.status).text}
                      </span>
                    </div>`
);

fs.writeFileSync('src/pages/Historico.tsx', c);
console.log('Patched Historico.tsx to include Status!');
