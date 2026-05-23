import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ProductImage } from "@/components/ProductImage";
import { ProductCard } from "@/components/ProductCard";
import { MessageCircle, ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/merchants/$slug")({
  component: MerchantPage,
  notFoundComponent: () => (
    <div className="py-20 text-center">
      <h1 className="font-display text-3xl">Shop not found</h1>
      <Link to="/" className="mt-4 inline-block text-primary hover:underline">Browse all shops</Link>
    </div>
  ),
  errorComponent: ({ error, reset }) => (
    <div className="py-20 text-center">
      <p className="text-sm text-muted-foreground">{error.message}</p>
      <button onClick={reset} className="mt-4 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground">Retry</button>
    </div>
  ),
});

function MerchantPage() {
  const { slug } = Route.useParams();
  const merchantQ = useQuery({ queryKey: ["merchant", slug], queryFn: () => api.getMerchant(slug), retry: 1 });
  const itemsQ = useQuery({ queryKey: ["merchant-items", slug], queryFn: () => api.listMerchantItems(slug) });

  if (merchantQ.error && (merchantQ.error as Error).message.includes("404")) throw notFound();
  if (merchantQ.isLoading || !merchantQ.data) {
    return <div className="h-40 animate-pulse rounded-3xl bg-muted" />;
  }
  const m = merchantQ.data;

  return (
    <div className="space-y-8">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> All shops
      </Link>
      <section
        className="overflow-hidden rounded-3xl p-6 md:p-10 bg-grain"
        style={{ backgroundColor: m.brand_colors?.[1] ?? "oklch(0.94 0.025 70)" }}
      >
        <div className="flex flex-col items-start gap-5 md:flex-row md:items-center md:gap-8">
          <ProductImage src={m.logo_url} name={m.name} className="h-20 w-20 md:h-28 md:w-28" rounded="rounded-2xl" />
          <div className="flex-1">
            <h1 className="font-display text-3xl md:text-5xl" style={{ color: m.brand_colors?.[0] }}>{m.name}</h1>
            {m.description && <p className="mt-2 max-w-xl text-sm text-foreground/80">{m.description}</p>}
          </div>
          {m.whatsapp_number && (
            <a
              href={`https://wa.me/${m.whatsapp_number.replace(/[^\d]/g, "")}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--whatsapp)] px-5 py-2.5 text-sm font-medium text-white shadow-pop"
            >
              <MessageCircle className="h-4 w-4" /> Chat with shop
            </a>
          )}
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl">All pieces</h2>
        {itemsQ.isLoading ? (
          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-muted" />)}
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
            {(itemsQ.data ?? []).map((it) => <ProductCard key={it.id} item={it} />)}
          </div>
        )}
      </section>
    </div>
  );
}
