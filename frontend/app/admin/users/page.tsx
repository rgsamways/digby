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

const FLAG_STYLES: Record<string, string> = {
  university:   "bg-blue-100 text-blue-700",
  school_board: "bg-green-100 text-green-700",
  government:   "bg-amber-100 text-amber-700",
  mining:       "bg-stone-100 text-stone-700",
};

const FLAG_LABELS: Record<string, string> = {
  university:   "University",
  school_board: "School Board",
  government:   "Government",
  mining:       "Mining Co.",
};

type Tab = "all" | "flagged";

export default function AdminUsersPage() {
  const [tab, setTab] = useState<Tab>("all");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [flaggedUsers, setFlaggedUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("");
  const [flagFilter, setFlagFilter] = useState("");
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState<string | null>(null);

  async function loadAll() {
    setLoading(true);
    try {
      setUsers(await usersAdminApi.list(roleFilter || undefined));
    } finally { setLoading(false); }
  }

  async function loadFlagged() {
    setLoading(true);
    try {
      setFlaggedUsers(await usersAdminApi.listFlagged(flagFilter || undefined));
    } finally { setLoading(false); }
  }

  useEffect(() => { if (tab === "all") loadAll(); }, [tab, roleFilter]);
  useEffect(() => { if (tab === "flagged") loadFlagged(); }, [tab, flagFilter]);

  async function setRole(user: AdminUser, role: string) {
    if (role === user.role) return;
    setPending(user.id + "-role");
    try {
      const updated = await usersAdminApi.setRole(user.id, role);
      setUsers((u) => u.map((x) => (x.id === user.id ? updated : x)));
      setFlaggedUsers((u) => u.map((x) => (x.id === user.id ? updated : x)));
    } finally { setPending(null); }
  }

  async function toggleActive(user: AdminUser) {
    setPending(user.id + "-status");
    try {
      const updated = await usersAdminApi.setStatus(user.id, !user.is_active);
      setUsers((u) => u.map((x) => (x.id === user.id ? updated : x)));
      setFlaggedUsers((u) => u.map((x) => (x.id === user.id ? updated : x)));
    } finally { setPending(null); }
  }

  const activeList = tab === "all" ? users : flaggedUsers;
  const visible = activeList.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  function UserTable({ rows }: { rows: AdminUser[] }) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-100 text-left text-[11px] font-semibold uppercase tracking-widest text-stone-400">
              <th className="px-4 py-2.5">User</th>
              <th className="px-4 py-2.5">Role</th>
              {tab === "flagged" && <th className="px-4 py-2.5">Flags</th>}
              {tab === "flagged" && <th className="px-4 py-2.5">Intent</th>}
              <th className="px-4 py-2.5">Stripe</th>
              <th className="px-4 py-2.5">Joined</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u, i) => (
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
                {tab === "flagged" && (
                  <td className="px-4 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {(u.email_flags ?? []).map((f) => (
                        <span key={f} className={`rounded px-2 py-0.5 text-[10px] font-semibold ${FLAG_STYLES[f] ?? "bg-stone-100 text-stone-500"}`}>
                          {FLAG_LABELS[f] ?? f}
                        </span>
                      ))}
                    </div>
                  </td>
                )}
                {tab === "flagged" && (
                  <td className="px-4 py-2.5">
                    <p className="text-[11px] text-stone-500 max-w-[180px] truncate">
                      {(u.onboarding_answers ?? []).join(", ") || "—"}
                    </p>
                  </td>
                )}
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
    );
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-stone-900 tracking-tight">Users</h1>
          <p className="mt-0.5 text-sm text-stone-400">{activeList.length} {tab === "flagged" ? "flagged" : "total"}</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="text" placeholder="Search name or email…" value={search}
            onChange={(e) => setSearch(e.target.value)} className="input w-52 text-sm" />
          {tab === "all" && (
            <select className="input w-36 text-sm" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              {ROLES.map((r) => <option key={r} value={r}>{r || "All roles"}</option>)}
            </select>
          )}
          {tab === "flagged" && (
            <select className="input w-40 text-sm" value={flagFilter} onChange={(e) => setFlagFilter(e.target.value)}>
              <option value="">All flags</option>
              <option value="university">University</option>
              <option value="school_board">School Board</option>
              <option value="government">Government</option>
            </select>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-xl border border-stone-200 bg-stone-100 p-1 w-fit">
        <button onClick={() => setTab("all")}
          className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${tab === "all" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"}`}>
          All users
        </button>
        <button onClick={() => setTab("flagged")}
          className={`flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${tab === "flagged" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"}`}>
          Partnership leads
          {flaggedUsers.length > 0 && tab !== "flagged" && (
            <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">{flaggedUsers.length}</span>
          )}
        </button>
      </div>

      {tab === "flagged" && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          These users registered with institutional email domains (university, school board, government). Each is a potential partnership or outreach lead.
        </div>
      )}

      {loading ? (
        <p className="text-sm text-stone-400">Loading…</p>
      ) : visible.length === 0 ? (
        <p className="text-sm text-stone-400">{tab === "flagged" ? "No flagged signups yet." : "No users found."}</p>
      ) : (
        <UserTable rows={visible} />
      )}
    </div>
  );
}
