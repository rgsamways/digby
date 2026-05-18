"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useAuthStore } from "@/lib/auth";
import { api } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const params = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: params.get("role") === "operator" ? "operator" : "visitor",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api.post<{ access_token: string; user_id: string; name: string; role: "visitor" | "operator" | "admin" }>("/api/auth/register", form);
      setAuth(data.access_token, { id: data.user_id, name: data.name, role: data.role });
      router.push(data.role === "operator" ? "/dashboard" : "/sites");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-sm p-8">
        <h1 className="mb-6 text-2xl font-bold text-stone-900">Create account</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { label: "Full name", key: "name", type: "text", placeholder: "Jane Smith" },
            { label: "Email", key: "email", type: "email", placeholder: "you@example.com" },
            { label: "Password", key: "password", type: "password", placeholder: "" },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <label className="mb-1 block text-sm font-medium text-stone-700">{label}</label>
              <input
                type={type}
                value={form[key as keyof typeof form]}
                onChange={set(key)}
                required
                className="input"
                placeholder={placeholder}
              />
            </div>
          ))}
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">I am a…</label>
            <select value={form.role} onChange={set("role")} className="input">
              <option value="visitor">Visitor / Rockhound</option>
              <option value="operator">Operator / Landowner</option>
            </select>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-stone-600">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-brand-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
