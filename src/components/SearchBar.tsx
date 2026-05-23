import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { api, formatPrice, type Item } from "@/lib/api";
import { ProductImage } from "./ProductImage";

// The API has no /search endpoint — we fetch all items across merchants once,
// cache aggressively, then filter client-side for instant autocomplete.
export function useAllItems() {
  return useQuery({
    queryKey: ["all-items"],
    queryFn: async () => {
      try {
        // Focus the initial items pipeline on the `mensah` merchant only
        // to avoid pulling images/paths from other shops (e.g. rashida-tailors).
        const items = await api.listMerchantItems("mensah").catch(() => [] as Item[]);
        return items;
      } catch (err) {
        // If the API is unavailable during prerender, return an empty list
        // so prerender can continue producing static pages.
        return [] as Item[];
      }
    },
    staleTime: 60_000,
  });
}

export function SearchBar({ autoFocus = false }: { autoFocus?: boolean }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const { data: items = [] } = useAllItems();

  const suggestions = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return [];
    return items
      .filter((it) => it.name.toLowerCase().includes(query) || it.description?.toLowerCase().includes(query))
      .slice(0, 6);
  }, [q, items]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (q.trim()) {
            navigate({ to: "/search", search: { q: q.trim() } });
            setOpen(false);
          }
        }}
        className="relative"
      >
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          autoFocus={autoFocus}
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search agbada, kente, kaftan…"
          className="w-full rounded-full border border-border bg-card py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground shadow-soft outline-none transition focus:border-primary"
        />
      </form>
      {open && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-2xl border border-border bg-popover shadow-soft">
          <ul>
            {suggestions.map((it) => (
              <li key={it.id}>
                <button
                  type="button"
                  onClick={() => { navigate({ to: "/items/$itemId", params: { itemId: it.id } }); setOpen(false); setQ(""); }}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-muted"
                >
                  <ProductImage src={it.image_urls?.[0]} name={it.name} className="h-10 w-10" rounded="rounded-lg" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{it.name}</p>
                    <p className="text-xs text-muted-foreground">{formatPrice(it.price_minor, it.currency)}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
