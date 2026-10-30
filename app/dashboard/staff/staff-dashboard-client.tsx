"use client";

import { useRouter } from "next/navigation";
import { PackagePlus, PackageMinus, ArrowRightLeft, History, Clock, ArrowRight, UserCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Props {
  userName: string;
  userEmail: string;
  pendingInboundsCount: number;
  totalMovementsCount: number;
}

export default function StaffDashboardClient({
  userName,
  userEmail,
  pendingInboundsCount,
  totalMovementsCount,
}: Props) {
  const router = useRouter();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-100 text-xs font-medium mb-1">
            <UserCheck className="w-4 h-4" /> Sesi Staf Operasional Aktif
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Selamat Datang, {userName}!</h1>
          <p className="text-xs text-blue-100/90 pt-0.5">{userEmail}</p>
        </div>
        <Button
          onClick={() => router.push("/dashboard/inbound")}
          size="sm"
          className="bg-white text-blue-700 hover:bg-blue-50 text-xs font-semibold cursor-pointer shadow-sm"
        >
          + Input Inbound Baru
        </Button>
      </div>

      {/* Ringkasan Status PENDING milik staf */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border border-amber-200 dark:border-amber-900/50 bg-amber-50/20 dark:bg-amber-950/10">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-amber-700 dark:text-amber-400">Draf Inbound Menunggu Approval</p>
              <p className="text-2xl font-bold font-mono text-amber-900 dark:text-amber-200 pt-1">
                {pendingInboundsCount} <span className="text-xs font-sans font-normal text-amber-600">Transaksi</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 dark:border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-500">Total Log Mutasi Gudang</p>
              <p className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 pt-1">
                {totalMovementsCount} <span className="text-xs font-sans font-normal text-slate-400">Catatan</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600">
              <History className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Menu Aksi Cepat Operasional Staf */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Aksi Cepat Operasional Gudang</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: Form Inbound */}
          <Card 
            onClick={() => router.push("/dashboard/inbound")}
            className="border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 hover:shadow-md transition-all cursor-pointer group"
          >
            <CardHeader className="pb-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 mb-1 group-hover:scale-110 transition-transform">
                <PackagePlus className="w-5 h-5" />
              </div>
              <CardTitle className="text-sm font-bold">Barang Masuk (Inbound)</CardTitle>
              <CardDescription className="text-xs">Input barang masuk dari supplier untuk diajukan ke Manager.</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 flex justify-end">
              <span className="text-xs text-emerald-600 font-medium flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Buka Form <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </CardContent>
          </Card>

          {/* Card 2: Form Outbound */}
          <Card 
            onClick={() => router.push("/dashboard/outbound")}
            className="border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 hover:shadow-md transition-all cursor-pointer group"
          >
            <CardHeader className="pb-3">
              <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 mb-1 group-hover:scale-110 transition-transform">
                <PackageMinus className="w-5 h-5" />
              </div>
              <CardTitle className="text-sm font-bold">Barang Keluar (Outbound)</CardTitle>
              <CardDescription className="text-xs">Proses pengeluaran barang dari rak dengan cek stok otomatis.</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 flex justify-end">
              <span className="text-xs text-amber-600 font-medium flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Buka Form <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </CardContent>
          </Card>

          {/* Card 3: Transfer Rak / Riwayat Mutasi */}
          <Card 
            onClick={() => router.push("/dashboard/movements")}
            className="border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 hover:shadow-md transition-all cursor-pointer group"
          >
            <CardHeader className="pb-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 mb-1 group-hover:scale-110 transition-transform">
                <ArrowRightLeft className="w-5 h-5" />
              </div>
              <CardTitle className="text-sm font-bold">Riwayat & Status Mutasi</CardTitle>
              <CardDescription className="text-xs">Pantau status approval draf Inbound Anda di riwayat stok.</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 flex justify-end">
              <span className="text-xs text-blue-600 font-medium flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Lihat Log <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}