"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Menu, X, Mountain } from "lucide-react";
import { useAuthStore } from "@/lib/auth";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const [open, setOpen] = useState(false);

  function handleLogout() {
    clearAuth();
    router.push("/");
    setOpen(false);
  }

  const visitorLinks = [
    { href: "/sites", label: "Browse Sites" },
    { href: "/guides", label: "Find a Guide" },
    { href: "/bookings", label: "My Bookings" },
    { href: "/passport", label: "My Passport" },
  ];

  const operatorLinks = [
    { href: "/sites", label: "Browse Sites" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/dashboard/sites", label: "My Sites" },
  ];

  const guideLinks = [
    { href: "/sites", label: "Browse Sites" },
    { href: "/guides", label: "Guides" },
    { href: "/dashboard/guide", label: "My Dashboard" },
  ];

  const links =
    user?.role === "operator" || user?.role === "admin" ? operatorLinks :
    user?.role === "guide" ? guideLinks :
    visitorLinks;

  return (
    <nav className="sticky top-0 z-50 border-b border-stone-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-extrabold text-stone-900">
          <Mountain className="h-5 w-5 text-brand-600" />
          <span>
            digby<span className="text-brand-600">.rocks</span>
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-6 md:flex">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-brand-600",
                pathname === href ? "text-brand-600" : "text-stone-600"
              )}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Desktop auth */}
        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <span className="text-sm text-stone-500">{user.name}</span>
              <button onClick={handleLogout} className="btn-secondary text-sm py-1.5">
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-secondary text-sm py-1.5">
                Log in
              </Link>
              <Link href="/register" className="btn-primary text-sm py-1.5">
                Sign up
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="rounded-lg p-2 text-stone-600 hover:bg-stone-100 md:hidden"
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-stone-100 bg-white px-4 pb-4 md:hidden">
          <div className="flex flex-col gap-1 pt-3">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  pathname === href
                    ? "bg-brand-50 text-brand-600"
                    : "text-stone-700 hover:bg-stone-50"
                )}
              >
                {label}
              </Link>
            ))}
            <div className="mt-3 flex flex-col gap-2 border-t border-stone-100 pt-3">
              {user ? (
                <>
                  <p className="px-3 text-xs text-stone-400">{user.name}</p>
                  <button onClick={handleLogout} className="btn-secondary text-sm">
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setOpen(false)} className="btn-secondary text-sm">
                    Log in
                  </Link>
                  <Link href="/register" onClick={() => setOpen(false)} className="btn-primary text-sm">
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
