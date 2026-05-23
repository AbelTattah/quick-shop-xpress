import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Package, ArrowRight } from "lucide-react";
import { formatPrice } from "@/lib/api";
import { getRecentOrders, useStoreVersion } from "@/lib/store";

export const Route = createFileRoute("/track")({ component: TrackPage });

function TrackPage() {
  useStoreVersion();
  const [id, setId] = useState("");
  const navigate = useNavigate();
  const orders = getRecentOrders();

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="font-display text-3xl md:text-4xl">Track your order</h1>
        <p className="text-sm text-muted-foreground">Look up any order by reference, or pick a recent one.</p>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); if (id.trim()) navigate({ to: "/thank-you/$basketId", params: { basketId: id.trim() } }); }}
        className="flex gap-2"
      >
        <input value={id} onChange={(e) => setId(e.target.value)} placeholder="Order reference (e.g. bsk_…)" className="flex-1 rounded-full border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary" />
        <button className="rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground">Track</button>
      </form>

      <section>
        <h2 className="font-display text-xl">Recent orders</h2>
        {orders.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No orders yet. <Link to="/" className="text-primary hover:underline">Start shopping</Link>
          </div>
        ) : (
          <ul className="mt-3 space-y-2">
            {orders.map((o) => (
              <li key={o.id}>
                <Link to="/thank-you/$basketId" params={{ basketId: o.id }} className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-soft hover:-translate-y-0.5 transition">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
                    <Package className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{o.merchant_name ?? "Order"}</p>
                    <p className="truncate font-mono text-xs text-muted-foreground">{o.id}</p>
                  </div>
                  {o.total_minor != null && (
                    <span className="text-sm font-semibold">{formatPrice(o.total_minor, o.currency ?? "GHS")}</span>
                  )}
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
