import { Link, useRouterState } from "@tanstack/react-router";
import { Heart, ShoppingBag, Search } from "lucide-react";
import { cartCount, useStoreVersion } from "@/lib/store";

export function TopBar() {
  useStoreVersion();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const cartN = cartCount();
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-display text-xl tracking-tight">MENSAH</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <Link to="/" className="hover:text-foreground" activeOptions={{ exact: true }} activeProps={{ className: "text-foreground" }}>Discover</Link>
          <Link to="/search" className="hover:text-foreground" activeProps={{ className: "text-foreground" }}>Browse</Link>
          <Link to="/wishlist" className="hover:text-foreground" activeProps={{ className: "text-foreground" }}>Wishlist</Link>
          <Link to="/track" className="hover:text-foreground" activeProps={{ className: "text-foreground" }}>Track order</Link>
        </nav>
        <div className="flex items-center gap-1">
          <Link to="/search" aria-label="Search" className="grid h-9 w-9 place-items-center rounded-full hover:bg-muted md:hidden">
            <Search className="h-4 w-4" />
          </Link>
          <Link to="/wishlist" aria-label="Wishlist" className="hidden h-9 w-9 place-items-center rounded-full hover:bg-muted md:grid">
            <Heart className="h-4 w-4" />
          </Link>
          <Link to="/cart" aria-label="Cart" className="relative grid h-9 w-9 place-items-center rounded-full hover:bg-muted">
            <ShoppingBag className="h-4 w-4" />
            {cartN > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">{cartN}</span>
            )}
          </Link>
        </div>
      </div>
      {path === "/" || path.startsWith("/search") ? null : null}
    </header>
  );
}
