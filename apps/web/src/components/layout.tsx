import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  HeartPulse, MessageSquare, ShieldCheck, Users,
  ChevronDown, MapPinned, CalendarDays, LogOut, User, Menu, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/contexts/auth-context";
import logoImg from "@assets/healix-logo.png";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: HeartPulse },
  { href: "/chatbot", label: "Healix AI", icon: MessageSquare },
  { href: "/insurance", label: "NHIS Guide", icon: ShieldCheck },
  { href: "/community", label: "Community", icon: Users },
];

const CLINICS_ITEMS = [
  { href: "/clinics", label: "Clinic Finder", icon: MapPinned, desc: "Find English-speaking clinics near you" },
  { href: "/appointments", label: "Appointments", icon: CalendarDays, desc: "View your interpreter bookings" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [clinicsOpen, setClinicsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated, isLoading, login, logout } = useAuthContext();

  const isClinicsActive = location.startsWith("/clinics") || location.startsWith("/appointments");

  /* Close desktop dropdowns on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setClinicsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* Close mobile menu on route change */
  useEffect(() => {
    setMobileOpen(false);
    setClinicsOpen(false);
  }, [location]);

  const displayName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "My Account"
    : null;

  const initials = displayName
    ? displayName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : null;

  return (
    <div className="min-h-screen bg-background flex flex-col w-full">

      {/* ─── Top Navbar ─── */}
      <header className="fixed top-0 inset-x-0 z-50 bg-card/90 backdrop-blur-lg border-b border-border">
        <div className="flex items-center h-16 px-4 md:px-10 gap-4">

          {/* Logo */}
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer group shrink-0">
              <img src={logoImg} alt="Healix Logo" className="w-8 h-8 object-contain rounded-md group-hover:scale-105 transition-transform" />
              <span className="text-xl font-display font-bold text-foreground tracking-tight">Healix</span>
            </div>
          </Link>

          {/* ── Desktop Nav Links (hidden on mobile) ── */}
          <nav className="hidden md:flex items-center gap-1 mx-auto">
            {NAV_ITEMS.map((item) => {
              const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href}>
                  <div className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer whitespace-nowrap",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                      : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
                  )}>
                    {item.label}
                  </div>
                </Link>
              );
            })}

            {/* Clinics Dropdown */}
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setClinicsOpen(o => !o)}
                className={cn(
                  "flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer whitespace-nowrap",
                  isClinicsActive
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                    : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
                )}
              >
                Clinics
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", clinicsOpen && "rotate-180")} />
              </button>

              {clinicsOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 bg-card rounded-xl border border-border shadow-xl shadow-black/10 overflow-hidden z-50">
                  {CLINICS_ITEMS.map((item) => (
                    <Link key={item.href} href={item.href}>
                      <div
                        onClick={() => setClinicsOpen(false)}
                        className={cn(
                          "flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-primary/5 group",
                          location.startsWith(item.href) && "bg-primary/5"
                        )}
                      >
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-primary/20 transition-colors">
                          <item.icon className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{item.label}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{item.desc}</div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* ── Desktop Auth area (hidden on mobile) ── */}
          <div className="hidden md:flex items-center shrink-0">
            {isLoading ? (
              <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
            ) : isAuthenticated && user ? (
              <div ref={userMenuRef} className="relative">
                <button
                  onClick={() => setUserMenuOpen(o => !o)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:bg-primary/5 hover:border-primary/30 transition-all cursor-pointer"
                >
                  {user.profileImageUrl ? (
                    <img src={user.profileImageUrl} alt="" className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                      {initials}
                    </div>
                  )}
                  <span className="text-sm font-medium text-foreground max-w-[120px] truncate">{displayName}</span>
                  <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform duration-200", userMenuOpen && "rotate-180")} />
                </button>

                {userMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-card rounded-xl border border-border shadow-xl shadow-black/10 overflow-hidden z-50">
                    <Link href="/health-record">
                      <div
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-primary/5 transition-colors group"
                      >
                        <User className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">Health Record</span>
                      </div>
                    </Link>
                    <div className="border-t border-border" />
                    <button
                      onClick={() => { setUserMenuOpen(false); logout(); }}
                      className="w-full flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-destructive/5 transition-colors group text-left"
                    >
                      <LogOut className="w-4 h-4 text-muted-foreground group-hover:text-destructive transition-colors" />
                      <span className="text-sm font-medium text-foreground group-hover:text-destructive transition-colors">Log out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={login}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
              >
                Log in
              </button>
            )}
          </div>

          {/* ── Mobile right side: avatar/login + hamburger ── */}
          <div className="flex items-center gap-2 ml-auto md:hidden">
            {/* Compact auth indicator on mobile */}
            {!isLoading && isAuthenticated && user && (
              user.profileImageUrl ? (
                <img src={user.profileImageUrl} alt="" className="w-7 h-7 rounded-full object-cover border border-border" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary border border-border">
                  {initials}
                </div>
              )
            )}
            {!isLoading && !isAuthenticated && (
              <button
                onClick={login}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
              >
                Log in
              </button>
            )}

            {/* Hamburger toggle */}
            <button
              onClick={() => setMobileOpen(o => !o)}
              aria-label="Toggle menu"
              className="w-9 h-9 flex items-center justify-center rounded-lg text-foreground hover:bg-primary/10 transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* ── Mobile Slide-down Menu ── */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border bg-card/95 backdrop-blur-lg px-4 py-3 space-y-1 shadow-lg">
            {NAV_ITEMS.map((item) => {
              const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href}>
                  <div className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors cursor-pointer",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-primary/5 hover:text-primary"
                  )}>
                    <item.icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground")} />
                    {item.label}
                  </div>
                </Link>
              );
            })}

            {/* Clinics section */}
            <div className="pt-1 pb-1">
              <p className="px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Clinics</p>
              {CLINICS_ITEMS.map((item) => {
                const isActive = location.startsWith(item.href);
                return (
                  <Link key={item.href} href={item.href}>
                    <div className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors cursor-pointer",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-primary/5 hover:text-primary"
                    )}>
                      <item.icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground")} />
                      {item.label}
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Mobile auth section */}
            <div className="border-t border-border pt-2 mt-1">
              {isAuthenticated && user ? (
                <>
                  <div className="flex items-center gap-3 px-4 py-2 mb-1">
                    {user.profileImageUrl ? (
                      <img src={user.profileImageUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                        {initials}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-foreground leading-none">{displayName}</p>
                      {user.email && <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>}
                    </div>
                  </div>
                  <Link href="/health-record">
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-foreground hover:bg-primary/5 hover:text-primary transition-colors cursor-pointer">
                      <User className="w-4 h-4 text-muted-foreground" />
                      Health Record
                    </div>
                  </Link>
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-foreground hover:bg-destructive/5 hover:text-destructive transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4 text-muted-foreground" />
                    Log out
                  </button>
                </>
              ) : (
                <button
                  onClick={login}
                  className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
                >
                  Log in
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full pt-16">
        <div className="max-w-7xl mx-auto p-4 md:p-8 lg:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}
