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
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { ADMIN_EMAIL } from "@/lib/subscription";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/cases", label: "My Cases", icon: FolderOpen },
  { path: "/new-case", label: "New Case", icon: Plus },
  { path: "/escalation", label: "Escalation Command", icon: Scale },
  { path: "/calendar", label: "Calendar", icon: CalendarDays },
  { path: "/deadlines", label: "Deadlines", icon: Siren },
  { path: "/calendar-sync", label: "Calendar Sync", icon: Calendar },
  { path: "/checklist", label: "Checklist", icon: ClipboardList },
  { path: "/directories", label: "Directories", icon: Building2 },
  { path: "/templates", label: "Template Library", icon: FileText },
  { path: "/sample-reports", label: "Sample Reports", icon: Scale },
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
              {/* Dropdown Trigger */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="text-foreground hover:bg-secondary"
                >
                  {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </Button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {menuOpen && (
                    <>
                      {/* Backdrop */}
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setMenuOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 top-12 z-50 w-64 bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
                      >
                        <div className="p-2 max-h-[80vh] overflow-y-auto">
                          {allItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                              <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setMenuOpen(false)}
                                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all mb-0.5 ${
                                  isActive
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <item.icon className="w-4 h-4 shrink-0" />
                                  {item.label}
                                </div>
                                <ChevronRight className="w-3.5 h-3.5 opacity-40" />
                              </Link>
                            );
                          })}

                          {/* Divider + Logout */}
                          <div className="border-t border-border mt-2 pt-2">
                            <button
                              onClick={() => { setMenuOpen(false); base44.auth.logout(); }}
                              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-all"
                            >
                              <LogOut className="w-4 h-4" />
                              Sign Out
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Logo */}
              <Link to="/dashboard" className="flex items-center gap-2">
                <img
                  src="https://media.base44.com/images/public/6a2ac3b012e45642b1f94671/2aa91345d_image.png"
                  alt="Chaos Controller"
                  className="w-9 h-9 object-contain rounded-lg"
                />
                <div className="hidden sm:block">
                  <span className="font-display text-lg font-bold tracking-tight text-foreground">CHAOS</span>
                  <span className="font-display text-lg font-bold tracking-tight text-primary ml-1">CONTROLLER</span>
                  <span className="text-[10px] font-mono text-muted-foreground align-super ml-0.5">™</span>
                </div>
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
                className="text-muted-foreground hover:text-foreground"
                onClick={() => base44.auth.logout()}
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}