import { useState } from "react";

/** Miniatura da foto do produto nos cards da loja. Não renderiza nada se não houver foto. */
export function ProductThumb({ src, alt }: { src?: string | null; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return null;
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className="w-16 h-16 md:w-20 md:h-20 rounded-lg object-cover border border-border shrink-0"
    />
  );
}
