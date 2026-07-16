import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Coins, Trophy, Medal, Award, Crown, Target, Users, Gift, Zap, Copy, Check, Share2, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";

const CashbackPage = () => {
  const { user, profile } = useAuth();
  const [copied, setCopied] = useState(false);

  // Fetch user profile with points
  const { data: userProfile } = useQuery({
    queryKey: ["user-profile-points", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("total_points, available_cashback, referral_code")
        .eq("user_id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Monthly ranking
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const { data: ranking, isLoading: rankingLoading } = useQuery({
    queryKey: ["farm-points-ranking", currentMonth, currentYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("farm_points_monthly")
        .select("user_id, display_name, points")
        .eq("month", currentMonth)
        .eq("year", currentYear)
        .order("points", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  // All-time ranking
  const { data: allTimeRanking } = useQuery({
    queryKey: ["cashback-ranking-alltime"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cashback_points")
        .select("user_id, total_earned, display_name")
        .order("total_earned", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  // Weekly missions
  const { data: missions, isLoading: missionsLoading } = useQuery({
    queryKey: ["weekly-missions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weekly_missions")
        .select("*")
        .eq("active", true)
        .gte("week_end", new Date().toISOString().split("T")[0])
        .order("reward_points", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // User mission progress
  const { data: missionProgress } = useQuery({
    queryKey: ["user-mission-progress", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("user_mission_progress")
        .select("*")
        .eq("user_id", user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Referrals
  const { data: referrals } = useQuery({
    queryKey: ["user-referrals", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("referrals")
        .select("*")
        .eq("referrer_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Special events
  const { data: events } = useQuery({
    queryKey: ["special-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("special_events")
        .select("*")
        .eq("active", true)
        .gte("end_date", new Date().toISOString())
        .order("start_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Category multipliers
  const { data: multipliers } = useQuery({
    queryKey: ["category-multipliers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("category_multipliers")
        .select("*")
        .order("points_per_real", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const totalPoints = userProfile?.total_points || 0;
  const availableCashback = userProfile?.available_cashback || 0;
  const referralCode = userProfile?.referral_code || "";

  const copyReferralLink = () => {
    const link = `${window.location.origin}?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareReferral = async () => {
    const link = `${window.location.origin}?ref=${referralCode}`;
    if (navigator.share) {
      await navigator.share({
        title: "Recanto das Flores - Produtos da Fazenda",
        text: `Use meu código ${referralCode} e ganhe pontos! 🌿`,
        url: link,
      });
    } else {
      copyReferralLink();
    }
  };

  const podiumIcons = [
    <Crown key="1" size={28} className="text-yellow-400 drop-shadow-lg" />,
    <Medal key="2" size={24} className="text-gray-300" />,
    <Award key="3" size={24} className="text-amber-600" />,
  ];

  const podiumBg = [
    "bg-gradient-to-r from-yellow-500/20 to-yellow-400/10 border-yellow-500/40",
    "bg-gradient-to-r from-gray-400/15 to-gray-300/10 border-gray-400/30",
    "bg-gradient-to-r from-amber-600/15 to-amber-500/10 border-amber-600/30",
  ];

  const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

  const getMissionProgress = (missionId: string) => {
    return missionProgress?.find((p) => p.mission_id === missionId);
  };

  const eventTypeLabels: Record<string, { icon: React.ReactNode; color: string }> = {
    double_points: { icon: <Zap size={16} />, color: "text-yellow-400" },
    combo_bonus: { icon: <Gift size={16} />, color: "text-primary" },
    monthly_challenge: { icon: <Trophy size={16} />, color: "text-amber-500" },
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <main className="max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto px-3 py-4">
        <h2 className="font-display text-2xl font-bold text-foreground mb-4">🌾 Pontos da Fazenda</h2>

        {/* Saldo Card */}
        <div className="gradient-card border-warm rounded-xl p-5 text-center mb-4 glow-gold">
          <Coins size={36} className="text-primary mx-auto mb-2" />
          <p className="text-muted-foreground text-xs">Pontos acumulados</p>
          <p className="text-primary font-display font-bold text-3xl">{totalPoints.toLocaleString()}</p>
          <div className="mt-2 flex items-center justify-center gap-1">
            <p className="text-muted-foreground text-xs">Saldo em cashback:</p>
            <p className="text-primary font-bold text-sm">R$ {Number(availableCashback).toFixed(2)}</p>
          </div>
          <p className="text-muted-foreground text-[10px] mt-1">1.000 pontos = R$ 1,00</p>
        </div>

        {/* Multipliers */}
        {multipliers && multipliers.length > 0 && (
          <div className="gradient-card border-warm rounded-xl p-4 mb-4">
            <p className="text-foreground text-sm font-semibold mb-2">⭐ Multiplicadores por categoria</p>
            <div className="grid grid-cols-2 gap-2">
              {multipliers.map((m) => (
                <div key={m.id} className="bg-secondary/50 rounded-lg p-2 flex items-center justify-between">
                  <span className="text-foreground text-xs truncate">{m.category_name}</span>
                  <span className="text-primary font-bold text-xs">{m.points_per_real}x</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Tabs defaultValue="ranking" className="space-y-4">
          <TabsList className="w-full grid grid-cols-4 bg-secondary/50">
            <TabsTrigger value="ranking" className="text-xs">🏆 Ranking</TabsTrigger>
            <TabsTrigger value="missoes" className="text-xs">🎯 Missões</TabsTrigger>
            <TabsTrigger value="indicar" className="text-xs">👥 Indicar</TabsTrigger>
            <TabsTrigger value="eventos" className="text-xs">⚡ Eventos</TabsTrigger>
          </TabsList>

          {/* RANKING TAB */}
          <TabsContent value="ranking" className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Trophy size={20} className="text-primary" />
              <h3 className="font-display text-lg font-bold text-foreground">Ranking Pontos da Fazenda</h3>
            </div>
            <p className="text-muted-foreground text-xs mb-3">
              📅 {monthNames[currentMonth - 1]}/{currentYear} — Reset automático mensal
            </p>

            {rankingLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-xl" />
                ))}
              </div>
            ) : !ranking || ranking.length === 0 ? (
              <div className="gradient-card border-warm rounded-xl p-6 text-center">
                <Trophy size={32} className="text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-muted-foreground text-sm">Nenhum participante este mês.</p>
                <p className="text-muted-foreground text-xs">Faça compras para acumular pontos!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {ranking.map((entry, i) => {
                  const isCurrentUser = entry.user_id === user?.id;
                  const isPodium = i < 3;
                  return (
                    <motion.div
                      key={entry.user_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`rounded-xl p-3 flex items-center gap-3 border ${
                        isPodium ? podiumBg[i] : "gradient-card border-warm"
                      } ${isCurrentUser ? "ring-2 ring-primary/50" : ""}`}
                    >
                      <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center">
                        {isPodium ? podiumIcons[i] : (
                          <span className="text-muted-foreground font-bold text-sm">{i + 1}º</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${isCurrentUser ? "text-primary" : "text-foreground"}`}>
                          {entry.display_name || "Usuário"}
                          {isCurrentUser && <span className="text-xs text-primary ml-1">(você)</span>}
                        </p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="text-primary font-bold text-sm">{entry.points.toLocaleString()} pts</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* All-time ranking */}
            {allTimeRanking && allTimeRanking.length > 0 && (
              <div className="mt-6">
                <h4 className="font-display text-sm font-bold text-foreground mb-2">📊 Histórico Geral (todos os tempos)</h4>
                <div className="space-y-1">
                  {allTimeRanking.map((entry, i) => (
                    <div key={entry.user_id} className="gradient-card border-warm rounded-lg p-2 flex items-center gap-2">
                      <span className="text-muted-foreground text-xs w-6 text-center">{i + 1}º</span>
                      <span className="text-foreground text-xs flex-1 truncate">{entry.display_name || "Usuário"}</span>
                      <span className="text-primary font-bold text-xs">R$ {Number(entry.total_earned).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* MISSÕES TAB */}
          <TabsContent value="missoes" className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Target size={20} className="text-primary" />
              <h3 className="font-display text-lg font-bold text-foreground">Missões da Semana</h3>
            </div>
            <p className="text-muted-foreground text-xs mb-3">
              Atualizado toda segunda-feira. Complete missões para ganhar pontos extras!
            </p>

            {missionsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-xl" />
                ))}
              </div>
            ) : !missions || missions.length === 0 ? (
              <div className="gradient-card border-warm rounded-xl p-6 text-center">
                <Target size={32} className="text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-muted-foreground text-sm">Nenhuma missão ativa esta semana.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {missions.map((mission, i) => {
                  const progress = getMissionProgress(mission.id);
                  const isCompleted = progress?.completed || false;
                  const progressPercent = progress ? Math.min((progress.progress / progress.target) * 100, 100) : 0;

                  return (
                    <motion.div
                      key={mission.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className={`gradient-card border-warm rounded-xl p-4 ${isCompleted ? "border-primary/40" : ""}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="text-foreground text-sm font-semibold">{mission.title}</p>
                          <p className="text-muted-foreground text-xs mt-0.5">{mission.description}</p>
                        </div>
                        <div className="flex-shrink-0 ml-2 text-right">
                          <p className="text-primary font-bold text-sm">+{mission.reward_points.toLocaleString()}</p>
                          <p className="text-muted-foreground text-[10px]">pontos</p>
                        </div>
                      </div>

                      <div className="mt-2">
                        <Progress value={progressPercent} className="h-2" />
                        <div className="flex justify-between mt-1">
                          <span className="text-muted-foreground text-[10px]">
                            {progress ? `${progress.progress}/${progress.target}` : "0/1"}
                          </span>
                          <span className={`text-[10px] font-semibold ${isCompleted ? "text-primary" : "text-muted-foreground"}`}>
                            {isCompleted ? "✅ Concluída" : "🔄 Em andamento"}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* INDICAÇÃO TAB */}
          <TabsContent value="indicar" className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Users size={20} className="text-primary" />
              <h3 className="font-display text-lg font-bold text-foreground">Indique e Ganhe</h3>
            </div>

            <div className="gradient-card border-warm rounded-xl p-4 glow-gold">
              <p className="text-foreground text-sm font-semibold mb-3">🎁 Seu código de indicação</p>
              <div className="flex items-center gap-2 bg-secondary/60 rounded-lg p-3">
                <span className="text-primary font-display font-bold text-lg flex-1 text-center tracking-widest">
                  {referralCode}
                </span>
                <button onClick={copyReferralLink} className="p-2 rounded-lg bg-primary/20 hover:bg-primary/30 transition-colors">
                  {copied ? <Check size={18} className="text-primary" /> : <Copy size={18} className="text-primary" />}
                </button>
                <button onClick={shareReferral} className="p-2 rounded-lg bg-primary/20 hover:bg-primary/30 transition-colors">
                  <Share2 size={18} className="text-primary" />
                </button>
              </div>
            </div>

            <div className="gradient-card border-warm rounded-xl p-4">
              <p className="text-foreground text-sm font-semibold mb-2">📋 Como funciona?</p>
              <div className="space-y-2">
                {[
                  { text: "Amigo se cadastra com seu código", pts: "+1.000 pts" },
                  { text: "Amigo faz a primeira compra", pts: "+4.000 pts" },
                  { text: "Segunda compra no mesmo mês", pts: "+2.000 pts" },
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary text-xs font-bold">{i + 1}</span>
                    </div>
                    <span className="text-muted-foreground text-xs flex-1">{step.text}</span>
                    <span className="text-primary font-bold text-xs">{step.pts}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Referrals list */}
            {referrals && referrals.length > 0 && (
              <div>
                <p className="text-foreground text-sm font-semibold mb-2">👥 Suas indicações</p>
                <div className="space-y-2">
                  {referrals.map((ref) => {
                    const statusMap: Record<string, { label: string; color: string }> = {
                      pending: { label: "Pendente", color: "text-muted-foreground" },
                      registered: { label: "Cadastrou", color: "text-yellow-400" },
                      first_purchase: { label: "1ª compra", color: "text-primary" },
                      second_purchase: { label: "2ª compra", color: "text-green-400" },
                    };
                    const status = statusMap[ref.status] || statusMap.pending;
                    return (
                      <div key={ref.id} className="gradient-card border-warm rounded-lg p-3 flex items-center justify-between">
                        <div>
                          <p className="text-foreground text-sm">{ref.referred_email || "Aguardando..."}</p>
                          <p className={`text-xs font-semibold ${status.color}`}>{status.label}</p>
                        </div>
                        <p className="text-primary font-bold text-xs">+{ref.points_awarded} pts</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </TabsContent>

          {/* EVENTOS TAB */}
          <TabsContent value="eventos" className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Zap size={20} className="text-primary" />
              <h3 className="font-display text-lg font-bold text-foreground">Eventos Especiais</h3>
            </div>

            {!events || events.length === 0 ? (
              <div className="gradient-card border-warm rounded-xl p-6 text-center">
                <Zap size={32} className="text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-muted-foreground text-sm">Nenhum evento ativo no momento.</p>
                <p className="text-muted-foreground text-xs">Fique de olho para não perder promoções!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((event, i) => {
                  const typeInfo = eventTypeLabels[event.event_type] || eventTypeLabels.combo_bonus;
                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="gradient-card border-2 border-primary/30 rounded-xl p-4 glow-gold"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg bg-primary/20 ${typeInfo.color}`}>
                          {typeInfo.icon}
                        </div>
                        <div className="flex-1">
                          <p className="text-foreground text-sm font-bold">{event.title}</p>
                          <p className="text-muted-foreground text-xs mt-0.5">{event.description}</p>
                          {event.bonus_points > 0 && (
                            <p className="text-primary font-bold text-xs mt-1">+{event.bonus_points.toLocaleString()} pontos bônus</p>
                          )}
                          {event.target_points > 0 && (
                            <p className="text-muted-foreground text-xs mt-1">Meta: {event.target_points.toLocaleString()} pontos</p>
                          )}
                          <p className="text-muted-foreground text-[10px] mt-1">
                            Até {new Date(event.end_date).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
      <BottomNav />
    </div>
  );
};

export default CashbackPage;
