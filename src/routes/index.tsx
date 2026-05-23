import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Sparkles, Store, MessageCircle } from "lucide-react";
import { api, formatPrice, type Item, resolveImage } from "@/lib/api";
import { SearchBar, useAllItems } from "@/components/SearchBar";
import { ProductCard } from "@/components/ProductCard";
import { ProductImage } from "@/components/ProductImage";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import { getRecent, useStoreVersion } from "@/lib/store";

export const Route = createFileRoute("/")({ component: Index });

function Index() {
  useStoreVersion();
  const recent = getRecent();
  const merchantsQ = useQuery({
    queryKey: ["merchants"],
    queryFn: async () => {
      try {
        return await api.listMerchants();
      } catch {
        // Allow prerender to continue when the API is down.
        return [] as { id: string; name: string; logo_url?: string | null; whatsapp_number?: string | null }[];
      }
    },
    staleTime: 60_000,
  });
  const itemsQ = useAllItems();

  const trending: Item[] = (itemsQ.data ?? []).slice(0, 8);
  const featured = (itemsQ.data ?? []).find((i) => i.in_stock) ?? (itemsQ.data ?? [])[0];
  // Prefer API-hosted images for the hero carousel; fall back to public images.
  const carouselSources = (trending.length > 0
    ? trending.slice(0, 6).map((it) => resolveImage(it.image_urls?.[0]) ?? "/blue-shirt.jpg")
    : ["/blue-shirt.jpg", "/white-agbada.jpg"]);

  return (
    <div className="space-y-10">
      {/* Hero carousel */}
      <section className="relative">
        <div className="relative left-1/2 -translate-x-1/2 w-screen px-4 md:px-6">
          <div className="mx-auto max-w-[1400px]">
            <Carousel>
              <CarouselContent>
                {(trending.length > 0 ? trending.slice(0, 6) : []).map((it) => (
                  <CarouselItem key={it.id}>
                    <div className="flex flex-col md:flex-row h-80 md:h-[520px] w-full rounded-3xl overflow-hidden bg-card">
                      <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col justify-center bg-gradient-to-r from-white/95 to-transparent">
                        <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium">
                          <Sparkles className="h-3.5 w-3.5 text-primary" /> OOTD
                        </div>
                        <h3 className="mt-4 text-2xl md:text-4xl font-display text-foreground">{it.name}</h3>
                        <p className="mt-2 text-lg text-muted-foreground">{formatPrice(it.price_minor, it.currency)}</p>
                        <p className="mt-4 max-w-md text-sm text-muted-foreground">Hand-crafted piece by independent tailors — tap to message and order.</p>
                        <div className="mt-6">
                          <Link to="/items/$itemId" params={{ itemId: it.id }} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm text-white">
                            Shop
                          </Link>
                        </div>
                      </div>
                      <div className="w-full md:w-1/2 relative flex items-center justify-center bg-muted">
                        <img src={resolveImage(it.image_urls?.[0]) ?? "/blue-shirt.jpg"} alt={it.name} className="w-full h-full object-contain" />
                      </div>
                    </div>
                  </CarouselItem>
                ))}
                {trending.length === 0 && (
                  <CarouselItem>
                    <div className="relative h-80 md:h-[520px] w-full rounded-3xl overflow-hidden bg-muted">
                      <img src="/blue-shirt.jpg" alt="featured" className="w-full h-full object-cover object-top" />
                    </div>
                  </CarouselItem>
                )}
              </CarouselContent>
              <div className="absolute left-6 top-1/2 z-30 -translate-y-1/2">
                <CarouselPrevious />
              </div>
              <div className="absolute right-6 top-1/2 z-30 -translate-y-1/2">
                <CarouselNext />
              </div>
            </Carousel>
          </div>
        </div>
        <div className="mt-6 px-4 md:px-6">
          <SearchBar />
        </div>
      </section>

      {/* Recently viewed */}
      {recent.length > 0 && (
        <Section title="Recently viewed" hint="Pick up where you left off">
          <HScroll>
            {recent.map((it) => (
              <div key={it.id} className="w-44 shrink-0 snap-start">
                <ProductCard item={it} />
              </div>
            ))}
          </HScroll>
        </Section>
      )}

      {/* Trending */}
      <Section
        title="Trending now"
        hint="Most-loved pieces this week"
        action={<Link to="/search" className="text-sm text-primary hover:underline">View all →</Link>}
      >
        {itemsQ.isLoading ? (
          <SkeletonGrid />
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {trending.map((it) => <ProductCard key={it.id} item={it} />)}
          </div>
        )}
      </Section>

      {/* Merchants */}
      <Section title="Shop the makers" hint="Independent designers, direct prices">
        <HScroll>
          {(merchantsQ.data ?? []).map((m) => (
            <Link
              key={m.id}
              to="/merchants/$slug"
              params={{ slug: m.id }}
              className="w-64 shrink-0 snap-start overflow-hidden rounded-2xl bg-card p-4 shadow-soft transition hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-3">
                <ProductImage src={m.logo_url} name={m.name} className="h-12 w-12" rounded="rounded-full" />
                <div className="min-w-0">
                  <p className="truncate font-display text-lg">{m.name}</p>
                  <p className="text-[11px] text-muted-foreground">{m.whatsapp_number ? "WhatsApp ready" : "Coming soon"}</p>
                </div>
              </div>
              {m.description && <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">{m.description}</p>}
            </Link>
          ))}
        </HScroll>
      </Section>
    </div>
  );
}

function ValueProp({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-primary">{icon}</div>
      <p className="mt-3 font-medium">{title}</p>
      <p className="text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function Section({ title, hint, action, children }: { title: string; hint?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl md:text-3xl">{title}</h2>
          {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function HScroll({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide md:mx-0 md:px-0">
      {children}
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-muted" />
      ))}
    </div>
  );
}
