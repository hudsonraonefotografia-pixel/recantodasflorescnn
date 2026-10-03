const fs = require('fs');
let c = fs.readFileSync('src/pages/Assinaturas.tsx', 'utf8');

c = c.replace(
  /Escolha o plano ideal.*?<\/p>\s*<\/div>/,
  `Escolha o plano ideal para voc\u00EA</p>
        </div>

        <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 mb-6 text-sm text-foreground shadow-sm">
          <div className="flex gap-2">
            <AlertTriangle size={18} className="text-primary flex-shrink-0 mt-0.5" />
            <p className="text-muted-foreground">
              <strong className="font-bold text-primary">Importante:</strong> O valor pago pela assinatura <strong>n\u00E3o \u00E9 resgat\u00E1vel</strong> e n\u00E3o funciona como credi\u00E1rio ou saldo na loja. Ele serve exclusivamente como um benef\u00EDcio para manter os descontos e ofertas garantidas durante o per\u00EDodo da sua assinatura.
            </p>
          </div>
        </div>`
);

fs.writeFileSync('src/pages/Assinaturas.tsx', c);
console.log('Patched Assinaturas.tsx again!');
