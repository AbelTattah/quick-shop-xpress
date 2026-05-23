import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Sparkles, Store, MessageCircle } from "lucide-react";
import { api, formatPrice, type Item } from "@/lib/api";
import { SearchBar, useAllItems } from "@/components/SearchBar";
import { ProductCard } from "@/components/ProductCard";
import { ProductImage } from "@/components/ProductImage";
import { getRecent, useStoreVersion } from "@/lib/store";

export const Route = createFileRoute("/")({ component: Index });

function Index() {
  useStoreVersion();
  const recent = getRecent();
  const merchantsQ = useQuery({ queryKey: ["merchants"], queryFn: api.listMerchants, staleTime: 60_000 });
  const itemsQ = useAllItems();

  const trending: Item[] = (itemsQ.data ?? []).slice(0, 8);
  const featured = (itemsQ.data ?? []).find((i) => i.in_stock) ?? (itemsQ.data ?? [])[0];

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/95 via-primary to-[oklch(0.5_0.16_25)] p-6 text-primary-foreground md:p-10 bg-grain">
        <div className="grid gap-6 md:grid-cols-[1.2fr,1fr] md:items-center md:gap-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> New: shop, chat, checkout — all on WhatsApp
            </div>
            <h1 className="mt-4 font-display text-4xl leading-[1.05] tracking-tight md:text-6xl">
              Tap. Add.<br /> Send on <span className="italic">WhatsApp.</span>
            </h1>
            <p className="mt-3 max-w-md text-sm text-primary-foreground/85 md:text-base">
              Hand-crafted West African fashion from independent tailors. No accounts, no checkout forms — just a message.
            </p>
            <div className="mt-6 max-w-md">
              <SearchBar />
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              {["Agbada", "Kaftan", "Ankara", "Senator", "Kente"].map((t) => (
                <Link key={t} to="/search" search={{ q: t }} className="rounded-full bg-white/12 px-3 py-1 backdrop-blur transition hover:bg-white/20">
                  {t}
                </Link>
              ))}
            </div>
          </div>

          {featured && (
            <Link to="/items/$itemId" params={{ itemId: featured.id }} className="group relative hidden overflow-hidden rounded-2xl bg-cream/90 p-3 text-foreground shadow-pop md:block">
              <ProductImage src={featured.image_urls?.[0]} name={featured.name} className="aspect-[4/5] w-full" rounded="rounded-xl" />
              <div className="flex items-end justify-between p-3">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Editor's pick</p>
                  <p className="mt-1 font-display text-xl">{featured.name}</p>
                  <p className="text-primary font-semibold">{formatPrice(featured.price_minor, featured.currency)}</p>
                </div>
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          )}
        </div>
      </section>

      {/* Value props */}
      <section className="grid gap-3 sm:grid-cols-3">
        <ValueProp icon={<MessageCircle className="h-5 w-5" />} title="WhatsApp checkout" body="One tap → your basket lands in the seller's chat." />
        <ValueProp icon={<Sparkles className="h-5 w-5" />} title="Instant search" body="Type and find — across every shop in the market." />
        <ValueProp icon={<Store className="h-5 w-5" />} title="Real makers" body="Bespoke tailoring from independent African designers." />
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
