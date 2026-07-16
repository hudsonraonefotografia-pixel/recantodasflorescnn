import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

serve(async (req) => {
  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });
  const serviceClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    // If no signature, try parsing as direct call (for testing)
    let event: Stripe.Event;
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (sig && webhookSecret) {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } else {
      event = JSON.parse(body);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      const paymentMethod = session.metadata?.payment_method;

      if (!userId) return new Response("No user_id", { status: 200 });

      // Update purchase status to completed
      await serviceClient
        .from("purchase_history")
        .update({ status: "completed" })
        .eq("user_id", userId)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1);

      // Get the pending purchase to calculate points
      const { data: purchase } = await serviceClient
        .from("purchase_history")
        .select("items, total")
        .eq("user_id", userId)
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!purchase) return new Response("OK", { status: 200 });

      const items = typeof purchase.items === "string" ? JSON.parse(purchase.items) : purchase.items;

      // Fetch category multipliers
      const { data: multipliers } = await serviceClient
        .from("category_multipliers")
        .select("category_name, points_per_real");

      const multiplierMap: Record<string, number> = {};
      if (multipliers) {
        for (const m of multipliers) {
          multiplierMap[m.category_name] = m.points_per_real;
        }
      }

      let totalPoints = 0;
      for (const item of items) {
        const category = item.category || "Produtos da Roça";
        const pointsPerReal = multiplierMap[category] || 10;
        const itemTotal = item.price * item.quantity;
        totalPoints += Math.floor(itemTotal * pointsPerReal);
      }

      if (totalPoints > 0) {
        const { data: profile } = await serviceClient
          .from("profiles")
          .select("display_name, total_points, available_cashback")
          .eq("user_id", userId)
          .single();

        const displayName = profile?.display_name || "Usuário";
        const newTotalPoints = (profile?.total_points || 0) + totalPoints;
        const newCashback = (profile?.available_cashback || 0) + (totalPoints / 1000);

        await serviceClient
          .from("profiles")
          .update({ total_points: newTotalPoints, available_cashback: newCashback })
          .eq("user_id", userId);

        // Update all-time cashback_points
        const { data: existingCashback } = await serviceClient
          .from("cashback_points")
          .select("id, total_earned")
          .eq("user_id", userId)
          .single();

        if (existingCashback) {
          await serviceClient
            .from("cashback_points")
            .update({ total_earned: existingCashback.total_earned + (totalPoints / 1000), display_name: displayName })
            .eq("id", existingCashback.id);
        } else {
          await serviceClient
            .from("cashback_points")
            .insert({ user_id: userId, total_earned: totalPoints / 1000, display_name: displayName });
        }

        // Update monthly ranking
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        const { data: existingMonthly } = await serviceClient
          .from("farm_points_monthly")
          .select("id, points")
          .eq("user_id", userId)
          .eq("month", month)
          .eq("year", year)
          .single();

        if (existingMonthly) {
          await serviceClient
            .from("farm_points_monthly")
            .update({ points: existingMonthly.points + totalPoints, display_name: displayName })
            .eq("id", existingMonthly.id);
        } else {
          await serviceClient
            .from("farm_points_monthly")
            .insert({ user_id: userId, points: totalPoints, display_name: displayName, month, year });
        }

        // Send notification
        await serviceClient.from("notifications").insert({
          user_id: userId,
          title: "🎉 Compra Confirmada!",
          message: `Parabéns! Você ganhou +${totalPoints.toLocaleString()} Pontos da Fazenda com sua compra.`,
        });
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  }
});
