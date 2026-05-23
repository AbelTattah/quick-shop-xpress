import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Heart, Minus, Plus, ShoppingBag, ChevronLeft, MessageCircle } from "lucide-react";
import { api, formatPrice } from "@/lib/api";
import { ProductImage } from "@/components/ProductImage";
import { addToCart, isWishlisted, pushRecent, toggleWishlist, useStoreVersion } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/items/$itemId")({
  component: ItemPage,
  notFoundComponent: () => (
    <div className="py-20 text-center">
      <h1 className="font-display text-3xl">Item not found</h1>
      <Link to="/" className="mt-4 inline-block text-primary hover:underline">Back to home</Link>
    </div>
  ),
  errorComponent: ({ error, reset }) => (
    <div className="py-20 text-center">
      <h1 className="font-display text-2xl">Couldn't load this item</h1>
      <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      <button onClick={reset} className="mt-4 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground">Retry</button>
    </div>
  ),
});

function ItemPage() {
  useStoreVersion();
  const { itemId } = Route.useParams();
  const { data: item, isLoading, error } = useQuery({
    queryKey: ["item", itemId],
    queryFn: () => api.getItem(itemId),
    retry: 1,
  });
  const merchantQ = useQuery({
    queryKey: ["merchant", item?.merchant_id],
    queryFn: () => api.getMerchant(item!.merchant_id),
    enabled: Boolean(item?.merchant_id),
  });
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => { if (item) pushRecent(item); }, [item]);
  if (error && (error as Error).message.includes("404")) throw notFound();

  if (isLoading || !item) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <div className="aspect-square animate-pulse rounded-3xl bg-muted" />
        <div className="space-y-4">
          <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
          <div className="h-6 w-1/3 animate-pulse rounded bg-muted" />
          <div className="h-24 animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }

  const wished = isWishlisted(item.id);
  const images = item.image_urls?.length ? item.image_urls : [null];

  const handleAdd = () => {
    const { replaced } = addToCart(item, qty);
    if (replaced) toast.info("Cart cleared", { description: "We swapped merchants — one shop per cart." });
    else toast.success(`Added ${qty} × ${item.name}`);
  };

  return (
    <div className="space-y-6">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Back
      </Link>

      <div className="grid gap-6 md:grid-cols-2 md:gap-10">
        <div>
          <ProductImage src={images[activeImg]} name={item.name} className="aspect-square w-full" rounded="rounded-3xl" />
          {images.length > 1 && (
            <div className="mt-3 flex gap-2">
              {images.map((src, i) => (
                <button key={i} onClick={() => setActiveImg(i)} className={`overflow-hidden rounded-xl border-2 transition ${activeImg === i ? "border-primary" : "border-transparent"}`}>
                  <ProductImage src={src} name={item.name} className="h-16 w-16" rounded="rounded-lg" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-5">
          {merchantQ.data && (
            <Link to="/merchants/$slug" params={{ slug: merchantQ.data.id }} className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground hover:text-primary">
              <ProductImage src={merchantQ.data.logo_url} name={merchantQ.data.name} className="h-6 w-6" rounded="rounded-full" />
              {merchantQ.data.name}
            </Link>
          )}
          <div>
            <h1 className="font-display text-3xl md:text-4xl">{item.name}</h1>
            <p className="mt-1 text-2xl font-semibold text-primary">{formatPrice(item.price_minor, item.currency)}</p>
          </div>
          {item.description && <p className="text-foreground/80 leading-relaxed">{item.description}</p>}

          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${item.in_stock ? "bg-[color-mix(in_oklab,var(--whatsapp)_15%,transparent)] text-[var(--whatsapp)]" : "bg-muted text-muted-foreground"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${item.in_stock ? "bg-[var(--whatsapp)]" : "bg-muted-foreground"}`} />
            {item.in_stock ? "In stock" : "Made to order"}
          </span>

          <div className="flex items-center gap-3 pt-2">
            <div className="inline-flex items-center rounded-full border border-border bg-card">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-10 w-10 place-items-center"><Minus className="h-4 w-4" /></button>
              <span className="w-8 text-center font-medium">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} className="grid h-10 w-10 place-items-center"><Plus className="h-4 w-4" /></button>
            </div>
            <button onClick={() => toggleWishlist(item)} className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card">
              <Heart className={`h-4 w-4 ${wished ? "fill-primary text-primary" : ""}`} />
            </button>
          </div>

          <button onClick={handleAdd} className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-pop transition active:scale-[.98]">
            <ShoppingBag className="h-4 w-4" /> Add to cart · {formatPrice(item.price_minor * qty, item.currency)}
          </button>
          <Link to="/cart" className="flex w-full items-center justify-center gap-2 rounded-full border border-[var(--whatsapp)]/30 bg-[color-mix(in_oklab,var(--whatsapp)_8%,transparent)] py-3 text-sm font-semibold text-[var(--whatsapp)]">
            <MessageCircle className="h-4 w-4" /> Review cart & checkout on WhatsApp
          </Link>
        </div>
      </div>
    </div>
  );
}
