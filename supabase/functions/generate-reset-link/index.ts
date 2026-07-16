import { createClient } from "https://esm.sh/@supabase/supabase-js@2.97.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller } } = await supabaseAdmin.auth.getUser(token);
    if (!caller) throw new Error("Não autorizado");

    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin");
    if (!roleData || roleData.length === 0) throw new Error("Acesso negado");

    const { user_id } = await req.json();
    if (!user_id) throw new Error("user_id obrigatório");

    // Get user email
    const { data: { user: targetUser }, error: userError } = await supabaseAdmin.auth.admin.getUserById(user_id);
    if (userError || !targetUser) throw new Error("Usuário não encontrado");

    // Generate recovery link
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: targetUser.email!,
      options: {
        redirectTo: `${req.headers.get("origin") || Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.lovable.app')}/reset-password`,
      },
    });

    if (linkError) throw linkError;

    return new Response(
      JSON.stringify({
        email: targetUser.email,
        display_name: targetUser.user_metadata?.display_name || targetUser.email?.split("@")[0],
        reset_link: linkData.properties?.action_link || "",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
