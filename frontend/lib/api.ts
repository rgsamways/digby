const BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001").replace(/^http:\/\/(?!localhost)/, "https://");
console.log("[api] NEXT_PUBLIC_API_URL:", process.env.NEXT_PUBLIC_API_URL);
console.log("[api] BASE:", BASE);

type RequestOptions = {
  auth?: boolean;
  headers?: Record<string, string>;
};

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("digby_token");
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  opts: RequestOptions = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...opts.headers,
  };

  if (opts.auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Request failed");
  }

  return res.json() as Promise<T>;
}

export const api = {
  get: <T = unknown>(path: string, opts?: RequestOptions) =>
    request<T>("GET", path, undefined, opts),
  post: <T = unknown>(path: string, body: unknown, opts?: RequestOptions) =>
    request<T>("POST", path, body, opts),
  patch: <T = unknown>(path: string, body: unknown, opts?: RequestOptions) =>
    request<T>("PATCH", path, body, opts),
  del: <T = unknown>(path: string, opts?: RequestOptions) =>
    request<T>("DELETE", path, undefined, opts),
};
