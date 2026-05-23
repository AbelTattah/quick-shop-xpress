export const API_BASE = "https://api-hackathon.codedematrixtech.com";

export type Merchant = {
  id: string;
  name: string;
  description?: string | null;
  logo_url?: string | null;
  brand_colors?: string[] | null;
  whatsapp_number?: string | null;
};

export type Item = {
  id: string;
  merchant_id: string;
  name: string;
  description?: string | null;
  price_minor: number;
  currency: string;
  image_urls?: string[] | null;
  in_stock: boolean;
};

export type Campaign = {
  id: string;
  title: string;
  copy_text?: string | null;
  image_urls?: string[] | null;
  team_slug?: string | null;
  created_at: number;
};

export type BasketItem = {
  item_id: string;
  name: string;
  price_minor: number;
  currency: string;
  image_url?: string | null;
  in_stock: boolean;
  qty: number;
  item_note?: string | null;
};

export type Basket = {
  id: string;
  merchant?: { id: string; name: string; whatsapp_number?: string | null } | null;
  items: BasketItem[];
  total_minor: number;
  currency?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_note?: string | null;
  created_at: number;
};

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text().catch(() => res.statusText)}`);
  return res.json() as Promise<T>;
}

export const api = {
  listMerchants: () => req<Merchant[]>("/merchants"),
  getMerchant: (slug: string) => req<Merchant>(`/merchants/${slug}`),
  listMerchantItems: (slug: string) => req<Item[]>(`/merchants/${slug}/items`),
  getItem: (id: string) => req<Item>(`/items/${id}`),
  createBasket: (body: {
    merchant_id: string;
    items: { item_id: string; qty: number; item_note?: string }[];
    customer_name?: string;
    customer_phone?: string;
    customer_note?: string;
  }) => req<{ id: string }>("/baskets", { method: "POST", body: JSON.stringify(body) }),
  getBasket: (id: string) => req<Basket>(`/baskets/${id}`),
};

// Image URLs from the API are relative paths like /images/... that may not
// be reachable; render a tasteful placeholder when loading fails.
export function resolveImage(url?: string | null): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  // Absolute URLs (http/https)
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  // Protocol-relative URLs (//cdn.example.com/...)
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  // Ensure there's a single slash between API_BASE and the path
  if (trimmed.startsWith("/")) return `${API_BASE}${trimmed}`;
  return `${API_BASE}/${trimmed}`;
}

export function formatPrice(minor: number, currency = "GHS"): string {
  const major = minor / 100;
  try {
    return new Intl.NumberFormat("en-GH", { style: "currency", currency, maximumFractionDigits: 0 }).format(major);
  } catch {
    return `${currency} ${major.toFixed(0)}`;
  }
}
