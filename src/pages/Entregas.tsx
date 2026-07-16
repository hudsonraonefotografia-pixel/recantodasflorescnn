import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Truck, MapPin } from "lucide-react";

const dias = [
  { dia: "Segunda", bairros: ["Centro", "Boa Vista", "Jardim das Flores"] },
  { dia: "Terça", bairros: ["Vila Nova", "São José", "Industrial"] },
  { dia: "Quarta", bairros: ["Centro", "Alto da Sé", "Cohab"] },
  { dia: "Quinta", bairros: ["São Cristóvão", "Heliópolis", "Maurício de Nassau"] },
  { dia: "Sexta", bairros: ["Todos os bairros"] },
];

const EntregasPage = () => {
  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <main className="max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto px-3 py-4">
        <h2 className="font-display text-2xl font-bold text-foreground mb-4">🚚 Dias de Entrega</h2>

        <div className="space-y-3 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-3 md:space-y-0">
          {dias.map((d) => (
            <div key={d.dia} className="gradient-card border-warm rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Truck size={18} className="text-primary" />
                <h3 className="text-foreground font-bold text-sm">{d.dia}</h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {d.bairros.map((b) => (
                  <span key={b} className="flex items-center gap-1 bg-secondary text-foreground text-xs px-2 py-1 rounded-full">
                    <MapPin size={10} className="text-primary" />
                    {b}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
      <BottomNav />
    </div>
  );
};

export default EntregasPage;
