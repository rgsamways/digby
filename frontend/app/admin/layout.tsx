"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Package, ShoppingBag, LogOut, LayoutDashboard } from "lucide-react";
import { isAdminAuthenticated, clearAdminToken } from "@/lib/admin";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (pathname === "/admin/login") {
      setReady(true);
      return;
    }
    if (!isAdminAuthenticated()) {
      router.replace("/admin/login");
    } else {
      setReady(true);
    }
  }, [pathname, router]);

  if (!ready) return null;
  if (pathname === "/admin/login") return <>{children}</>;

  function handleLogout() {
    clearAdminToken();
    router.push("/admin/login");
  }

  const navItems = [
    { href: "/admin/products", label: "Products", icon: Package },
    { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  ];

  return (
    <div className="flex min-h-screen bg-stone-50">
      {/* Sidebar */}
      <aside className="flex w-56 shrink-0 flex-col border-r border-stone-200 bg-white">
        <div className="border-b border-stone-200 px-4 py-4">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5 text-brand-600" />
            <span className="font-bold text-stone-900">Admin</span>
          </div>
          <p className="mt-0.5 text-xs text-stone-400">digby.rocks</p>
        </div>
        <nav className="flex-1 p-3">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                pathname.startsWith(href)
                  ? "bg-brand-50 text-brand-700"
                  : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-stone-200 p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-stone-500 transition hover:bg-stone-50 hover:text-stone-900"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}
