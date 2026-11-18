import { supabase } from "@/integrations/supabase/client";

const MAX_SIDE = 1200;
const QUALITY = 0.82;

/**
 * Reduz a foto para no máximo 1200px no maior lado e converte para WebP.
 * Uma foto de celular de ~4 MB costuma ficar com 100–250 KB, economizando o Storage.
 */
async function compressImage(file: File): Promise<Blob> {
  if (file.type === "image/gif") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/webp", QUALITY));
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
}

/** Envia a foto do produto ao bucket "produtos" e retorna a URL pública. Lança erro se falhar. */
export async function uploadProductImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("O arquivo selecionado não é uma imagem.");
  const blob = await compressImage(file);
  const ext = blob.type === "image/webp" ? "webp" : (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage
    .from("produtos")
    .upload(path, blob, { contentType: blob.type || file.type, cacheControl: "31536000" });
  if (error) throw new Error("Falha ao enviar a foto: " + error.message);

  return supabase.storage.from("produtos").getPublicUrl(path).data.publicUrl;
}

/** Remove do Storage uma foto antiga do bucket "produtos" (ignora URLs de outros lugares). */
export async function removeProductImage(url: string | null | undefined) {
  const marker = "/storage/v1/object/public/produtos/";
  if (!url || !url.includes(marker)) return;
  const path = url.split(marker)[1]?.split("?")[0];
  if (path) await supabase.storage.from("produtos").remove([path]);
}
