"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Package,
  Boxes,
  Warehouse,
  QrCode,
  History,
  Truck,
  PackagePlus,
  PackageMinus,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Boxes,
    roles: ["STAFF", "WAREHOUSE_MANAGER", "MANAGER"],
  },
  {
    title: "Master Produk",
    url: "/dashboard/products",
    icon: Package,
    roles: ["WAREHOUSE_MANAGER", "MANAGER"],
  },
  {
    title: "Lokasi & Gudang",
    url: "/dashboard/warehouses",
    icon: Warehouse,
    roles: ["WAREHOUSE_MANAGER", "MANAGER"],
  },
  {
    title: "Penerimaan (Inbound)",
    url: "/dashboard/inbound",
    icon: PackagePlus,
    roles: ["STAFF", "MANAGER"],
  },
  {
    title: "Pengeluaran (Outbound)",
    url: "/dashboard/outbound",
    icon: PackageMinus,
    roles: ["STAFF", "MANAGER"],
  },
  {
    title: "Persetujuan & Mutasi Stok",
    url: "/dashboard/movements",
    icon: History,
    roles: ["STAFF", "WAREHOUSE_MANAGER", "MANAGER"],
  },
  {
    title: "Supplier",
    url: "/dashboard/suppliers",
    icon: Truck,
    roles: ["WAREHOUSE_MANAGER", "MANAGER", "STAFF"],
  },
  {
    title: "Audit",
    url: "/dashboard/audit-scan",
    icon: QrCode,
    roles: ["STAFF", "WAREHOUSE_MANAGER", "MANAGER"],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Cegah perbedaan render SSR vs Client sebelum mount selesai
  if (!mounted) {
    return (
      <Sidebar collapsible="icon">
        <SidebarHeader className="border-b px-4 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Boxes className="h-5 w-5" />
            </div>
            <div className="flex flex-col gap-0.5 group-data-[collapsible=icon]:hidden">
              <span className="font-semibold text-sm leading-none">Stokio WMS</span>
              <span className="text-[11px] text-muted-foreground leading-none">Inventory & Logistics OS</span>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent className="px-2 py-2" />
        <SidebarRail />
      </Sidebar>
    );
  }

  const user = session?.user;
  const userRole = (user?.role || "STAFF").toUpperCase();

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(userRole)
  );

  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "US";

  return (
    <Sidebar collapsible="icon">
      {/* Brand Header */}
      <SidebarHeader className="border-b px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Boxes className="h-5 w-5" />
          </div>

          <div className="flex flex-col gap-0.5 group-data-[collapsible=icon]:hidden">
            <span className="font-semibold text-sm leading-none">
              Stokio WMS
            </span>
            <span className="text-[11px] text-muted-foreground leading-none">
              Inventory & Logistics OS
            </span>
          </div>
        </div>
      </SidebarHeader>

      {/* Navigation Content */}
      <SidebarContent className="px-2 py-2">
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 pb-1 text-xs font-medium text-muted-foreground">
            Menu Utama
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {filteredNavItems.map((item) => {
                // Tentukan target URL dinamis khusus untuk item "Dashboard"
                let targetUrl = item.url;
                if (item.title === "Dashboard") {
                  targetUrl = userRole === "STAFF" ? "/dashboard/staff" : "/dashboard";
                }

                const isActive = pathname === targetUrl;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className="h-9 px-2.5 hover:bg-accent"
                    >
                      <Link href={targetUrl} className="flex items-center gap-3">
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span className="text-sm font-medium">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* User Profile Footer (Dinamis dari Auth Session) */}
      <SidebarFooter className="border-t p-3">
        <div className="flex items-center gap-3 px-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={user?.image || ""} alt={user?.name || "User"} />
            <AvatarFallback className="text-xs font-semibold bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-0.5 min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="text-xs font-semibold truncate leading-none">
              {user?.name || "Pengguna"}
            </span>
            <span className="text-[10px] text-muted-foreground truncate leading-none uppercase tracking-wider font-mono">
              {userRole}
            </span>
          </div>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}