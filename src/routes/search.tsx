import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { SearchBar, useAllItems } from "@/components/SearchBar";
import { ProductCard } from "@/components/ProductCard";
import { z } from "zod";

const searchSchema = z.object({
  q: z.string().optional(),
  merchant: z.string().optional(),
  sort: z.enum(["popular", "price-asc", "price-desc", "name"]).optional(),
  inStock: z.boolean().optional(),
});

export const Route = createFileRoute("/search")({
  component: SearchPage,
  validateSearch: (s) => searchSchema.parse(s),
});

function SearchPage() {
  const { q = "", merchant = "", sort = "popular", inStock = false } = Route.useSearch();
  const navigate = Route.useNavigate();
  const itemsQ = useAllItems();
  const merchantsQ = useQuery({ queryKey: ["merchants"], queryFn: api.listMerchants, staleTime: 60_000 });

  const [open, setOpen] = useState(false);

  const results = useMemo(() => {
    let list = itemsQ.data ?? [];
    const query = q.trim().toLowerCase();
    if (query) list = list.filter((i) => i.name.toLowerCase().includes(query) || i.description?.toLowerCase().includes(query));
    if (merchant) list = list.filter((i) => i.merchant_id === merchant);
    if (inStock) list = list.filter((i) => i.in_stock);
    if (sort === "price-asc") list = [...list].sort((a, b) => a.price_minor - b.price_minor);
    if (sort === "price-desc") list = [...list].sort((a, b) => b.price_minor - a.price_minor);
    if (sort === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [itemsQ.data, q, merchant, sort, inStock]);

  const update = (patch: Partial<{ q: string; merchant: string; sort: string; inStock: boolean }>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch }) as never });

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <SearchBar autoFocus={!q} />
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setOpen((o) => !o)}
            className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium"
          >
            Filters {merchant || inStock ? "•" : ""}
          </button>
          <select
            value={sort}
            onChange={(e) => update({ sort: e.target.value })}
            className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium"
          >
            <option value="popular">Popular</option>
            <option value="price-asc">Price: low → high</option>
            <option value="price-desc">Price: high → low</option>
            <option value="name">Name A–Z</option>
          </select>
          <label className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium">
            <input type="checkbox" checked={inStock} onChange={(e) => update({ inStock: e.target.checked })} />
            In stock
          </label>
          {merchant && (
            <button onClick={() => update({ merchant: "" })} className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
              {merchantsQ.data?.find((m) => m.id === merchant)?.name ?? merchant} ✕
            </button>
          )}
        </div>
        {open && (
          <div className="rounded-2xl border border-border bg-card p-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Shop by maker</p>
            <div className="flex flex-wrap gap-2">
              {(merchantsQ.data ?? []).map((m) => (
                <button
                  key={m.id}
                  onClick={() => update({ merchant: merchant === m.id ? "" : m.id })}
                  className={`rounded-full px-3 py-1.5 text-xs ${merchant === m.id ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        {itemsQ.isLoading ? "Searching…" : `${results.length} result${results.length === 1 ? "" : "s"}${q ? ` for “${q}”` : ""}`}
      </p>

      {itemsQ.isLoading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-muted" />)}
        </div>
      ) : results.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Nothing matches. Try a different word or filter.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {results.map((it) => <ProductCard key={it.id} item={it} />)}
        </div>
      )}
    </div>
  );
}
