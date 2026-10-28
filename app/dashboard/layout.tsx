"use client";

import { useState, Suspense, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { AppSidebar } from "@/components/app-sidebar";
import { NotificationBell } from "@/components/notification-bell";
import { SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Search,
  Building2,
  ChevronDown,
  LayoutGrid,
  QrCode,
  MessageSquare,
  Moon,
  Sun,
  LogOut,
  Loader2,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { motion } from "framer-motion";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Ditambahkan 'status' untuk mendeteksi kapan sesi client selesai dimuat
  const { data: session, status } = useSession();
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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    startTransition(() => {
      router.push(`/dashboard/products?search=${encodeURIComponent(searchQuery.trim())}`);
    });
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await signOut({ callbackUrl: "/login" });
  };

  // Mencegah render salah role saat client session masih proses sinkronisasi awal
  if (status === "loading") {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-slate-950 text-slate-400 gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
        <span className="text-xs">Memuat sesi...</span>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Suspense fallback={<div className="w-64 border-r bg-white dark:bg-slate-900" />}>
        <AppSidebar />
      </Suspense>

      <SidebarInset className="flex flex-col">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b bg-white/85 px-4 backdrop-blur-md transition-all ease-linear dark:border-slate-800 dark:bg-slate-900/85">
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-1 h-4" />
            <Breadcrumb className="hidden sm:block">
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Ringkasan Stok</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            {/* Global Search Bar: Hanya muncul jika role BUKAN STAFF */}
            {userRole !== "STAFF" && (
              <form onSubmit={handleSearchSubmit} className="relative w-full max-w-xs ml-2 hidden lg:block">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari SKU, produk, atau barang..."
                  className="w-full h-8 rounded-xl border-slate-200 bg-slate-50/50 pl-8 pr-8 text-xs focus-visible:bg-white dark:border-slate-800 dark:bg-slate-800/50"
                />
                <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-slate-200 bg-slate-100 px-1 py-0.2 text-[9px] font-mono text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                  /
                </kbd>
              </form>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/dashboard/audit-scan")}
              className="h-8 gap-1.5 rounded-xl border-slate-200 text-xs font-semibold text-slate-700 hidden sm:flex dark:border-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              title="Buka Scanner QR"
            >
              <QrCode className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span>Scan QR</span>
            </Button>

            {/* Notification Bell: Hanya muncul jika role BUKAN STAFF */}
            {userRole !== "STAFF" && <NotificationBell />}

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              title="Ganti Tema"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

            {/* Separator Tipis */}
            <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-800 mx-0.5" />

            {/* Profil User */}
            <div className="flex items-center gap-2.5">
              <Avatar className="h-8 w-8 border border-slate-200 dark:border-slate-700">
                <AvatarImage src={user?.image || ""} alt={user?.name || "User"} />
                <AvatarFallback className="text-[10px] font-bold bg-blue-600 text-white">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden flex-col text-left xl:flex">
                <span className="text-xs font-bold leading-tight text-slate-900 dark:text-slate-100">
                  {user?.name || "Warehouse Manager"}
                </span>
                <span className="text-[9px] font-mono tracking-wider text-muted-foreground uppercase">
                  {userRole}
                </span>
              </div>
            </div>

            {/* Tombol Logout Merah */}
            <Button
              variant="ghost"
              size="icon"
              title="Keluar dari sistem"
              onClick={() => setShowLogoutDialog(true)}
              className="h-8 w-8 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white hover:border-red-500 hover:shadow-lg hover:shadow-red-500/20 transition-all duration-200 cursor-pointer ml-1"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="sr-only">Logout</span>
            </Button>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="h-full"
          >
            {children}
          </motion.div>
        </main>
      </SidebarInset>

      {/* Modal Dialog Konfirmasi Logout */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="max-w-[340px] bg-white/95 backdrop-blur-md border border-slate-200/80 text-slate-900 rounded-2xl p-6 shadow-2xl transition-all dark:bg-slate-900/95 dark:border-slate-800 dark:text-slate-100">
          <DialogHeader className="flex flex-col items-center text-center space-y-3">
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-red-400/20 animate-ping opacity-25" />
              <div className="relative w-12 h-12 rounded-full bg-red-50 border border-red-100/80 text-red-600 flex items-center justify-center shadow-sm shadow-red-500/10 dark:bg-red-950/40 dark:border-red-900/50 dark:text-red-400">
                <LogOut className="w-5 h-5 ml-0.5" />
              </div>
            </div>

            <div className="space-y-1">
              <DialogTitle className="text-base font-bold text-slate-900 tracking-tight dark:text-slate-100">
                Keluar dari Sistem?
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 font-normal leading-relaxed dark:text-slate-400">
                Sesi aktif Anda di Stokio WMS akan diakhiri.
              </DialogDescription>
            </div>
          </DialogHeader>

          <DialogFooter className="mt-5 flex items-center justify-center gap-2.5 sm:justify-center">
            <Button
              type="button"
              variant="outline"
              disabled={isLoggingOut}
              onClick={() => setShowLogoutDialog(false)}
              className="w-full sm:w-auto flex-1 bg-slate-100 hover:bg-slate-200/80 text-slate-700 border-slate-200/80 rounded-xl text-xs font-semibold h-9 transition-all active:scale-95 disabled:opacity-50 cursor-pointer dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700"
            >
              Batal
            </Button>
            <Button
              type="button"
              disabled={isLoggingOut}
              onClick={handleLogout}
              className="w-full sm:w-auto flex-1 bg-red-600 hover:bg-red-500 active:scale-95 text-white rounded-xl text-xs font-semibold h-9 shadow-md shadow-red-600/25 hover:shadow-lg hover:shadow-red-600/35 transition-all disabled:opacity-80 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>Mengeluarkan...</span>
                </>
              ) : (
                <span>Keluar</span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}