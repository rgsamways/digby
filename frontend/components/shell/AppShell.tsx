"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  MapPin, Map, ShoppingBag, Award, BookOpen, User,
  ShoppingCart, LogOut, Type, LayoutDashboard,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth";
import { useCartStore } from "@/lib/cart";
import { useLargeText } from "@/lib/accessibility";
import { cn } from "@/lib/utils";

type NavLink = { href: string; label: string; exact?: boolean };
type NavSection = { title?: string; links: NavLink[] };
type Activity = {
  id: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  label: string;
  href?: string;
  panel?: NavSection[];
  rootHref?: string;
};

function buildActivities(role: string | undefined, cartCount: number): Activity[] {
  const isAdmin = role === "admin";
  const isOperator = role === "operator";
  const isGuide = role === "guide";

  if (isAdmin) return [
    { id: "admin", icon: LayoutDashboard, label: "Admin", rootHref: "/admin", panel: [
      { links: [{ href: "/admin", label: "Overview", exact: true }, { href: "/admin/users", label: "Users" }, { href: "/admin/sites", label: "Sites" }, { href: "/admin/bookings", label: "Bookings" }, { href: "/admin/revenue", label: "Revenue" }] },
      { title: "Shop", links: [{ href: "/admin/products", label: "Products" }, { href: "/admin/orders", label: "Orders" }] },
      { title: "Content", links: [{ href: "/admin/strata", label: "Strata" }, { href: "/admin/expert", label: "Experts" }] },
    ]},
    { id: "sites", icon: MapPin, label: "Sites", rootHref: "/sites", panel: [{ links: [{ href: "/sites", label: "Browse Sites" }] }] },
    { id: "map", icon: Map, label: "Map", href: "/map", rootHref: "/map" },
  ];

  if (isOperator) return [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard", rootHref: "/dashboard", panel: [
      { title: "My Business", links: [{ href: "/dashboard", label: "Overview", exact: true }, { href: "/dashboard/sites", label: "My Sites" }, { href: "/dashboard/guide", label: "Guide Profile" }] },
      { title: "Manage", links: [{ href: "/bookings", label: "Bookings" }, { href: "/specimens", label: "Marketplace" }] },
    ]},
    { id: "sites", icon: MapPin, label: "Sites", rootHref: "/sites", panel: [{ links: [{ href: "/sites", label: "Browse Sites" }, { href: "/map", label: "Map" }] }] },
    { id: "shop", icon: ShoppingBag, label: "Shop", rootHref: "/shop", panel: [
      { title: "Browse", links: [{ href: "/shop", label: "All Gear", exact: true }, { href: "/shop?category=get-started", label: "Get Started" }, { href: "/shop?category=field-gear", label: "Field Gear" }, { href: "/shop?category=identify-display", label: "Identify & Display" }, { href: "/shop?category=bancroft-collection", label: "Bancroft Collection" }] },
      { links: [{ href: "/shop/cart", label: cartCount > 0 ? `Cart (${cartCount})` : "Cart" }, { href: "/shop/orders", label: "My Orders" }] },
    ]},
  ];

  if (isGuide) return [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard", rootHref: "/dashboard/guide", panel: [{ links: [{ href: "/dashboard/guide", label: "My Dashboard" }, { href: "/guides", label: "Browse Guides" }] }] },
    { id: "sites", icon: MapPin, label: "Sites", rootHref: "/sites", panel: [{ links: [{ href: "/sites", label: "Browse Sites" }, { href: "/map", label: "Map" }] }] },
  ];

  return [
    { id: "sites", icon: MapPin, label: "Sites", rootHref: "/sites", panel: [
      { title: "Discover", links: [{ href: "/sites", label: "Browse Sites" }, { href: "/guides", label: "Find a Guide" }, { href: "/experts", label: "Expert Network" }] },
      { title: "Community", links: [{ href: "/finds", label: "Find Feed" }, { href: "/drops", label: "Specimen Drops" }, { href: "/creators", label: "Creators" }, { href: "/clubs", label: "Clubs" }] },
    ]},
    { id: "map", icon: Map, label: "Map", href: "/map", rootHref: "/map" },
    { id: "shop", icon: ShoppingBag, label: "Shop", rootHref: "/shop", panel: [
      { title: "Browse", links: [{ href: "/shop", label: "All Gear", exact: true }, { href: "/shop?category=get-started", label: "Get Started" }, { href: "/shop?category=field-gear", label: "Field Gear" }, { href: "/shop?category=identify-display", label: "Identify & Display" }, { href: "/shop?category=bancroft-collection", label: "Bancroft Collection" }] },
      { links: [{ href: "/shop/cart", label: cartCount > 0 ? `Cart (${cartCount})` : "Cart" }, { href: "/shop/orders", label: "My Orders" }] },
    ]},
    { id: "passport", icon: Award, label: "Passport", rootHref: "/passport", panel: [
      { title: "My Collection", links: [{ href: "/passport", label: "My Passport" }, { href: "/finds/my", label: "My Finds" }, { href: "/diary", label: "Trip Journal" }, { href: "/bookings", label: "My Bookings" }] },
      { title: "Gallery", links: [{ href: "/gallery/uv", label: "UV Gallery" }, { href: "/community", label: "Community" }] },
    ]},
    { id: "learn", icon: BookOpen, label: "Learn", rootHref: "/learn", panel: [
      { title: "Education", links: [{ href: "/learn", label: "Learn Hub" }, { href: "/mineral-school", label: "Mineral School" }, { href: "/mineral-id", label: "Mineral ID" }, { href: "/quiz", label: "Quiz" }] },
      { title: "Strata", links: [{ href: "/strata", label: "Browse Strata" }, { href: "/strata/my", label: "My Strata" }] },
      { title: "Explore", links: [{ href: "/junior", label: "Junior Explorer" }, { href: "/mystery", label: "Mystery Dig" }, { href: "/alerts", label: "Alerts" }] },
    ]},
  ];
}

function guessActivity(pathname: string, role: string | undefined, activities: Activity[]): string {
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/map")) return "map";
  if (pathname.startsWith("/shop")) return "shop";
  if (pathname.startsWith("/passport") || pathname.startsWith("/finds") || pathname.startsWith("/diary") || pathname.startsWith("/gallery") || pathname.startsWith("/drops") || pathname.startsWith("/community") || pathname.startsWith("/clubs") || pathname.startsWith("/creators")) return "passport";
  if (pathname.startsWith("/learn") || pathname.startsWith("/strata") || pathname.startsWith("/mineral") || pathname.startsWith("/quiz") || pathname.startsWith("/mystery") || pathname.startsWith("/junior") || pathname.startsWith("/alerts")) return "learn";
  if (pathname.startsWith("/dashboard")) return (role === "operator" || role === "admin" || role === "guide") ? "dashboard" : "sites";
  return activities[0]?.id ?? "sites";
}

function isActive(href: string, pathname: string, exact?: boolean): boolean {
  const path = href.split("?")[0];
  if (exact) return pathname === path;
  if (path === "/") return pathname === "/";
  return pathname === path || pathname.startsWith(path + "/");
}

const STONE = "#3D4F5C";
const COPPER = "#C97B3A";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const cartCount = useCartStore((s) => s.items.reduce((n, i) => n + i.qty, 0));
  const { enabled: largeText, toggle: toggleLargeText } = useLargeText();
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const activities = buildActivities(user?.role, cartCount);
  const [activeId, setActiveId] = useState(() => guessActivity(pathname, user?.role, activities));
  const [panelOpen, setPanelOpen] = useState(true);
  const [showAccount, setShowAccount] = useState(false);

  useEffect(() => {
    setMounted(true);
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  useEffect(() => {
    setActiveId(guessActivity(pathname, user?.role, activities));
  }, [pathname, user?.role]); // eslint-disable-line react-hooks/exhaustive-deps

  const ready = mounted && !!user;

  function handleLogout() {
    clearAuth();
    router.push("/");
    setShowAccount(false);
  }

  function handleActivity(a: Activity) {
    if (a.href) { router.push(a.href); setShowAccount(false); return; }
    if (showAccount) { setShowAccount(false); setActiveId(a.id); setPanelOpen(true); return; }
    if (activeId === a.id) { setPanelOpen(p => !p); } else { setActiveId(a.id); setPanelOpen(true); }
  }

  const currentActivity = activities.find(a => a.id === activeId);
  const panelSections: NavSection[] = showAccount
    ? [{ title: "My Account", links: user?.role === "operator" ? [{ href: "/dashboard", label: "Dashboard" }, { href: "/bookings", label: "Bookings" }] : user?.role === "guide" ? [{ href: "/dashboard/guide", label: "My Dashboard" }] : [{ href: "/bookings", label: "My Bookings" }, { href: "/passport", label: "My Passport" }, { href: "/finds/my", label: "My Finds" }, { href: "/diary", label: "Trip Journal" }] }]
    : (currentActivity?.panel ?? []);
  const panelLabel = showAccount ? "Account" : currentActivity?.label ?? "";
  const showPanel = ready && panelOpen && panelSections.length > 0;

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", backgroundColor: "#F5F0E8" }}>

      {/* Activity bar */}
      <div style={{ display: "flex", flexDirection: "column", width: ready ? 56 : 8, flexShrink: 0, backgroundColor: COPPER, zIndex: 40 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, padding: ready ? "4px 6px" : 0 }}>
          {ready && activities.map(a => {
            const Icon = a.icon;
            const active = !showAccount && activeId === a.id;
            return (
              <button key={a.id} onClick={() => handleActivity(a)} title={a.label}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, padding: "10px 0", width: "100%", color: "white", background: active ? "rgba(255,255,255,0.2)" : "transparent", border: "none", cursor: "pointer" }}>
                <Icon size={20} />
                <span style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", lineHeight: 1 }}>{a.label}</span>
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, padding: "0 6px 8px" }}>
          {ready && cartCount > 0 && (
            <Link href="/shop/cart" style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, padding: "10px 0", color: "white" }}>
              <ShoppingCart size={20} />
              <span style={{ position: "absolute", top: 6, right: 4, background: "white", color: COPPER, borderRadius: "50%", width: 16, height: 16, fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{cartCount > 9 ? "9+" : cartCount}</span>
            </Link>
          )}
          {ready && user && (
            <button onClick={() => { setShowAccount(s => !s); setPanelOpen(true); }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, padding: "10px 0", color: "white", background: showAccount ? "rgba(255,255,255,0.2)" : "transparent", border: "none", cursor: "pointer", width: "100%" }}>
              <User size={20} />
              <span style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", lineHeight: 1 }}>Account</span>
            </button>
          )}
        </div>
      </div>

      {/* Left panel */}
      {showPanel && (
        <div style={{ display: "flex", flexDirection: "column", width: 240, flexShrink: 0, backgroundColor: STONE, overflowY: "auto", zIndex: 30 }}>
          <div style={{ padding: "16px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
            <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.18em", color: "rgba(255,255,255,0.5)" }}>{panelLabel}</span>
          </div>
          <nav style={{ flex: 1, padding: "12px 8px" }}>
            {panelSections.map((section, i) => (
              <div key={i} style={{ marginTop: i > 0 ? 24 : 0 }}>
                {section.title && (
                  <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.18em", color: "rgba(255,255,255,0.35)", padding: "0 8px", marginBottom: 4 }}>{section.title}</p>
                )}
                {section.links.map(({ href, label, exact }) => (
                  <Link key={href} href={href}
                    style={{ display: "block", padding: "6px 8px", fontSize: 14, color: isActive(href, pathname, exact) ? "white" : "rgba(255,255,255,0.55)", background: isActive(href, pathname, exact) ? "rgba(255,255,255,0.1)" : "transparent", fontWeight: isActive(href, pathname, exact) ? 600 : 400, textDecoration: "none" }}>
                    {label}
                  </Link>
                ))}
              </div>
            ))}
          </nav>
          {showAccount && user && (
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", padding: "12px 8px" }}>
              <button onClick={toggleLargeText}
                style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "6px 8px", fontSize: 14, color: "rgba(255,255,255,0.55)", background: "transparent", border: "none", cursor: "pointer" }}>
                <Type size={16} />{largeText ? "Normal text" : "Large text"}
              </button>
              <button onClick={handleLogout}
                style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "6px 8px", fontSize: 14, color: "rgba(255,255,255,0.55)", background: "transparent", border: "none", cursor: "pointer" }}>
                <LogOut size={16} />Log out
              </button>
            </div>
          )}
        </div>
      )}

      {/* Content pane */}
      <main style={{ flex: 1, overflowY: "auto", paddingBottom: ready && isMobile ? 64 : 0 }}>
        {children}
      </main>

      {/* Mobile tab bar */}
      {ready && isMobile && (
        <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, backgroundColor: COPPER, display: "flex", zIndex: 40, borderTop: "1px solid rgba(0,0,0,0.1)" }}>
          {activities.slice(0, 5).map(a => {
            const Icon = a.icon;
            const active = !showAccount && activeId === a.id;
            return (
              <button key={a.id} onClick={() => { setShowAccount(false); router.push(a.href ?? a.rootHref ?? "/"); setActiveId(a.id); }}
                style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, padding: "8px 0", color: "white", background: active ? "rgba(255,255,255,0.2)" : "transparent", border: "none", cursor: "pointer" }}>
                <Icon size={20} />
                <span style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>{a.label}</span>
              </button>
            );
          })}
          <button onClick={() => setShowAccount(s => !s)}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, padding: "8px 0", color: "white", background: showAccount ? "rgba(255,255,255,0.2)" : "transparent", border: "none", cursor: "pointer", position: "relative" }}>
            <User size={20} />
            <span style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>Account</span>
            {cartCount > 0 && <span style={{ position: "absolute", top: 4, right: 8, background: "white", color: COPPER, borderRadius: "50%", width: 16, height: 16, fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{cartCount > 9 ? "9+" : cartCount}</span>}
          </button>
        </nav>
      )}
    </div>
  );
}
