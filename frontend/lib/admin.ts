"use client";

const TOKEN_KEY = "digby-admin-token";
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setAdminToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAdminToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function isAdminAuthenticated(): boolean {
  const token = getAdminToken();
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role === "admin" && payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

async function adminFetch(path: string, options: RequestInit = {}): Promise<unknown> {
  const token = getAdminToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Request failed");
  }
  return res.json();
}

export const adminApi = {
  login: (password: string) =>
    adminFetch("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({ password }),
    }) as Promise<{ token: string }>,

  // Products
  listProducts: (skip = 0, limit = 50) =>
    adminFetch(`/api/admin/products?skip=${skip}&limit=${limit}`) as Promise<AdminProduct[]>,
  createProduct: (data: ProductFormData) =>
    adminFetch("/api/admin/products", { method: "POST", body: JSON.stringify(data) }) as Promise<AdminProduct>,
  updateProduct: (id: string, data: ProductFormData) =>
    adminFetch(`/api/admin/products/${id}`, { method: "PUT", body: JSON.stringify(data) }) as Promise<AdminProduct>,
  deactivateProduct: (id: string) =>
    adminFetch(`/api/admin/products/${id}`, { method: "DELETE" }),

  // Orders
  listOrders: (skip = 0, limit = 50, status?: string) =>
    adminFetch(`/api/admin/orders?skip=${skip}&limit=${limit}${status ? `&status=${status}` : ""}`) as Promise<AdminOrder[]>,
  getOrder: (id: string) =>
    adminFetch(`/api/admin/orders/${id}`) as Promise<AdminOrder>,
  updateOrderStatus: (id: string, status: string, tracking_number?: string) =>
    adminFetch(`/api/admin/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, tracking_number: tracking_number ?? "" }),
    }),
};

export interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  category: string;
  subcategory: string;
  description: string;
  price: number;
  cost: number;
  images: string[];
  sku: string;
  supplier: string;
  stock: number;
  dropship: boolean;
  active: boolean;
  tags: string[];
  related_products: string[];
  site_recommendations: string[];
  created_at: string;
  updated_at: string;
}

export interface AdminOrder {
  id: string;
  user_id: string;
  user_email: string;
  items: { product_id: string; product_name: string; qty: number; price: number }[];
  total: number;
  status: string;
  stripe_payment_intent_id: string;
  shipping_address: Record<string, string>;
  tracking_number: string;
  created_at: string;
}

export type ProductFormData = Omit<AdminProduct, "id" | "created_at" | "updated_at">;

// ── Strata ────────────────────────────────────────────────────────────────────

export interface StrataSubscriber {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  tier: string;
  billing_frequency: string;
  status: string;
  shipping_address: Record<string, string>;
  is_gift: boolean;
  current_period_end: string | null;
  created_at: string;
}

export interface StrataFulfilmentRow extends StrataSubscriber {
  shipped: boolean;
  shipped_at: string | null;
  tracking_number: string;
}

export interface StrataBoxSummary {
  month_number: number;
  theme: string;
  is_published: boolean;
  shipped_at: string | null;
}

export const strataAdminApi = {
  listSubscribers: (status?: string) =>
    adminFetch(`/api/admin/strata/subscribers${status ? `?status=${status}` : ""}`) as Promise<StrataSubscriber[]>,

  listBoxes: () =>
    adminFetch("/api/admin/strata/boxes") as Promise<StrataBoxSummary[]>,

  getFulfilment: (boxMonth: number) =>
    adminFetch(`/api/admin/strata/fulfilment/${boxMonth}`) as Promise<StrataFulfilmentRow[]>,

  markShipped: (boxMonth: number, subscriptionId: string, trackingNumber = "") =>
    adminFetch(`/api/admin/strata/fulfilment/${boxMonth}/${subscriptionId}`, {
      method: "PATCH",
      body: JSON.stringify({ tracking_number: trackingNumber }),
    }),

  unmarkShipped: (boxMonth: number, subscriptionId: string) =>
    adminFetch(`/api/admin/strata/fulfilment/${boxMonth}/${subscriptionId}`, {
      method: "DELETE",
    }),

  shippingLabelsUrl: (boxMonth: number) => {
    const token = getAdminToken();
    return `${API_BASE}/api/admin/strata/shipping-labels/${boxMonth}?token=${token ?? ""}`;
  },
};
