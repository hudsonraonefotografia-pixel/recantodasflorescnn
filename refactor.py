import re

with open('src/pages/Login.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add imports and Layout
content = content.replace(
    'import { supabase } from "@/integrations/supabase/client";',
    'import { supabase } from "@/integrations/supabase/client";\nimport { InstallPWA } from "@/components/InstallPWA";'
)

layout = '''
const LoginLayout = ({ children }: { children: React.ReactNode }) => (
  <div 
    className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center justify-center px-6"
    style={{
      backgroundImage: 'url("https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1080&q=80")',
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }}
  >
    <div className="absolute inset-0 bg-background/85 backdrop-blur-[2px] z-0" />
    <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
      {children}
    </div>
  </div>
);
'''

content = content.replace(
    'type LoginMode = "select" | "cliente" | "admin";',
    layout + '\ntype LoginMode = "select" | "cliente" | "admin";'
)

# 1. Select Mode
p1 = r'(if \(mode === "select"\) \{\s*return \(\s*)<div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center justify-center \npx-6">.*?(<motion\.img.*?className="w-full max-w-sm object-contain mb-6)" />.*?(<h1 className="text-2xl font-display text-gold-gradient mb-2">).*?(<p className="text-muted-foreground text-sm mb-10">).*?(<div className="w-full max-w-sm space-y-4">.*?<Button\s*onClick=\{.*?setMode\("cliente"\).*?</Button>).*?(<Button\s*onClick=\{.*?setMode\("admin"\).*?</Button>)\s*</div>\s*</motion\.div>\s*</div>\s*</div>'
r1 = r'''\1<LoginLayout>
        \2 drop-shadow-xl" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={logoReady ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col items-center w-full"
        >
          <h1 className="text-2xl font-display text-white drop-shadow-md text-center mb-2">Bem-vindo ao Recanto das Flores</h1>
          <p className="text-white/90 text-sm mb-8 drop-shadow-md text-center">Direto da Granja para sua Mesa!</p>

          \5
            <div className="w-full">
              <InstallPWA inline={true} />
            </div>
            \6
          </div>
        </motion.div>
      </LoginLayout>'''
content = re.sub(p1, r1, content, flags=re.DOTALL)

# 2. Admin pending popup
p2 = r'(if \(showAdminPendingPopup\) \{\s*return \(\s*)<div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">\s*(<motion\.div.*?</motion\.div>)\s*</div>'
r2 = r'\1<LoginLayout>\n        \2\n      </LoginLayout>'
content = re.sub(p2, r2, content, flags=re.DOTALL)

# 3. Admin Mode
p3 = r'(if \(mode === "admin"\) \{\s*return \(\s*)<div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center justify-center \npx-6">.*?<div className="relative z-10 w-full max-w-sm flex flex-col items-center">\s*(<button.*?← Voltar\s*</button>\s*<img.*?/>\s*<div.*?</form>\s*<div.*?</button>\s*</div>)\s*</div>\s*</div>'
r3 = r'\1<LoginLayout>\n        \2\n      </LoginLayout>'
content = re.sub(p3, r3, content, flags=re.DOTALL)

# 4. Client mode
p4 = r'(// 🟢 Client Login/Signup 🟢\s*return \(\s*)<div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center justify-center \npx-6">.*?<div className="relative z-10 w-full max-w-sm flex flex-col items-center">\s*(<button.*?← Voltar\s*</button>\s*<img.*?/>\s*<h1.*?</button>\s*</div>)\s*</div>\s*</div>'
r4 = r'\1<LoginLayout>\n      \2\n      </LoginLayout>'
content = re.sub(p4, r4, content, flags=re.DOTALL)

with open('src/pages/Login.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
