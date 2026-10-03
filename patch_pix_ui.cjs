const fs = require('fs');
let c = fs.readFileSync('src/pages/Payment.tsx', 'utf8');

c = c.replace(
  '} else if (data.status === "pending" || data.status === "in_process") {',
  `} else if (data.status === "pending" || data.status === "in_process") {
                            if (data.point_of_interaction?.transaction_data) {
                              setPixData({
                                qrCode: data.point_of_interaction.transaction_data.qr_code,
                                qrCodeBase64: data.point_of_interaction.transaction_data.qr_code_base64
                              });
                              clearCart();
                            }`
);

// Add Pix UI before the <DeliveryAddressDialog>
c = c.replace(
  '      <DeliveryAddressDialog',
  `      {pixData && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
          <h2 className="text-2xl font-display text-gold-gradient mb-4">Pagamento PIX</h2>
          <p className="text-muted-foreground mb-6">Escaneie o QR Code abaixo no app do seu banco ou copie o código.</p>
          
          <div className="bg-white p-4 rounded-xl mb-6">
            <img src={\`data:image/jpeg;base64,\${pixData.qrCodeBase64}\`} alt="QR Code PIX" className="w-48 h-48" />
          </div>
          
          <button 
            onClick={() => {
              navigator.clipboard.writeText(pixData.qrCode);
              toast.success("Código PIX copiado!");
            }}
            className="w-full max-w-sm gradient-gold text-primary-foreground font-bold rounded-xl h-12 mb-4"
          >
            Copiar Código PIX
          </button>
          
          <button 
            onClick={() => navigate("/home?payment=pending")}
            className="w-full max-w-sm border border-primary text-primary font-semibold rounded-xl h-12"
          >
            Já paguei / Voltar ao Início
          </button>
        </div>
      )}
      
      <DeliveryAddressDialog`
);

fs.writeFileSync('src/pages/Payment.tsx', c);
console.log('Patched PIX Screen!');
