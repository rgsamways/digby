"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  MapPin, Map, ShoppingBag, Award, BookOpen, User, Gem,
  ShoppingCart, LogOut, Type, LayoutDashboard,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth";
import { useCartStore } from "@/lib/cart";
import { useLargeText } from "@/lib/accessibility";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────

type NavLink = { href: string; label: string; exact?: boolean };
type NavSection = { title?: string; links: NavLink[] };
type Activity = {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href?: string; // direct navigation, no panel
  panel?: NavSection[];
  rootHref?: string; // mobile tab destination
};

// ── Nav config ────────────────────────────────────────────────────────────

function buildActivities(role: string | undefined, cartCount: number): Activity[] {
  const isOperator = role === "operator";
  const isAdmin = role === "admin";
  const isGuide = role === "guide";

  if (isAdmin) {
    return [
      {
        id: "admin",
        icon: LayoutDashboard,
        label: "Admin",
        rootHref: "/admin",
        panel: [
          {
            links: [
              { href: "/admin", label: "Overview", exact: true },
              { href: "/admin/users", label: "Users" },
              { href: "/admin/sites", label: "Sites" },
              { href: "/admin/bookings", label: "Bookings" },
              { href: "/admin/revenue", label: "Revenue" },
            ],
          },
          {
            title: "Shop",
            links: [
              { href: "/admin/products", label: "Products" },
              { href: "/admin/orders", label: "Orders" },
            ],
          },
          {
            title: "Content",
            links: [
              { href: "/admin/strata", label: "Strata" },
              { href: "/admin/expert", label: "Experts" },
            ],
          },
        ],
      },
      { id: "map", icon: Map, label: "Map", href: "/map", rootHref: "/map" },
      { id: "sites", icon: MapPin, label: "Sites", rootHref: "/sites", panel: [{ links: [{ href: "/sites", label: "Browse Sites" }] }] },
    ];
  }

  if (isOperator) {
    return [
      {
        id: "dashboard",
        icon: LayoutDashboard,
        label: "Dashboard",
        rootHref: "/dashboard",
        panel: [
          {
            title: "My Business",
            links: [
              { href: "/dashboard", label: "Overview", exact: true },
              { href: "/dashboard/sites", label: "My Sites" },
              { href: "/dashboard/guide", label: "Guide Profile" },
            ],
          },
          {
            title: "Manage",
            links: [
              { href: "/bookings", label: "Bookings" },
              { href: "/specimens", label: "Marketplace" },
            ],
          },
        ],
      },
      { id: "sites", icon: MapPin, label: "Sites", rootHref: "/sites", panel: [{ links: [{ href: "/sites", label: "Browse Sites" }, { href: "/map", label: "Map" }] }] },
      {
        id: "shop",
        icon: ShoppingBag,
        label: "Shop",
        rootHref: "/shop",
        panel: [
          {
            title: "Browse",
            links: [
              { href: "/shop", label: "All Gear", exact: true },
              { href: "/shop?category=get-started", label: "Get Started" },
              { href: "/shop?category=field-gear", label: "Field Gear" },
              { href: "/shop?category=identify-display", label: "Identify & Display" },
              { href: "/shop?category=bancroft-collection", label: "Bancroft Collection" },
            ],
          },
          {
            links: [
              { href: "/shop/cart", label: cartCount > 0 ? `Cart (${cartCount})` : "Cart" },
              { href: "/shop/orders", label: "My Orders" },
            ],
          },
        ],
      },
    ];
  }

  if (isGuide) {
    return [
      {
        id: "dashboard",
        icon: LayoutDashboard,
        label: "Dashboard",
        rootHref: "/dashboard/guide",
        panel: [{ links: [{ href: "/dashboard/guide", label: "My Dashboard" }, { href: "/guides", label: "Browse Guides" }] }],
      },
      { id: "sites", icon: MapPin, label: "Sites", rootHref: "/sites", panel: [{ links: [{ href: "/sites", label: "Browse Sites" }, { href: "/map", label: "Map" }] }] },
    ];
  }

  // Visitor / guest
  return [
    {
      id: "sites",
      icon: MapPin,
      label: "Sites",
      rootHref: "/sites",
      panel: [
        {
          title: "Discover",
          links: [
            { href: "/sites", label: "Browse Sites" },
            { href: "/guides", label: "Find a Guide" },
            { href: "/experts", label: "Expert Network" },
          ],
        },
        {
          title: "Community",
          links: [
            { href: "/finds", label: "Find Feed" },
            { href: "/drops", label: "Specimen Drops" },
            { href: "/creators", label: "Creators" },
            { href: "/clubs", label: "Clubs" },
          ],
        },
      ],
    },
    { id: "map", icon: Map, label: "Map", href: "/map", rootHref: "/map" },
    {
      id: "shop",
      icon: ShoppingBag,
      label: "Shop",
      rootHref: "/shop",
      panel: [
        {
          title: "Browse",
          links: [
            { href: "/shop", label: "All Gear", exact: true },
            { href: "/shop?category=get-started", label: "Get Started" },
            { href: "/shop?category=field-gear", label: "Field Gear" },
            { href: "/shop?category=identify-display", label: "Identify & Display" },
            { href: "/shop?category=bancroft-collection", label: "Bancroft Collection" },
          ],
        },
        {
          links: [
            { href: "/shop/cart", label: cartCount > 0 ? `Cart (${cartCount})` : "Cart" },
            { href: "/shop/orders", label: "My Orders" },
          ],
        },
      ],
    },
    {
      id: "passport",
      icon: Award,
      label: "Passport",
      rootHref: "/passport",
      panel: [
        {
          title: "My Collection",
          links: [
            { href: "/passport", label: "My Passport" },
            { href: "/finds/my", label: "My Finds" },
            { href: "/diary", label: "Trip Journal" },
            { href: "/bookings", label: "My Bookings" },
          ],
        },
        {
          title: "Gallery",
          links: [
            { href: "/gallery/uv", label: "UV Gallery" },
            { href: "/community", label: "Community" },
          ],
        },
      ],
    },
    {
      id: "learn",
      icon: BookOpen,
      label: "Learn",
      rootHref: "/learn",
      panel: [
        {
          title: "Education",
          links: [
            { href: "/learn", label: "Learn Hub" },
            { href: "/mineral-school", label: "Mineral School" },
            { href: "/mineral-id", label: "Mineral ID" },
            { href: "/quiz", label: "Quiz" },
          ],
        },
        {
          title: "Strata",
          links: [
            { href: "/strata", label: "Browse Strata" },
            { href: "/strata/my", label: "My Strata" },
          ],
        },
        {
          title: "Explore",
          links: [
            { href: "/junior", label: "Junior Explorer" },
            { href: "/mystery", label: "Mystery Dig" },
            { href: "/alerts", label: "Alerts" },
          ],
        },
      ],
    },
  ];
}

// ── Helpers ────────────────────────────────────────────────────────────────

function guessActivity(pathname: string, role: string | undefined, activities: Activity[]): string {
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/map")) return "map";
  if (pathname.startsWith("/shop")) return "shop";
  if (
    pathname.startsWith("/passport") ||
    pathname.startsWith("/finds") ||
    pathname.startsWith("/diary") ||
    pathname.startsWith("/gallery") ||
    pathname.startsWith("/drops") ||
    pathname.startsWith("/community") ||
    pathname.startsWith("/clubs") ||
    pathname.startsWith("/creators")
  ) return "passport";
  if (
    pathname.startsWith("/learn") ||
    pathname.startsWith("/strata") ||
    pathname.startsWith("/mineral") ||
    pathname.startsWith("/quiz") ||
    pathname.startsWith("/mystery") ||
    pathname.startsWith("/junior") ||
    pathname.startsWith("/alerts")
  ) return "learn";
  if (pathname.startsWith("/dashboard")) return (role === "operator" || role === "admin" || role === "guide") ? "dashboard" : "sites";
  return activities[0]?.id ?? "sites";
}

function isLinkActive(href: string, pathname: string, exact?: boolean): boolean {
  const hrefPath = href.split("?")[0];
  if (exact) return pathname === hrefPath;
  if (hrefPath === "/") return pathname === "/";
  return pathname === hrefPath || pathname.startsWith(hrefPath + "/");
}

// ── Shell ─────────────────────────────────────────────────────────────────

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const cartCount = useCartStore((s) => s.items.reduce((n, i) => n + i.qty, 0));
  const { enabled: largeText, toggle: toggleLargeText } = useLargeText();
  const [mounted, setMounted] = useState(false);
  const activities = buildActivities(user?.role, cartCount);
  const [activeId, setActiveId] = useState(() => guessActivity(pathname, user?.role, activities));
  const [panelOpen, setPanelOpen] = useState(true);
  const [showAccount, setShowAccount] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    setActiveId(guessActivity(pathname, user?.role, activities));
  }, [pathname, user?.role]); // eslint-disable-line react-hooks/exhaustive-deps

  // Only show activities/panel/tabs once Zustand has rehydrated and we know who the user is
  const knownUser = mounted && !!user;

  function handleLogout() {
    clearAuth();
    router.push("/");
    setShowAccount(false);
  }

  function handleActivityClick(activity: Activity) {
    if (activity.href) {
      router.push(activity.href);
      setShowAccount(false);
      return;
    }
    if (showAccount) {
      setShowAccount(false);
      setActiveId(activity.id);
      setPanelOpen(true);
      return;
    }
    if (activeId === activity.id) {
      setPanelOpen((p) => !p);
    } else {
      setActiveId(activity.id);
      setPanelOpen(true);
    }
  }

  function handleAccountClick() {
    setShowAccount((s) => !s);
    setPanelOpen(true);
  }

  const currentActivity = activities.find((a) => a.id === activeId);
  const panelSections: NavSection[] = showAccount
    ? [
        {
          title: "My Digby",
          links: [
            ...(user?.role === "operator"
              ? [{ href: "/dashboard", label: "Dashboard" }]
              : user?.role === "guide"
              ? [{ href: "/dashboard/guide", label: "My Dashboard" }]
              : [
                  { href: "/bookings", label: "My Bookings" },
                  { href: "/passport", label: "My Passport" },
                  { href: "/finds/my", label: "My Finds" },
                  { href: "/diary", label: "Trip Journal" },
                ]),
          ],
        },
      ]
    : (currentActivity?.panel ?? []);

  const panelLabel = showAccount ? "Account" : currentActivity?.label ?? "";
  const showPanel = panelOpen && panelSections.length > 0;

  // Mobile: pick up to 5 tabs from activities, account always appended
  const mobileTabs = activities.slice(0, 5);

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F0E8]">

      {/* ── Activity Bar — desktop ─────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-14 shrink-0 bg-[#C97B3A] z-40">
        {/* Logo */}
        <Link
          href="/"
          className="flex h-14 items-center justify-center text-white hover:bg-white/15 transition-colors"
          title="Digby"
        >
          <Gem className="h-6 w-6" />
        </Link>

        {/* Activities — hidden until user identity is confirmed */}
        <div className="flex flex-1 flex-col gap-0.5 pt-1 px-1">
          {knownUser && activities.map((activity) => {
            const Icon = activity.icon;
            const isActive = !showAccount && activeId === activity.id;
            return (
              <button
                key={activity.id}
                onClick={() => handleActivityClick(activity)}
                title={activity.label}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-3 w-full text-white transition-colors",
                  isActive ? "bg-white/20" : "hover:bg-white/10"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[9px] font-semibold uppercase tracking-wider leading-none">
                  {activity.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Bottom: cart + account — hidden until user identity is confirmed */}
        <div className="flex flex-col gap-0.5 px-1 pb-2">
          {knownUser && cartCount > 0 && (
            <Link
              href="/shop/cart"
              title={`Cart (${cartCount})`}
              className="relative flex flex-col items-center justify-center gap-1 py-3 w-full text-white hover:bg-white/10 transition-colors"
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[9px] font-bold text-[#C97B3A]">
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            </Link>
          )}
          {knownUser && user ? (
            <button
              onClick={handleAccountClick}
              title={user.name}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-3 w-full text-white transition-colors",
                showAccount ? "bg-white/20" : "hover:bg-white/10"
              )}
            >
              <User className="h-5 w-5" />
              <span className="text-[9px] font-semibold uppercase tracking-wider leading-none">
                Account
              </span>
            </button>
          ) : (
            <Link
              href="/login"
              title="Log in"
              className="flex flex-col items-center justify-center gap-1 py-3 w-full text-white hover:bg-white/10 transition-colors"
            >
              <User className="h-5 w-5" />
              <span className="text-[9px] font-semibold uppercase tracking-wider leading-none">
                Log in
              </span>
            </Link>
          )}
        </div>
      </aside>

      {/* ── Left Panel — desktop ───────────────────────────────────────── */}
      {knownUser && showPanel && (
        <aside className="hidden md:flex flex-col w-60 shrink-0 bg-digby-stone overflow-y-auto z-30">
          <div className="px-4 py-4 border-b border-white/10">
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50">
              {panelLabel}
            </span>
          </div>

          <nav className="flex-1 px-2 py-3 space-y-6">
            {panelSections.map((section, i) => (
              <div key={i}>
                {section.title && (
                  <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
                    {section.title}
                  </p>
                )}
                <div className="space-y-0.5">
                  {section.links.map(({ href, label, exact }) => (
                    <Link
                      key={href}
                      href={href}
                      className={cn(
                        "block px-2 py-1.5 text-sm transition-colors",
                        isLinkActive(href, pathname, exact)
                          ? "bg-white/10 text-white font-medium"
                          : "text-white/55 hover:text-white hover:bg-white/5"
                      )}
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {showAccount && user && (
            <div className="border-t border-white/10 px-2 py-3 space-y-0.5">
              <button
                onClick={toggleLargeText}
                className="flex w-full items-center gap-2 px-2 py-1.5 text-sm text-white/55 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Type className="h-4 w-4" />
                {largeText ? "Normal text" : "Large text"}
              </button>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-2 py-1.5 text-sm text-white/55 hover:text-red-400 hover:bg-white/5 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          )}
        </aside>
      )}

      {/* ── Content Pane ──────────────────────────────────────────────── */}
      <main className={cn("flex-1 overflow-auto", knownUser && "pb-16 md:pb-0")}>
        {children}
      </main>

      {/* ── Mobile Bottom Tab Bar ─────────────────────────────────────── */}
      {knownUser && <nav className="fixed bottom-0 inset-x-0 bg-[#C97B3A] md:hidden z-40 flex border-t border-black/10">
        {mobileTabs.map((activity) => {
          const Icon = activity.icon;
          const isActive = !showAccount && activeId === activity.id;
          return (
            <button
              key={activity.id}
              onClick={() => {
                setShowAccount(false);
                if (activity.href || !activity.panel) {
                  router.push(activity.href ?? activity.rootHref ?? "/");
                } else {
                  setActiveId(activity.id);
                  router.push(activity.rootHref ?? "/");
                }
              }}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-white transition-colors",
                isActive ? "bg-white/20" : "hover:bg-white/10"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[9px] font-semibold uppercase tracking-wider">
                {activity.label}
              </span>
            </button>
          );
        })}

        {/* Account tab */}
        <button
          onClick={() => {
            if (!user) { router.push("/login"); return; }
            setShowAccount((s) => !s);
          }}
          className={cn(
            "relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-white transition-colors",
            showAccount ? "bg-white/20" : "hover:bg-white/10"
          )}
        >
          <User className="h-5 w-5" />
          <span className="text-[9px] font-semibold uppercase tracking-wider">
            {user ? "Account" : "Log in"}
          </span>
          {cartCount > 0 && (
            <span className="absolute top-1 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[9px] font-bold text-[#C97B3A]">
              {cartCount > 9 ? "9+" : cartCount}
            </span>
          )}
        </button>
      </nav>}

      {/* Mobile account sheet */}
      {knownUser && showAccount && user && (
        <div className="fixed inset-x-0 bottom-16 bg-digby-stone border-t border-white/10 md:hidden z-30 px-4 py-4 space-y-1">
          {(user.role === "operator"
            ? [{ href: "/dashboard", label: "Dashboard" }]
            : user.role === "guide"
            ? [{ href: "/dashboard/guide", label: "My Dashboard" }]
            : [
                { href: "/bookings", label: "My Bookings" },
                { href: "/passport", label: "My Passport" },
                { href: "/finds/my", label: "My Finds" },
                { href: "/diary", label: "Trip Journal" },
              ]
          ).map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setShowAccount(false)}
              className="block px-2 py-2 text-sm text-white/70 hover:text-white"
            >
              {label}
            </Link>
          ))}
          <div className="border-t border-white/10 pt-2 mt-2 space-y-1">
            <button
              onClick={toggleLargeText}
              className="flex w-full items-center gap-2 px-2 py-2 text-sm text-white/55 hover:text-white"
            >
              <Type className="h-4 w-4" />
              {largeText ? "Normal text" : "Large text"}
            </button>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 px-2 py-2 text-sm text-white/55 hover:text-red-400"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
