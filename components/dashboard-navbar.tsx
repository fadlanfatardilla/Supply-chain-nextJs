"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { Search, Globe, LayoutGrid, MessageSquare, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationBell } from "@/components/notification-bell";

export function DashboardNavbar() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();

  const user = session?.user;
  const userRole = (user?.role || "WAREHOUSE_MANAGER").toUpperCase();

  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "WM";

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/90 px-6 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90">
      {/* Sisi Kiri: Global Search Bar ala NiceAdmin */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Cari produk, SKU, atau nomor transaksi..."
            className="w-full rounded-xl border-slate-200 bg-slate-50/50 pl-10 pr-10 text-sm focus-visible:bg-white dark:border-slate-800 dark:bg-slate-800/50"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
            /
          </kbd>
        </div>
      </div>

      {/* Sisi Kanan: Utilitas Lengkap (Bahasa, Grid, Notifikasi, Pesan, Tema, Profil) */}
      <div className="flex items-center gap-3">
        {/* Tombol Bahasa (EN) */}
        <Button
          variant="outline"
          size="sm"
          className="h-10 gap-2 rounded-xl border-slate-200 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:text-slate-200"
        >
          <Globe className="h-4 w-4 text-slate-500" />
          <span>EN</span>
        </Button>

        {/* Tombol Grid Aplikasi */}
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
          title="Aplikasi Lain"
        >
          <LayoutGrid className="h-4 w-4" />
        </Button>

        {/* Lonceng Notifikasi Interaktif */}
        <NotificationBell />

        {/* Tombol Pesan / Chat dengan Badge Merah */}
        <Button
          variant="outline"
          size="icon"
          className="relative h-10 w-10 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
          title="Pesan Masuk"
        >
          <MessageSquare className="h-4 w-4" />
          <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-xs font-bold text-white shadow-sm">
            5
          </span>
        </Button>

        {/* Tombol Dark / Light Mode */}
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          title="Ganti Tema"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1" />

        {/* Profil Pengguna di Ujung Kanan */}
        <div className="flex items-center gap-3 pl-1">
          <Avatar className="h-10 w-10 border border-slate-200 dark:border-slate-700">
            <AvatarImage src={user?.image || ""} alt={user?.name || "User"} />
            <AvatarFallback className="text-xs font-bold bg-blue-600 text-white">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden flex-col text-left xl:flex">
            <span className="text-xs font-bold leading-tight text-slate-900 dark:text-slate-100">
              {user?.name || "Warehouse Manager"}
            </span>
            <span className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase">
              {userRole}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}