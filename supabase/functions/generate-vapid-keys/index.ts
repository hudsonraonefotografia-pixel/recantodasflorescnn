import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if keys already exist
    const { data: existing } = await supabaseAdmin
      .from("vapid_keys")
      .select("public_key")
      .eq("id", 1)
      .single();

    if (existing) {
      return new Response(
        JSON.stringify({ publicKey: existing.public_key }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate ECDSA P-256 key pair for VAPID
    const keyPair = await crypto.subtle.generateKey(
      { name: "ECDSA", namedCurve: "P-256" },
      true,
      ["sign", "verify"]
    );

    const publicJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
    const privateJwk = await crypto.subtle.exportKey("jwk", keyPair.privateKey);

    // Convert public key to uncompressed format for applicationServerKey
    const xBytes = Uint8Array.from(atob(publicJwk.x!.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
    const yBytes = Uint8Array.from(atob(publicJwk.y!.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
    const uncompressed = new Uint8Array(65);
    uncompressed[0] = 0x04;
    uncompressed.set(xBytes, 1);
    uncompressed.set(yBytes, 33);
    const publicKeyBase64Url = arrayBufferToBase64Url(uncompressed.buffer);

    // Store keys in database
    await supabaseAdmin.from("vapid_keys").upsert({
      id: 1,
      public_key: publicKeyBase64Url,
      private_key: JSON.stringify(privateJwk),
    });

    return new Response(
      JSON.stringify({ publicKey: publicKeyBase64Url }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating VAPID keys:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
