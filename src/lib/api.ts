export const API_BASE = "https://api-hackathon.codedematrixtech.com";

// When building/prerendering we may want to avoid calling the real API
// (unstable or private). Set PRERENDER_USE_FIXTURES=true in the build
// environment to use lightweight fixtures instead.
const USE_FIXTURES = (process.env.PRERENDER_USE_FIXTURES ?? process.env.VITE_PRERENDER_USE_FIXTURES) === "true" ||
  (process.env.PRERENDER_USE_FIXTURES ?? process.env.VITE_PRERENDER_USE_FIXTURES) === "1";

const FIXTURE_MERCHANTS: Merchant[] = [
  { id: "m1", name: "Aduke Designs", whatsapp_number: "+233201724957" },
  { id: "m2", name: "Kente House", whatsapp_number: "+233201724958" },
];

const FIXTURE_ITEMS: Item[] = [
  { id: "rt-kaftan-maroon", merchant_id: "m1", name: "Maroon Kaftan", price_minor: 12000, currency: "GHS", image_urls: ["/white-agbada.jpg"], in_stock: true },
  { id: "blue-shirt", merchant_id: "m2", name: "Blue Shirt", price_minor: 8000, currency: "GHS", image_urls: ["/blue-shirt.jpg"], in_stock: true },
];

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
  const url = `${API_BASE}${path}`;
  const maxRetries = 3;
  let attempt = 0;
  while (true) {
    try {
      const res = await fetch(url, {
        ...init,
        headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
      });

      if (res.ok) {
        // Try to parse JSON; let the caller handle structure errors
        return (await res.json()) as T;
      }

      const text = await res.text().catch(() => res.statusText || "");
      // Log details to help diagnose build-time prerender failures
      console.error(`API request failed ${res.status} ${res.statusText} -> ${url}`);
      if (text) console.error(`API response body: ${text}`);

      // Retry on server errors (5xx). For client errors (4xx) don't retry.
      if (res.status >= 500 && attempt < maxRetries - 1) {
        attempt++;
        const backoff = 200 * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, backoff));
        continue;
      }

      throw new Error(`API ${res.status}: ${text || res.statusText}`);
    } catch (err) {
      // Network or other fetch-level errors
      console.error(`API fetch error on ${url}:`, err instanceof Error ? err.message : String(err));
      if (attempt < maxRetries - 1) {
        attempt++;
        const backoff = 200 * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, backoff));
        continue;
      }
      throw err;
    }
  }
}

export const api = {
  listMerchants: () => {
    if (USE_FIXTURES) return Promise.resolve(FIXTURE_MERCHANTS);
    return req<Merchant[]>('/merchants');
  },
  getMerchant: (slug: string) => {
    if (USE_FIXTURES) return Promise.resolve(FIXTURE_MERCHANTS.find((m) => m.id === slug) as Merchant);
    return req<Merchant>(`/merchants/${slug}`);
  },
  listMerchantItems: (slug: string) => {
    if (USE_FIXTURES) return Promise.resolve(FIXTURE_ITEMS.filter((it) => it.merchant_id === slug));
    return req<Item[]>(`/merchants/${slug}/items`);
  },
  getItem: (id: string) => {
    if (USE_FIXTURES) return Promise.resolve(FIXTURE_ITEMS.find((i) => i.id === id) as Item);
    return req<Item>(`/items/${id}`);
  },
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
