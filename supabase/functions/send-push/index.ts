import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildPushHTTPRequest } from "npm:@pushforge/builder";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user: authUser }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !authUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminId = authUser.id;

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check admin role
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", adminId)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { title, message, user_id, broadcast } = await req.json();

    if (!title || !message) {
      return new Response(
        JSON.stringify({ error: "title and message are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get VAPID private key
    const { data: vapidData } = await supabaseAdmin
      .from("vapid_keys")
      .select("private_key")
      .eq("id", 1)
      .single();

    if (!vapidData) {
      return new Response(
        JSON.stringify({ error: "VAPID keys not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const privateJWK = JSON.parse(vapidData.private_key);

    // Determine target users
    let targetUserIds: string[] = [];

    if (broadcast) {
      const { data: allSubs } = await supabaseAdmin
        .from("push_subscriptions")
        .select("user_id");
      const uniqueIds = [...new Set((allSubs || []).map((s: any) => s.user_id))];
      targetUserIds = uniqueIds;
    } else if (user_id) {
      targetUserIds = [user_id];
    } else {
      return new Response(
        JSON.stringify({ error: "Specify user_id or set broadcast: true" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert in-app notifications for all target users
    if (targetUserIds.length > 0) {
      const notificationRows = targetUserIds.map((uid: string) => ({
        user_id: uid,
        title,
        message,
      }));
      await supabaseAdmin.from("notifications").insert(notificationRows);
    }

    // Send push notifications
    let sent = 0;
    const errors: string[] = [];

    for (const uid of targetUserIds) {
      const { data: subscriptions } = await supabaseAdmin
        .from("push_subscriptions")
        .select("*")
        .eq("user_id", uid);

      if (!subscriptions) continue;

      for (const sub of subscriptions) {
        try {
          const subscription = {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          };

          const { endpoint, headers, body } = await buildPushHTTPRequest({
            privateJWK,
            subscription,
            message: {
              payload: JSON.stringify({ title, body: message }),
            },
            adminContact: "mailto:contato@Recanto das Flores.com",
          });

          const pushResponse = await fetch(endpoint, { method: "POST", headers, body });

          if (pushResponse.ok) {
            sent++;
          } else if (pushResponse.status === 410 || pushResponse.status === 404) {
            await supabaseAdmin.from("push_subscriptions").delete().eq("id", sub.id);
          } else {
            const respText = await pushResponse.text();
            errors.push(`Status ${pushResponse.status}: ${respText}`);
          }
        } catch (err) {
          errors.push(err.message);
        }
      }
    }

    return new Response(
      JSON.stringify({ sent, users: targetUserIds.length, errors }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error sending push:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
