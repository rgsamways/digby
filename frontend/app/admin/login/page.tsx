"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mountain } from "lucide-react";
import { adminApi, setAdminToken } from "@/lib/admin";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { token } = await adminApi.login(password);
      setAdminToken(token);
      router.push("/admin/products");
    } catch {
      setError("Incorrect password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Mountain className="mx-auto mb-3 h-10 w-10 text-brand-600" />
          <h1 className="text-2xl font-bold text-stone-900">digby Admin</h1>
        </div>
        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div>
            <label className="label">Password</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
