import { useState } from "react";
import { resolveImage } from "@/lib/api";

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export function ProductImage({
  src,
  name,
  className = "",
  rounded = "rounded-2xl",
}: {
  src?: string | null;
  name: string;
  className?: string;
  rounded?: string;
}) {
  const url = resolveImage(src);
  const [errored, setErrored] = useState(false);
  // Use a small set of public images as a fallback when the resolved URL is missing
  // or the image fails to load. We pick one deterministically from the product name
  // so the fallback is stable across renders.
  const PUBLIC_FALLBACKS = ["/blue-shirt.jpg", "/white-agbada.jpg"];
  const pickFallback = (n: string) => {
    let hash = 0;
    for (let i = 0; i < n.length; i++) hash = (hash * 31 + n.charCodeAt(i)) | 0;
    const idx = Math.abs(hash) % PUBLIC_FALLBACKS.length;
    return PUBLIC_FALLBACKS[idx];
  };

  if (!url || errored) {
    const fallback = pickFallback(name || "fallback");
    // Render the public fallback image first; if it errors, fall back to the
    // initials gradient placeholder.
    return (
      <>
        {!errored ? (
          <img
            src={fallback}
            alt={name}
            loading="lazy"
            onError={() => setErrored(true)}
            className={`object-cover ${rounded} ${className}`}
          />
        ) : (
          (() => {
            const hue = (name.charCodeAt(0) * 13 + (name.charCodeAt(name.length - 1) || 0) * 7) % 60;
            return (
              <div
                className={`flex items-center justify-center ${rounded} ${className}`}
                style={{
                  background: `linear-gradient(135deg, oklch(0.88 0.06 ${20 + hue}), oklch(0.72 0.12 ${30 + hue}))`,
                }}
              >
                <span className="font-display text-3xl text-ink/70">{initials(name)}</span>
              </div>
            );
          })()
        )}
      </>
    );
  }

  return (
    <img
      src={url}
      alt={name}
      loading="lazy"
      onError={() => setErrored(true)}
      className={`object-cover ${rounded} ${className}`}
    />
  );
}
