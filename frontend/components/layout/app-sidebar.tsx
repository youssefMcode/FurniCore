"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BrainCircuit,
  ChartNoAxesCombined,
  CircleDollarSign,
  ClipboardList,
  LayoutDashboard,
  Package,
  PackageOpen,
  ReceiptText,
  Settings,
  ShoppingCart,
  Sparkles,
  Truck,
  Users,
  UsersRound,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/auth";

interface AppSidebarProps {
  role: UserRole;
  onNavigate?: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

interface NavSection {
  label?: string;
  items: NavItem[];
}

const navigation: NavSection[] = [
  {
    items: [
      {
        label: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
      },
      {
        label: "New Sale",
        href: "/pos",
        icon: ShoppingCart,
      },
    ],
  },
  {
    label: "Management",
    items: [
      {
        label: "Products",
        href: "/products",
        icon: Package,
      },
      {
        label: "Inventory",
        href: "/inventory",
        icon: PackageOpen,
      },
      {
        label: "Customers",
        href: "/customers",
        icon: Users,
      },
      {
        label: "Sales",
        href: "/sales",
        icon: ReceiptText,
      },
      {
        label: "Suppliers",
        href: "/suppliers",
        icon: Truck,
        adminOnly: true,
      },
      {
        label: "Purchases",
        href: "/purchases",
        icon: ClipboardList,
        adminOnly: true,
      },
      {
        label: "Expenses",
        href: "/expenses",
        icon: CircleDollarSign,
        adminOnly: true,
      },
    ],
  },
  {
    label: "Insights",
    items: [
      {
        label: "Reports",
        href: "/reports",
        icon: ChartNoAxesCombined,
        adminOnly: true,
      },
      {
        label: "AI Insights",
        href: "/ai-insights",
        icon: BrainCircuit,
        adminOnly: true,
      },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        label: "Users & Staff",
        href: "/users",
        icon: UsersRound,
        adminOnly: true,
      },
      {
        label: "Audit Log",
        href: "/audit-log",
        icon: ClipboardList,
        adminOnly: true,
      },
      {
        label: "Settings",
        href: "/settings",
        icon: Settings,
        adminOnly: true,
      },
    ],
  },
];

export function AppSidebar({
  role,
  onNavigate,
}: AppSidebarProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <aside className="flex h-full w-[260px] flex-col border-r border-[#E5E2DA] bg-white">
      {/* Brand */}
      <div className="flex h-20 shrink-0 items-center border-b border-[#E5E2DA] px-6">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-3"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#244A3D] text-white">
            <Sparkles className="size-5" />
          </div>

          <div className="min-w-0">
            <p className="text-lg font-semibold tracking-tight text-[#242624]">
              FurniCore
            </p>

            <p className="truncate text-xs text-[#73766F]">
              Furniture Management
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <div className="space-y-6">
          {navigation.map((section, index) => {
            const items = section.items.filter(
              (item) => !item.adminOnly || role === "admin",
            );

            if (items.length === 0) {
              return null;
            }

            return (
              <div key={section.label ?? index}>
                {section.label && (
                  <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9A9C96]">
                    {section.label}
                  </p>
                )}

                <div className="space-y-1">
                  {items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onNavigate}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                          active
                            ? "bg-[#EEF3F0] text-[#244A3D]"
                            : "text-[#5F625D] hover:bg-[#F8F7F3] hover:text-[#242624]",
                        )}
                      >
                        <Icon className="size-[18px] shrink-0" />

                        <span className="truncate">
                          {item.label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-[#E5E2DA] px-5 py-4">
        <p className="text-xs text-[#9A9C96]">
          FurniCore Business System
        </p>
      </div>
    </aside>
  );
}