// Local-only persistence: cart, wishlist, recently viewed, recent orders.
// The API has no auth/cart/wishlist endpoints — cart is materialized into a
// basket only at checkout time.
import { useSyncExternalStore } from "react";
import type { Item } from "./api";

type CartLine = { item_id: string; qty: number; snapshot: Item };
type CartState = { merchant_id: string | null; lines: CartLine[] };

const CART_KEY = "wm.cart.v1";
const WISH_KEY = "wm.wishlist.v1";
const RECENT_KEY = "wm.recent.v1";
const ORDERS_KEY = "wm.orders.v1";

const isClient = typeof window !== "undefined";

function read<T>(key: string, fallback: T): T {
  if (!isClient) return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  if (!isClient) return;
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("wm-store", { detail: key }));
}

function subscribe(key: string, cb: () => void) {
  if (!isClient) return () => {};
  const handler = (e: Event) => {
    const ev = e as CustomEvent<string>;
    if (!ev.detail || ev.detail === key) cb();
  };
  window.addEventListener("wm-store", handler);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener("wm-store", handler);
    window.removeEventListener("storage", cb);
  };
}

// ---------------- Cart ----------------
export function getCart(): CartState {
  return read<CartState>(CART_KEY, { merchant_id: null, lines: [] });
}
export function useCart(): CartState {
  return useSyncExternalStore(
    (cb) => subscribe(CART_KEY, cb),
    () => JSON.stringify(getCart()),
    () => JSON.stringify({ merchant_id: null, lines: [] }),
  ) as unknown as CartState && getCart();
}

export function addToCart(item: Item, qty = 1): { replaced: boolean } {
  const cart = getCart();
  let replaced = false;
  if (cart.merchant_id && cart.merchant_id !== item.merchant_id) {
    // Single-merchant cart constraint (API baskets are per-merchant).
    cart.lines = [];
    replaced = true;
  }
  cart.merchant_id = item.merchant_id;
  const existing = cart.lines.find((l) => l.item_id === item.id);
  if (existing) existing.qty += qty;
  else cart.lines.push({ item_id: item.id, qty, snapshot: item });
  write(CART_KEY, cart);
  return { replaced };
}
export function setQty(item_id: string, qty: number) {
  const cart = getCart();
  if (qty <= 0) cart.lines = cart.lines.filter((l) => l.item_id !== item_id);
  else {
    const line = cart.lines.find((l) => l.item_id === item_id);
    if (line) line.qty = qty;
  }
  if (cart.lines.length === 0) cart.merchant_id = null;
  write(CART_KEY, cart);
}
export function removeFromCart(item_id: string) {
  setQty(item_id, 0);
}
export function clearCart() {
  write(CART_KEY, { merchant_id: null, lines: [] });
}
export function cartCount(): number {
  return getCart().lines.reduce((s, l) => s + l.qty, 0);
}
export function cartTotalMinor(): number {
  return getCart().lines.reduce((s, l) => s + l.qty * l.snapshot.price_minor, 0);
}

// ---------------- Wishlist ----------------
export function getWishlist(): Record<string, Item> {
  return read<Record<string, Item>>(WISH_KEY, {});
}
export function toggleWishlist(item: Item) {
  const w = getWishlist();
  if (w[item.id]) delete w[item.id];
  else w[item.id] = item;
  write(WISH_KEY, w);
}
export function isWishlisted(id: string): boolean {
  return Boolean(getWishlist()[id]);
}

// ---------------- Recently viewed ----------------
export function getRecent(): Item[] {
  return read<Item[]>(RECENT_KEY, []);
}
export function pushRecent(item: Item) {
  const list = getRecent().filter((i) => i.id !== item.id);
  list.unshift(item);
  write(RECENT_KEY, list.slice(0, 12));
}

// ---------------- Recent orders ----------------
export type RecentOrder = { id: string; created_at: number; merchant_name?: string; total_minor?: number; currency?: string };
export function getRecentOrders(): RecentOrder[] {
  return read<RecentOrder[]>(ORDERS_KEY, []);
}
export function pushOrder(order: RecentOrder) {
  const list = getRecentOrders().filter((o) => o.id !== order.id);
  list.unshift(order);
  write(ORDERS_KEY, list.slice(0, 20));
}

// Subscribe helper for components that need to re-render on any store change.
export function useStoreVersion(): number {
  return useSyncExternalStore(
    (cb) => subscribe("", cb),
    () => (isClient ? Number(localStorage.length) + (localStorage.getItem(CART_KEY)?.length ?? 0) : 0),
    () => 0,
  );
}
