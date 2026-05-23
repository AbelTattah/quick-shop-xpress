import { Link } from "@tanstack/react-router";
import { Heart, Plus, Check } from "lucide-react";
import { useState } from "react";
import { ProductImage } from "./ProductImage";
import { formatPrice, type Item } from "@/lib/api";
import { addToCart, isWishlisted, toggleWishlist, useStoreVersion } from "@/lib/store";
import { toast } from "sonner";

export function ProductCard({ item }: { item: Item }) {
  useStoreVersion();
  const wished = isWishlisted(item.id);
  const [justAdded, setJustAdded] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const { replaced } = addToCart(item, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
    if (replaced) toast.info("Cart cleared", { description: "We swapped merchants — one shop per cart for WhatsApp checkout." });
    else toast.success("Added to cart", { description: item.name });
  };

  const handleWish = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(item);
  };

  return (
    <Link
      to="/items/$itemId"
      params={{ itemId: item.id }}
      className="group relative block overflow-hidden rounded-2xl bg-card shadow-soft transition-transform hover:-translate-y-0.5"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        <ProductImage src={item.image_urls?.[0]} name={item.name} className="h-full w-full" rounded="" />
        <button
          onClick={handleWish}
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-background/85 backdrop-blur transition-colors hover:bg-background"
        >
          <Heart className={`h-4 w-4 ${wished ? "fill-primary text-primary" : "text-ink/60"}`} />
        </button>
        {!item.in_stock && (
          <span className="absolute left-2 top-2 rounded-full bg-ink/85 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-cream">
            Made to order
          </span>
        )}
      </div>
      <div className="flex items-start justify-between gap-2 p-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-medium text-foreground">{item.name}</h3>
          <p className="mt-0.5 text-sm font-semibold text-primary">{formatPrice(item.price_minor, item.currency)}</p>
        </div>
        <button
          onClick={handleAdd}
          aria-label="Add to cart"
          className="shrink-0 grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground shadow-pop transition-transform active:scale-95"
        >
          {justAdded ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </button>
      </div>
    </Link>
  );
}
