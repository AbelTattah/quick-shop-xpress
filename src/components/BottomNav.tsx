import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Search, Heart, ShoppingBag } from "lucide-react";
import { cartCount, getWishlist, useStoreVersion } from "@/lib/store";

const links = [
  { to: "/", label: "Home", Icon: Home },
  { to: "/search", label: "Search", Icon: Search },
  { to: "/wishlist", label: "Wishlist", Icon: Heart },
  { to: "/cart", label: "Cart", Icon: ShoppingBag },
] as const;

export function BottomNav() {
  useStoreVersion();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const cartN = cartCount();
  const wishN = Object.keys(getWishlist()).length;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/85 backdrop-blur-lg pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {links.map(({ to, label, Icon }) => {
          const active = to === "/" ? path === "/" : path.startsWith(to);
          const badge = to === "/cart" ? cartN : to === "/wishlist" ? wishN : 0;
          return (
            <li key={to}>
              <Link
                to={to}
                className={`relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <span className="relative">
                  <Icon className={`h-5 w-5 ${active ? "stroke-[2.4]" : ""}`} />
                  {badge > 0 && (
                    <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground">
                      {badge}
                    </span>
                  )}
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
