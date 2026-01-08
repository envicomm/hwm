import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Package,
  Trash2,
  Users,
  Route,
  Settings,
  Truck,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Package, label: "Collections", href: "/dashboard/collections" },
  { icon: Trash2, label: "Disposals", href: "/dashboard/disposals" },
  { icon: Users, label: "Drivers", href: "/dashboard/drivers" },
  { icon: Route, label: "Routes", href: "/dashboard/routes" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-60 border-r border-border/50 bg-sidebar flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 p-5 border-b border-border/50">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary">
          <Truck className="w-5 h-5 text-primary-foreground" />
        </div>
        <div className="flex flex-col">
          <span className="text-base font-bold tracking-tight">
            HWM<span className="text-primary">Haul</span>
          </span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Fleet Portal
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? location.pathname === "/dashboard"
              : location.pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <item.icon
                className={cn(
                  "w-4 h-4",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              />
              {item.label}
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border/50">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-emerald-500 status-pulse" />
          <span>System Online</span>
        </div>
      </div>
    </aside>
  );
}
