"use client";

import { useState, useEffect } from "react";
import { usersAdminApi, type AdminUser } from "@/lib/admin";

const ROLES = ["", "visitor", "operator", "guide", "admin"];

const ROLE_STYLES: Record<string, string> = {
  visitor:  "bg-stone-100 text-stone-500",
  operator: "bg-sky-400/10 text-sky-600",
  guide:    "bg-violet-400/10 text-violet-600",
  admin:    "bg-amber-400/10 text-amber-600",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("");
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      setUsers(await usersAdminApi.list(roleFilter || undefined));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [roleFilter]);

  async function setRole(user: AdminUser, role: string) {
    if (role === user.role) return;
    setPending(user.id + "-role");
    try {
      const updated = await usersAdminApi.setRole(user.id, role);
      setUsers((u) => u.map((x) => (x.id === user.id ? updated : x)));
    } finally {
      setPending(null);
    }
  }

  async function toggleActive(user: AdminUser) {
    setPending(user.id + "-status");
    try {
      const updated = await usersAdminApi.setStatus(user.id, !user.is_active);
      setUsers((u) => u.map((x) => (x.id === user.id ? updated : x)));
    } finally {
      setPending(null);
    }
  }

  const visible = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-stone-900 tracking-tight">Users</h1>
          <p className="mt-0.5 text-sm text-stone-400">{users.length} users</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input w-52 text-sm"
          />
          <select className="input w-36 text-sm" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            {ROLES.map((r) => <option key={r} value={r}>{r || "All roles"}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-stone-400">Loading…</p>
      ) : visible.length === 0 ? (
        <p className="text-sm text-stone-400">No users found.</p>
      ) : (
        <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 text-left text-[11px] font-semibold uppercase tracking-widest text-stone-400">
                <th className="px-4 py-2.5">User</th>
                <th className="px-4 py-2.5">Role</th>
                <th className="px-4 py-2.5">Stripe</th>
                <th className="px-4 py-2.5">Joined</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((u, i) => (
                <tr key={u.id} className={`border-b border-stone-50 last:border-0 hover:bg-stone-50/60 transition-colors ${i % 2 === 1 ? "bg-stone-50/40" : ""} ${!u.is_active ? "opacity-50" : ""}`}>
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-stone-900">{u.name}</p>
                    <p className="font-mono text-[10px] text-stone-400">{u.email}</p>
                  </td>
                  <td className="px-4 py-2.5">
                    <select
                      value={u.role}
                      onChange={(e) => setRole(u, e.target.value)}
                      disabled={pending === u.id + "-role"}
                      className={`rounded px-2 py-0.5 text-[11px] font-semibold tracking-wide border-0 cursor-pointer ${ROLE_STYLES[u.role] ?? "bg-stone-100 text-stone-500"}`}
                    >
                      {ROLES.filter(Boolean).map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-2.5">
                    {u.stripe_account_enabled ? (
                      <span className="inline-flex rounded px-2 py-0.5 text-[11px] font-semibold bg-emerald-400/10 text-emerald-600">Connected</span>
                    ) : (
                      <span className="text-[11px] text-stone-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[11px] text-stone-400">
                    {new Date(u.created_at).toLocaleDateString("en-CA")}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex rounded px-2 py-0.5 text-[11px] font-semibold ${u.is_active ? "bg-emerald-400/10 text-emerald-600" : "bg-stone-100 text-stone-400"}`}>
                      {u.is_active ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <button
                      onClick={() => toggleActive(u)}
                      disabled={pending === u.id + "-status"}
                      className="text-xs font-medium text-amber-500 hover:text-amber-600 disabled:opacity-40"
                    >
                      {u.is_active ? "Disable" : "Enable"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
