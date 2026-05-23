"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Package, ShoppingBag, LogOut, Layers, Gem, Users, MapPin, CalendarCheck, BarChart2 } from "lucide-react";
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
    { href: "/admin/strata", label: "Strata", icon: Layers },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/sites", label: "Sites", icon: MapPin },
    { href: "/admin/bookings", label: "Bookings", icon: CalendarCheck },
    { href: "/admin/revenue", label: "Revenue", icon: BarChart2 },
  ];

  return (
    <div className="flex min-h-screen bg-[#F7F6F2]">
      {/* Dark sidebar */}
      <aside className="flex w-56 shrink-0 flex-col bg-stone-900">
        {/* Logo */}
        <div className="px-4 py-5 border-b border-stone-800">
          <div className="flex items-center gap-2">
            <Gem className="h-4 w-4 text-amber-400" />
            <span className="font-extrabold text-white tracking-tight">
              digby<span className="text-amber-400">.rocks</span>
            </span>
          </div>
          <p className="mt-1 text-[11px] font-medium uppercase tracking-widest text-stone-500">Admin</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                pathname.startsWith(href)
                  ? "bg-amber-400/10 text-amber-400"
                  : "text-stone-400 hover:bg-stone-800 hover:text-stone-100"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-2 py-3 border-t border-stone-800">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-stone-500 transition-colors hover:bg-stone-800 hover:text-stone-300"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Log out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}
