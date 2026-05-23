import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { getWishlist, useStoreVersion } from "@/lib/store";
import { ProductCard } from "@/components/ProductCard";

export const Route = createFileRoute("/wishlist")({ component: WishlistPage });

function WishlistPage() {
  useStoreVersion();
  const items = Object.values(getWishlist());
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl md:text-4xl">Wishlist</h1>
        <p className="text-sm text-muted-foreground">{items.length} saved piece{items.length === 1 ? "" : "s"}</p>
      </div>
      {items.length === 0 ? (
        <div className="mx-auto max-w-md py-12 text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-primary/10 text-primary">
            <Heart className="h-8 w-8" />
          </div>
          <p className="mt-5 font-display text-2xl">No saves yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Tap the heart on any piece to save it for later.</p>
          <Link to="/" className="mt-6 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">Discover pieces</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {items.map((it) => <ProductCard key={it.id} item={it} />)}
        </div>
      )}
    </div>
  );
}
