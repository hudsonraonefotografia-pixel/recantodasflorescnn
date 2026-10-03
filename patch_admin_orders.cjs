const fs = require('fs');
let c = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

c = c.replace(
  'import { AdminSidebar, AdminSidebarToggle } from "@/components/AdminSidebar";',
  'import { AdminSidebar, AdminSidebarToggle } from "@/components/AdminSidebar";\nimport { AdminOrders } from "@/components/AdminOrders";'
);

c = c.replace(
  '<TabsTrigger value="users" className="text-[10px] relative">',
  '<TabsTrigger value="orders" className="text-[10px]">🛒 Pedidos</TabsTrigger>\n              <TabsTrigger value="users" className="text-[10px] relative">'
);

c = c.replace(
  'grid-cols-4 bg-secondary/50',
  'grid-cols-5 bg-secondary/50'
);

c = c.replace(
  '<TabsContent value="users">',
  '<TabsContent value="orders">\n            <AdminOrders />\n          </TabsContent>\n\n          <TabsContent value="users">'
);

fs.writeFileSync('src/pages/Admin.tsx', c);
console.log('Patched Admin.tsx to include AdminOrders!');
