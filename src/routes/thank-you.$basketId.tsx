import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CheckCircle2, Star } from "lucide-react";
import { api, formatPrice } from "@/lib/api";
import { ProductImage } from "@/components/ProductImage";

export const Route = createFileRoute("/thank-you/$basketId")({ component: ThankYou });

function ThankYou() {
  const { basketId } = Route.useParams();
  const { data: basket, isLoading } = useQuery({ queryKey: ["basket", basketId], queryFn: () => api.getBasket(basketId) });
  const [rating, setRating] = useState(0);
  const [rated, setRated] = useState(false);

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-6">
      <div className="text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[color-mix(in_oklab,var(--whatsapp)_15%,transparent)] text-[var(--whatsapp)]">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <h1 className="mt-5 font-display text-4xl">Order sent to WhatsApp</h1>
        <p className="mt-2 text-sm text-muted-foreground">Finish the conversation with the shop to confirm.</p>
        <p className="mt-3 inline-block rounded-full bg-muted px-3 py-1 font-mono text-xs">Ref: {basketId}</p>
      </div>

      <div className="rounded-2xl bg-card p-5 shadow-soft">
        <h2 className="font-display text-xl">Order summary</h2>
        {isLoading || !basket ? (
          <div className="mt-3 space-y-2">
            <div className="h-12 animate-pulse rounded bg-muted" />
            <div className="h-12 animate-pulse rounded bg-muted" />
          </div>
        ) : (
          <>
            <ul className="mt-4 space-y-3">
              {basket.items.map((it) => (
                <li key={it.item_id} className="flex items-center gap-3">
                  <ProductImage src={it.image_url} name={it.name} className="h-14 w-14" rounded="rounded-lg" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{it.name}</p>
                    <p className="text-xs text-muted-foreground">{it.qty} × {formatPrice(it.price_minor, it.currency)}</p>
                  </div>
                  <span className="text-sm font-semibold">{formatPrice(it.qty * it.price_minor, it.currency)}</span>
                </li>
              ))}
            </ul>
            <div className="my-4 h-px bg-border" />
            <div className="flex items-center justify-between font-medium">
              <span>Total</span>
              <span className="font-display text-2xl">{formatPrice(basket.total_minor, basket.currency ?? "GHS")}</span>
            </div>
            {basket.merchant && (
              <p className="mt-2 text-xs text-muted-foreground">Shop: {basket.merchant.name}</p>
            )}
          </>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="font-medium">Rate your experience</p>
        <p className="text-xs text-muted-foreground">Helps us improve wamarket.</p>
        <div className="mt-3 flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => { setRating(n); setRated(true); }} aria-label={`${n} stars`}>
              <Star className={`h-7 w-7 ${n <= rating ? "fill-accent text-accent" : "text-muted-foreground"}`} />
            </button>
          ))}
        </div>
        {rated && <p className="mt-2 text-xs text-[var(--whatsapp)]">Thanks for the feedback!</p>}
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <Link to="/" className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-pop">Continue shopping</Link>
        <Link to="/track" className="rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium">Track your orders</Link>
      </div>
    </div>
  );
}
