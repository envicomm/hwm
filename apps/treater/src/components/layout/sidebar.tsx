import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Building2,
  FlaskConical,
  FileText,
  Truck,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Building2, label: "Generators", href: "/dashboard/generators" },
  { icon: FlaskConical, label: "Treatments", href: "/dashboard/treatments" },
  { icon: Truck, label: "Collections", href: "/dashboard/collections" },
  { icon: FileText, label: "Certificates", href: "/dashboard/certificates" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-60 border-r bg-card">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center border-b px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <FlaskConical className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold leading-none">
                HWM<span className="text-primary">Treater</span>
              </span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Treatment Portal
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.href ||
              (item.href !== "/dashboard" &&
                location.pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t p-4">
          <p className="text-xs text-muted-foreground">
            Hospital Waste Management
          </p>
          <p className="text-[10px] text-muted-foreground/70">
            Treatment Division
          </p>
        </div>
      </div>
    </aside>
  );
}
