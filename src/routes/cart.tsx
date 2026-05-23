import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Minus, Plus, Trash2, MessageCircle, ShoppingBag } from "lucide-react";
import { api, formatPrice } from "@/lib/api";
import { clearCart, getCart, pushOrder, removeFromCart, setQty, useStoreVersion } from "@/lib/store";
import { ProductImage } from "@/components/ProductImage";
import { toast } from "sonner";

export const Route = createFileRoute("/cart")({ component: CartPage });

function CartPage() {
  useStoreVersion();
  const cart = getCart();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const merchantQ = useQuery({
    queryKey: ["merchant", cart.merchant_id],
    queryFn: () => api.getMerchant(cart.merchant_id!),
    enabled: Boolean(cart.merchant_id),
  });
  const merchant = merchantQ.data;
  const currency = cart.lines[0]?.snapshot.currency ?? "GHS";
  const total = cart.lines.reduce((s, l) => s + l.qty * l.snapshot.price_minor, 0);

  if (cart.lines.length === 0) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-primary/10 text-primary">
          <ShoppingBag className="h-8 w-8" />
        </div>
        <h1 className="mt-5 font-display text-3xl">Your cart is empty</h1>
        <p className="mt-2 text-sm text-muted-foreground">Find something beautiful to add.</p>
        <Link to="/" className="mt-6 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-pop">Start shopping</Link>
      </div>
    );
  }

  const handleCheckout = async () => {
    if (!merchant) return;
    setSubmitting(true);
    try {
      const { id } = await api.createBasket({
        merchant_id: merchant.id,
        items: cart.lines.map((l) => ({ item_id: l.item_id, qty: l.qty })),
        customer_name: name || undefined,
        customer_phone: phone || undefined,
        customer_note: note || undefined,
      });

      // Build WhatsApp message
      const lines = cart.lines.map((l) => `• ${l.qty} × ${l.snapshot.name} — ${formatPrice(l.snapshot.price_minor * l.qty, l.snapshot.currency)}`).join("\n");
      const msg =
        `Hi ${merchant.name}! 👋\n\nI'd like to order:\n${lines}\n\nTotal: ${formatPrice(total, currency)}\n` +
        (name ? `Name: ${name}\n` : "") + (phone ? `Phone: ${phone}\n` : "") + (note ? `Note: ${note}\n` : "") +
        `\nOrder ref: ${id}`;
      const number = (merchant.whatsapp_number ?? "").replace(/[^\d]/g, "");
      const waUrl = number ? `https://wa.me/${number}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`;

      pushOrder({ id, created_at: Date.now(), merchant_name: merchant.name, total_minor: total, currency });
      clearCart();
      window.open(waUrl, "_blank");
      navigate({ to: "/thank-you/$basketId", params: { basketId: id } });
    } catch (e) {
      const errMsg = (e as Error)?.message ?? String(e);
      // Attempt to detect API 422 items_unavailable and fall back to opening WhatsApp
      try {
        if (errMsg.startsWith("API 422")) {
          const jsonPart = errMsg.replace(/^API 422:\s*/, "");
          const parsed = JSON.parse(jsonPart);
          if (parsed?.error === "items_unavailable") {
            const lines = cart.lines.map((l) => `• ${l.qty} × ${l.snapshot.name} — ${formatPrice(l.snapshot.price_minor * l.qty, l.snapshot.currency)}`).join("\n");
            const fallbackMsg = `Hi, I couldn't create my order via the app because some items are out of stock: ${parsed.message || ''}\n\nI'd like to order:\n${lines}\n\nTotal: ${formatPrice(total, currency)}\n${name ? `Name: ${name}\n` : ''}${phone ? `Phone: ${phone}\n` : ''}${note ? `Note: ${note}\n` : ''}`;
            const fallbackNumber = "0201724957"; // user's provided WhatsApp number
            const waUrl = `https://wa.me/${fallbackNumber}?text=${encodeURIComponent(fallbackMsg)}`;
            window.open(waUrl, "_blank");
            toast.success("Opened WhatsApp — some items unavailable, please confirm with the shop");
            return;
          }
        }
      } catch (parseErr) {
        // fall through to generic error
      }

      toast.error("Couldn't create your order", { description: errMsg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr,1fr]">
      <div>
        <h1 className="font-display text-3xl md:text-4xl">Your basket</h1>
        {merchant && (
          <p className="mt-1 text-sm text-muted-foreground">From <Link to="/merchants/$slug" params={{ slug: merchant.id }} className="text-primary hover:underline">{merchant.name}</Link></p>
        )}

        <ul className="mt-5 space-y-3">
          {cart.lines.map((l) => (
            <li key={l.item_id} className="flex gap-3 rounded-2xl bg-card p-3 shadow-soft">
              <ProductImage src={l.snapshot.image_urls?.[0]} name={l.snapshot.name} className="h-20 w-20 shrink-0" rounded="rounded-xl" />
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <Link to="/items/$itemId" params={{ itemId: l.item_id }} className="font-medium hover:underline">{l.snapshot.name}</Link>
                  <button onClick={() => removeFromCart(l.item_id)} aria-label="Remove" className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-sm text-primary">{formatPrice(l.snapshot.price_minor, l.snapshot.currency)}</p>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <div className="inline-flex items-center rounded-full border border-border">
                    <button onClick={() => setQty(l.item_id, l.qty - 1)} className="grid h-8 w-8 place-items-center"><Minus className="h-3.5 w-3.5" /></button>
                    <span className="w-6 text-center text-sm">{l.qty}</span>
                    <button onClick={() => setQty(l.item_id, l.qty + 1)} className="grid h-8 w-8 place-items-center"><Plus className="h-3.5 w-3.5" /></button>
                  </div>
                  <p className="text-sm font-semibold">{formatPrice(l.snapshot.price_minor * l.qty, l.snapshot.currency)}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <aside className="lg:sticky lg:top-20 lg:self-start">
        <div className="rounded-2xl bg-card p-5 shadow-soft">
          <h2 className="font-display text-xl">Your details</h2>
          <p className="mt-1 text-xs text-muted-foreground">Optional — helps the shop prepare your order.</p>
          <div className="mt-4 space-y-2">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone (with country code)" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" />
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Notes (size, color, delivery…)" rows={3} className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" />
          </div>

          <div className="my-5 h-px bg-border" />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatPrice(total, currency)}</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="font-medium">Total</span>
            <span className="font-display text-2xl">{formatPrice(total, currency)}</span>
          </div>

          <button
            onClick={handleCheckout}
            disabled={submitting || !merchant}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[var(--whatsapp)] py-3.5 text-sm font-semibold text-white shadow-pop transition active:scale-[.98] disabled:opacity-60"
          >
            <MessageCircle className="h-4 w-4" />
            {submitting ? "Preparing…" : "Checkout on WhatsApp"}
          </button>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            We'll open WhatsApp with your order pre-filled. Confirm with the shop to complete.
          </p>
        </div>
      </aside>
    </div>
  );
}
