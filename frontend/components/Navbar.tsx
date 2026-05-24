"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Menu, X, Gem, ChevronDown, ShoppingCart } from "lucide-react";
import { useAuthStore } from "@/lib/auth";
import { useCartStore } from "@/lib/cart";
import { cn } from "@/lib/utils";

const exploreLinks = [
  { href: "/finds", label: "Find Feed" },
  { href: "/gallery/uv", label: "UV Gallery" },
  { href: "/drops", label: "Specimen Drops" },
  { href: "/creators", label: "Creators" },
  { href: "/community", label: "Community" },
  { href: "/guides", label: "Find a Guide" },
  { href: "/mystery", label: "Mystery Dig" },
  { href: "/mineral-id", label: "Mineral ID" },
  { href: "/mineral-school", label: "Field Guides" },
  { href: "/learn", label: "GIS Education" },
  { href: "/alerts", label: "Alerts" },
  { href: "/quiz", label: "Quiz" },
];

const myDigbyLinks = [
  { href: "/bookings", label: "My Bookings" },
  { href: "/passport", label: "My Passport" },
  { href: "/diary", label: "Trip Journal" },
  { href: "/finds/my", label: "Find Journal" },
  { href: "/junior", label: "Junior Club 🪨" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleLogout() {
    clearAuth();
    router.push("/");
    setMobileOpen(false);
    setOpenMenu(null);
  }

  function toggle(name: string) {
    setOpenMenu(openMenu === name ? null : name);
  }

  const isOperator = user?.role === "operator" || user?.role === "admin";
  const isGuide = user?.role === "guide";
  const isVisitor = !isOperator && !isGuide;

  const isExploreActive = exploreLinks.some((l) => pathname === l.href);
  const isMyDigbyActive = myDigbyLinks.some((l) => pathname === l.href);
  const cartCount = useCartStore((s) => s.items.reduce((n, i) => n + i.qty, 0));

  // Primary nav items (always visible in desktop bar)
  const primaryLinks = isOperator
    ? [
        { href: "/sites", label: "Browse Sites" },
        { href: "/specimens", label: "Marketplace" },
        { href: "/mineral-id", label: "Mineral ID" },
        { href: "/dashboard/sites", label: "My Sites" },
        { href: "/dashboard", label: "Dashboard" },
      ]
    : isGuide
    ? [
        { href: "/sites", label: "Browse Sites" },
        { href: "/guides", label: "Guides" },
        { href: "/dashboard/guide", label: "My Dashboard" },
        { href: "/quiz", label: "Quiz" },
      ]
    : [
        { href: "/sites", label: "Browse Sites" },
        { href: "/map", label: "Map" },
        { href: "/shop", label: "Shop" },
        { href: "/strata", label: "Strata" },
      ];

  // All links for mobile (flat list)
  const allMobileLinks = [
    ...primaryLinks,
    { href: "/shop/cart", label: `Cart${cartCount > 0 ? ` (${cartCount})` : ""}` },
    ...(isVisitor ? exploreLinks : []),
    ...(isVisitor && user ? myDigbyLinks : []),
  ];

  return (
    <nav ref={navRef} className="sticky top-0 z-50 border-b border-stone-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Gem className="h-5 w-5 text-brand-600" />
          <span className="font-display text-lg text-stone-900 tracking-tight">
            digby<span className="text-brand-600">.rocks</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          {primaryLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative px-3 py-2 text-sm font-medium transition-colors hover:text-brand-600",
                pathname === href
                  ? "text-brand-600 after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:rounded-full after:bg-brand-500"
                  : "text-stone-600"
              )}
            >
              {label}
            </Link>
          ))}

          {/* Explore dropdown — visitors only */}
          {isVisitor && (
            <div className="relative">
              <button
                onClick={() => toggle("explore")}
                className={cn(
                  "flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:text-brand-600",
                  isExploreActive || openMenu === "explore" ? "text-brand-600" : "text-stone-600"
                )}
              >
                Explore
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 transition-transform",
                    openMenu === "explore" && "rotate-180"
                  )}
                />
              </button>
              {openMenu === "explore" && (
                <div className="absolute left-0 top-full mt-1 w-48 rounded-xl border border-stone-200 bg-white py-1 shadow-lg">
                  {exploreLinks.map(({ href, label }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setOpenMenu(null)}
                      className={cn(
                        "block px-4 py-2 text-sm transition-colors hover:bg-stone-50 hover:text-brand-600",
                        pathname === href ? "font-medium text-brand-600" : "text-stone-700"
                      )}
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Desktop auth / user menu */}
        <div className="hidden items-center gap-2 md:flex">
          {/* Cart icon */}
          <Link href="/shop/cart" className="relative rounded-lg p-2 text-stone-600 hover:bg-stone-100">
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-600 text-[9px] font-bold text-white">
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            )}
          </Link>
          {user ? (
            <div className="relative">
              <button
                onClick={() => toggle("user")}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-stone-100",
                  openMenu === "user" && "bg-stone-100"
                )}
              >
                <span className="text-stone-700">{user.name}</span>
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 text-stone-400 transition-transform",
                    openMenu === "user" && "rotate-180"
                  )}
                />
              </button>
              {openMenu === "user" && (
                <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border border-stone-200 bg-white py-1 shadow-lg">
                  {isVisitor && (
                    <>
                      {myDigbyLinks.map(({ href, label }) => (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setOpenMenu(null)}
                          className={cn(
                            "block px-4 py-2 text-sm transition-colors hover:bg-stone-50 hover:text-brand-600",
                            pathname === href ? "font-medium text-brand-600" : "text-stone-700"
                          )}
                        >
                          {label}
                        </Link>
                      ))}
                      <div className="my-1 border-t border-stone-100" />
                    </>
                  )}
                  <button
                    onClick={handleLogout}
                    className="block w-full px-4 py-2 text-left text-sm text-stone-700 transition-colors hover:bg-stone-50 hover:text-red-500"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
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
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg p-2 text-stone-600 hover:bg-stone-100 md:hidden"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu — flat list */}
      {mobileOpen && (
        <div className="border-t border-stone-100 bg-white px-4 pb-4 md:hidden">
          <div className="flex flex-col gap-1 pt-3">
            {allMobileLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
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
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="btn-secondary text-sm"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileOpen(false)}
                    className="btn-primary text-sm"
                  >
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
