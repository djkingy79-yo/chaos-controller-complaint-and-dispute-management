import React, { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import {
  LayoutDashboard,
  FolderOpen,
  Plus,
  Menu,
  X,
  LogOut,
  ChevronRight,
  Siren,
  ClipboardList,
  Building2,
  CreditCard,
  Activity,
  CalendarDays,
  BookOpen,
  Scale,
  Lock,
  Calendar,
  FileText,
  HelpCircle,
  MessageSquare,
  Bell,
  BarChart3,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { ADMIN_EMAIL } from "@/lib/subscription";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/cases", label: "My Cases", icon: FolderOpen },
  { path: "/new-case", label: "New Case", icon: Plus },
  { path: "/notifications", label: "Notifications", icon: Bell },
  { path: "/analytics", label: "Analytics", icon: BarChart3 },
  { path: "/escalation", label: "Escalation Command", icon: Scale },
  { path: "/calendar", label: "Calendar", icon: CalendarDays },
  { path: "/deadlines", label: "Deadlines", icon: Siren },
  { path: "/calendar-sync", label: "Calendar Sync", icon: Calendar },
  { path: "/checklist", label: "Checklist", icon: ClipboardList },
  { path: "/directories", label: "Directories", icon: Building2 },
  { path: "/templates", label: "Template Library", icon: FileText },
  { path: "/merchant-responses", label: "Merchant Responses", icon: MessageSquare },
  { path: "/sample-reports", label: "Sample Reports", icon: Scale },
  { path: "/settings", label: "Settings", icon: Settings },
  { path: "/help", label: "Help & Guide", icon: BookOpen },
  { path: "/qna", label: "Q&A", icon: HelpCircle },
  { path: "/payments", label: "Plans & Pricing", icon: CreditCard },
  { path: "/terms", label: "Terms & Conditions", icon: Scale },
  { path: "/privacy", label: "Privacy Policy", icon: Lock },
];

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  const allItems = [
    ...navItems,
    ...(user?.role === "admin" || user?.email === ADMIN_EMAIL ? [{ path: "/admin", label: "Admin", icon: Activity }] : [])
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Hamburger + Logo */}
            <div className="flex items-center gap-3">
              {/* Hamburger Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMenuOpen(!menuOpen)}
                className="text-foreground hover:bg-secondary h-10 w-10"
                aria-label="Toggle menu"
              >
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>

              {/* Logo */}
              <Link to="/dashboard" className="flex items-center gap-2">
                <img
                  src="https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/46dd15b0d_3479CB3F-54C5-465C-A6B0-FE8A5B9E8172.png"
                  alt="Chaos Controller"
                  className="h-8 object-contain rounded-lg"
                />
              </Link>
            </div>

            {/* Right: User + Logout */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-sm">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-semibold text-primary">
                    {user?.full_name?.[0]?.toUpperCase() || "U"}
                  </span>
                </div>
                <span className="text-muted-foreground font-medium">{user?.full_name || "User"}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground h-10 w-10"
                onClick={() => base44.auth.logout()}
                title="Sign Out"
                aria-label="Sign out"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop with fade */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => setMenuOpen(false)}
            />
            {/* Slide-in menu from left */}
            <motion.div
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 z-50 h-full w-80 bg-card border-r border-border shadow-2xl overflow-hidden"
            >
              {/* Menu Header */}
              <div className="flex items-center justify-between p-4 border-b border-border bg-secondary/50">
                <div className="flex items-center gap-3">
                  <img
                    src="https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/46dd15b0d_3479CB3F-54C5-465C-A6B0-FE8A5B9E8172.png"
                    alt="Chaos Controller"
                    className="h-10 object-contain rounded-lg"
                  />
                  <div>
                    <h2 className="font-display font-black text-foreground">Menu</h2>
                    <p className="text-xs text-muted-foreground font-bold">Navigate your cases</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMenuOpen(false)}
                  className="h-10 w-10"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Menu Items - Scrollable */}
              <div className="p-3 h-[calc(100%-140px)] overflow-y-auto">
                {allItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMenuOpen(false)}
                      className={`flex items-center gap-4 px-4 py-4 sm:py-3.5 rounded-xl text-base font-bold transition-all mb-1 touch-manipulation ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "text-foreground hover:bg-secondary/70"
                      }`}
                    >
                      <item.icon className={`w-5 h-5 shrink-0 ${isActive ? "opacity-100" : "opacity-70"}`} />
                      <span className="flex-1">{item.label}</span>
                      {isActive && <ChevronRight className="w-4 h-4 opacity-50" />}
                    </Link>
                  );
                })}

                {/* Divider + Logout */}
                <div className="border-t border-border mt-3 pt-3">
                  <button
                    onClick={() => { setMenuOpen(false); base44.auth.logout(); }}
                    className="flex items-center gap-4 w-full px-4 py-3.5 rounded-xl text-base font-bold text-destructive hover:bg-destructive/10 transition-all"
                  >
                    <LogOut className="w-5 h-5 shrink-0" />
                    <span className="flex-1 text-left">Sign Out</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}