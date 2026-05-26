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

  getBox: (month: number) =>
    adminFetch(`/api/admin/strata/boxes/${month}`) as Promise<StrataBoxDetail>,

  createBox: (data: StrataBoxFormData) =>
    adminFetch("/api/admin/strata/boxes", { method: "POST", body: JSON.stringify(data) }) as Promise<StrataBoxDetail>,

  updateBox: (month: number, data: StrataBoxFormData) =>
    adminFetch(`/api/admin/strata/boxes/${month}`, { method: "PUT", body: JSON.stringify(data) }) as Promise<StrataBoxDetail>,
};

export interface StrataBoxDetail extends StrataBoxSummary {
  subtitle: string;
  field_card_text: string;
  formation_map_url: string;
  cover_image_url: string;
  contents: string[];
  site_links: { site_slug: string; site_name: string; mineral: string }[];
  created_at: string;
}

export type StrataBoxFormData = Omit<StrataBoxDetail, "shipped_at" | "created_at">;

// ── Users ─────────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  roles: string[];
  email_flags: string[];
  onboarding_answers: string[];
  is_active: boolean;
  is_verified: boolean;
  stripe_account_enabled: boolean;
  created_at: string;
}

export const usersAdminApi = {
  list: (role?: string, active?: boolean) => {
    const params = new URLSearchParams();
    if (role) params.set("role", role);
    if (active !== undefined) params.set("active", String(active));
    return adminFetch(`/api/admin/users?${params}`) as Promise<AdminUser[]>;
  },
  listFlagged: (flag?: string) => {
    const params = new URLSearchParams();
    if (flag) params.set("flag", flag);
    return adminFetch(`/api/admin/users/flagged?${params}`) as Promise<AdminUser[]>;
  },
  setRole: (id: string, role: string) =>
    adminFetch(`/api/admin/users/${id}/role`, { method: "PATCH", body: JSON.stringify({ role }) }) as Promise<AdminUser>,
  setStatus: (id: string, is_active: boolean) =>
    adminFetch(`/api/admin/users/${id}/status`, { method: "PATCH", body: JSON.stringify({ is_active }) }) as Promise<AdminUser>,
};

// ── Sites ─────────────────────────────────────────────────────────────────────

export interface AdminSite {
  id: string;
  name: string;
  operator_id: string;
  operator_name: string;
  province: string;
  minerals: string[];
  price_per_person: number;
  site_type: string;
  is_active: boolean;
  rating: number;
  review_count: number;
  created_at: string;
}

export const sitesAdminApi = {
  list: (active?: boolean) => {
    const params = new URLSearchParams();
    if (active !== undefined) params.set("active", String(active));
    return adminFetch(`/api/admin/sites?${params}`) as Promise<AdminSite[]>;
  },
  setStatus: (id: string, is_active: boolean) =>
    adminFetch(`/api/admin/sites/${id}/status`, { method: "PATCH", body: JSON.stringify({ is_active }) }),
};

// ── Bookings ──────────────────────────────────────────────────────────────────

export interface AdminBooking {
  id: string;
  site_id: string;
  site_name: string;
  visitor_id: string;
  visitor_name: string;
  date: string;
  party_size: number;
  total_amount: number;
  platform_fee: number;
  operator_payout: number;
  status: string;
  is_group_booking: boolean;
  created_at: string;
}

export const bookingsAdminApi = {
  list: (status?: string) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    return adminFetch(`/api/admin/bookings?${params}`) as Promise<AdminBooking[]>;
  },
  setStatus: (id: string, status: string) =>
    adminFetch(`/api/admin/bookings/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
};

// ── Revenue ───────────────────────────────────────────────────────────────────

export interface AdminRevenue {
  booking_gmv: number;
  booking_fee_revenue: number;
  order_gmv: number;
  active_subscriptions: number;
  subscription_mrr: number;
  total_bookings: number;
  total_orders: number;
  monthly: { month: string; bookings_gmv: number; fee: number; orders_gmv: number }[];
}

export const revenueAdminApi = {
  get: () => adminFetch("/api/admin/revenue") as Promise<AdminRevenue>,
};

// ── Expert applications ───────────────────────────────────────────────────────

export interface ExpertApplication {
  id: string;
  name: string;
  email: string;
  credential_type: string;
  credential_reference: string | null;
  expert_specialisations: string[];
  institutional_affiliation: string | null;
  years_experience: number;
  bio: string;
  expert_tier: string | null;
  created_at: string;
}

export const expertAdminApi = {
  listApplications: () =>
    adminFetch("/api/admin/expert/applications") as Promise<ExpertApplication[]>,
  approve: (userId: string, tier: string) =>
    adminFetch(`/api/admin/expert/applications/${userId}`, {
      method: "PATCH",
      body: JSON.stringify({ tier, reject: false }),
    }),
  reject: (userId: string) =>
    adminFetch(`/api/admin/expert/applications/${userId}`, {
      method: "PATCH",
      body: JSON.stringify({ tier: "verified_expert", reject: true }),
    }),
};

// ── Creator applications ───────────────────────────────────────────────────────

export interface CreatorApplication {
  id: string;
  name: string;
  email: string;
  creator_application_handle: string | null;
  creator_application_platform: string | null;
  creator_application_short_answer: string | null;
  creator_application_at: string | null;
  bio: string;
  content_url: string | null;
}

export const creatorAdminApi = {
  listApplications: () =>
    adminFetch("/api/admin/creator/applications") as Promise<CreatorApplication[]>,
  approve: (userId: string, tier: string) =>
    adminFetch(`/api/admin/creator/applications/${userId}`, {
      method: "PATCH",
      body: JSON.stringify({ tier, reject: false }),
    }),
  reject: (userId: string) =>
    adminFetch(`/api/admin/creator/applications/${userId}`, {
      method: "PATCH",
      body: JSON.stringify({ tier: "explorer", reject: true }),
    }),
};
