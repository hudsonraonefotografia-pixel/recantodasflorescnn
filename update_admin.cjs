const fs = require('fs');

let c = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

c = c.replace(
  'const [prodPrecoParceiro, setProdPrecoParceiro] = useState("");',
  'const [prodPrecoParceiro, setProdPrecoParceiro] = useState("");\n  const [prodImage, setProdImage] = useState<File | null>(null);\n  const [prodEmbalagem, setProdEmbalagem] = useState("");'
);

c = c.replace(
  'const handleCreateProduct = async () => {',
  `const handleCreateProduct = async () => {
    if (!prodNome || !prodPreco) { toast.error("Nome e preco sao obrigatorios"); return; }
    setSavingProduct(true);
    let imageUrl = null;
    if (prodImage) {
      const fileExt = prodImage.name.split('.').pop();
      const filePath = \`\${Date.now()}.\${fileExt}\`;
      const { error: uploadError } = await supabase.storage.from("produtos").upload(filePath, prodImage);
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from("produtos").getPublicUrl(filePath);
        imageUrl = urlData.publicUrl;
      }
    }
`
);

c = c.replace(
  'preco_parceiro: prodPrecoParceiro ? parseFloat(prodPrecoParceiro) : null,',
  'preco_parceiro: prodPrecoParceiro ? parseFloat(prodPrecoParceiro) : null,\n        image_url: imageUrl,\n        embalagem_cores: prodEmbalagem,'
);

c = c.replace(
  'setProdVisivelCliente(true); setProdVisivelParceiro(true);',
  'setProdVisivelCliente(true); setProdVisivelParceiro(true);\n      setProdImage(null); setProdEmbalagem("");'
);

// UI replaces
c = c.replace(
  'placeholder="Descrição"',
  'placeholder="Descrição"'
);

c = c.replace(
  'placeholder="Preço cliente *"',
  'placeholder="Preço (Cliente) *"'
);

c = c.replace(
  'placeholder="Preço parceiro"',
  'placeholder="Preço (Assinante)"'
);

c = c.replace(
  '<Textarea placeholder="Descri',
  '<div className="grid grid-cols-2 gap-2"><Input type="file" accept="image/*" onChange={(e) => setProdImage(e.target.files?.[0] || null)} className="bg-secondary border-border pt-2 text-xs" /><Input placeholder="Cores/Embalagem" value={prodEmbalagem} onChange={(e) => setProdEmbalagem(e.target.value)} className="bg-secondary border-border" /></div>\n                <Textarea placeholder="Descri'
);

// Switch UI
c = c.replace(
  'Ativar no Parceiro',
  'Ativar p/ Assinante'
);

fs.writeFileSync('src/pages/Admin.tsx', c);
console.log("Replaced successfully");
