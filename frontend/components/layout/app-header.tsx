"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  LogOut,
  Menu,
  UserRound,
} from "lucide-react";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { UserProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";

interface AppHeaderProps {
  profile: UserProfile;
}

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/pos": "Point of Sale",
  "/products": "Products",
  "/inventory": "Inventory",
  "/customers": "Customers",
  "/sales": "Sales",
  "/suppliers": "Suppliers",
  "/purchases": "Purchases",
  "/expenses": "Expenses",
  "/reports": "Reports",
  "/ai-insights": "AI Insights",
  "/users": "Users & Staff",
  "/audit-log": "Audit Log",
  "/settings": "Business Settings",
};

function getPageTitle(pathname: string) {
  if (pageTitles[pathname]) {
    return pageTitles[pathname];
  }

  const route = Object.keys(pageTitles)
    .filter((item) => item !== "/")
    .find((item) => pathname.startsWith(`${item}/`));

  return route ? pageTitles[route] : "FurniCore";
}

export function AppHeader({ profile }: AppHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    const supabase = createClient();

    await supabase.auth.signOut();

    router.replace("/login");
    router.refresh();
  }

  const initials = profile.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-[#E5E2DA] bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
      {/* Left side */}
      <div className="flex min-w-0 items-center gap-3">
        {/* Mobile navigation */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger
            render={
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 lg:hidden"
                aria-label="Open navigation"
              />
            }
          >
            <Menu className="size-5" />
          </SheetTrigger>

          <SheetContent
            side="left"
            className="w-[280px] max-w-[85vw] p-0"
          >
            <SheetTitle className="sr-only">
              FurniCore navigation
            </SheetTitle>

            <AppSidebar
              role={profile.role}
              onNavigate={() => setMobileOpen(false)}
            />
          </SheetContent>
        </Sheet>

        {/* Page title */}
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold tracking-tight text-[#242624] sm:text-xl">
            {getPageTitle(pathname)}
          </h1>

          <p className="hidden text-sm text-[#73766F] sm:block">
            Manage your furniture business
          </p>
        </div>
      </div>

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              className="h-auto shrink-0 gap-3 px-2 py-1.5"
            />
          }
        >
          <Avatar className="size-9">
            <AvatarFallback className="bg-[#EEF3F0] text-sm font-semibold text-[#244A3D]">
              {initials || "U"}
            </AvatarFallback>
          </Avatar>

          <div className="hidden text-left sm:block">
            <p className="max-w-36 truncate text-sm font-medium text-[#242624]">
              {profile.name}
            </p>

            <p className="text-xs capitalize text-[#73766F]">
              {profile.role}
            </p>
          </div>

          <ChevronDown className="hidden size-4 text-[#73766F] sm:block" />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          {/* User information */}
          <DropdownMenuGroup>
            <DropdownMenuLabel>
              <p>{profile.name}</p>

              <p className="text-xs font-normal capitalize text-muted-foreground">
                {profile.role}
              </p>
            </DropdownMenuLabel>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          {/* Profile */}
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <UserRound className="size-4" />
              Profile
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          {/* Logout */}
          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-red-600 focus:text-red-600"
            >
              <LogOut className="size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}