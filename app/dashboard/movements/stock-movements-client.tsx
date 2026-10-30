"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { approveInboundTransaction, createInboundTransaction } from "@/app/actions/inbound";
import { toast } from "sonner";
import { History, ArrowRightLeft, PackagePlus, PackageMinus, RefreshCw, Search, FileSpreadsheet, CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface MovementItem {
  id: string;
  referenceNumber: string;
  type: string;
  quantity: number;
  notes: string | null;
  createdAt: string;
  productBatch: {
    batchNumber: string;
    product: {
      name: string;
      sku: string;
      unit: string;
    };
  } | null;
  fromLocation: {
    aisleRackBin: string;
    warehouse: { name: string };
  } | null;
  toLocation: {
    aisleRackBin: string;
    warehouse: { name: string };
  } | null;
  user: {
    name: string;
    email: string;
  } | null;
}

interface PendingInboundItem {
  id: string;
  referenceNumber: string;
  status: string;
  createdAt: string;
  supplier: { name: string; code: string } | null;
  creator: { name: string } | null;
  items: Array<{
    id: string;
    batchNumber: string;
    quantity: number;
    product: { name: string; sku: string; unit: string };
    location: { aisleRackBin: string; warehouse: { name: string } };
  }>;
}

interface Props {
  initialMovements: MovementItem[];
  pendingInbounds: PendingInboundItem[];
  userRole: string;
}

export default function StockMovementsClient({ initialMovements, pendingInbounds, userRole }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const canApprove = userRole === "WAREHOUSE_MANAGER" || userRole === "SUPER_ADMIN";

  const handleApprove = (id: string, refNum: string) => {
    startTransition(async () => {
      const res = await approveInboundTransaction(id);
      if (res.success) {
        toast.success("Inbound Disetujui", { description: `Transaksi ${refNum} berhasil disetujui & stok masuk rak.` });
        router.refresh();
      } else {
        toast.error("Gagal Menyetujui", { description: res.error });
      }
    });
  };

  const handleReject = (id: string, refNum: string) => {
    const reason = prompt("Masukkan alasan penolakan (opsional):");
    startTransition(async () => {
      const res = await rejectInboundTransaction(id, reason || undefined);
      if (res.success) {
        toast.success("Inbound Ditolak", { description: `Transaksi ${refNum} telah ditolak.` });
        router.refresh();
      } else {
        toast.error("Gagal Menolak", { description: res.error });
      }
    });
  };

  // Helper untuk badge tipe gerakan
  const getMovementBadge = (type: string) => {
    switch (type) {
      case "TRANSFER":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1"><ArrowRightLeft className="w-3 h-3"/> Transfer Rak</Badge>;
      case "INBOUND":
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1"><PackagePlus className="w-3 h-3"/> Masuk (Inbound)</Badge>;
      case "OUTBOUND":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1"><PackageMinus className="w-3 h-3"/> Keluar (Outbound)</Badge>;
      case "ADJUSTMENT":
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 gap-1"><RefreshCw className="w-3 h-3"/> Penyesuaian</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  // Filter data berdasarkan pencarian, tipe, dan rentang tanggal
  const filteredMovements = initialMovements.filter((m) => {
    const matchesSearch = 
      m.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.productBatch?.product?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.productBatch?.product?.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.productBatch?.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.notes && m.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = selectedType === "ALL" || m.type === selectedType;

    let matchesDate = true;
    const itemDate = new Date(m.createdAt).toISOString().slice(0, 10);
    if (startDate && itemDate < startDate) matchesDate = false;
    if (endDate && itemDate > endDate) matchesDate = false;

    return matchesSearch && matchesType && matchesDate;
  });

  // Fungsi Ekspor ke CSV sederhana
  const handleExportCSV = () => {
    const headers = ["ID Transaksi", "Waktu", "Tipe", "Produk", "SKU", "Batch", "Dari Rak", "Ke Rak", "Jumlah", "Catatan"];
    const rows = filteredMovements.map((m) => [
      m.referenceNumber,
      new Date(m.createdAt).toLocaleString("id-ID"),
      m.type,
      `"${m.productBatch?.product?.name || "-"}"`,
      m.productBatch?.product?.sku || "-",
      m.productBatch?.batchNumber || "-",
      `"${m.fromLocation ? `${m.fromLocation.warehouse.name} -${m.fromLocation.aisleRackBin}` : "External"}"`,
      `"${m.toLocation ? `${m.toLocation.warehouse.name} -${m.toLocation.aisleRackBin}` : "-"}"`,
      m.quantity,
      `"${m.notes || "-"}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `laporan-mutasi-stok-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <History className="w-6 h-6 text-blue-600" /> Riwayat Mutasi & Persetujuan Stok
          </h1>
          <p className="text-xs text-slate-500 pt-1">
            Pantau seluruh mutasi barang sekaligus kelola persetujuan (*approval*) penerimaan barang masuk dari staf.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleExportCSV} 
            variant="outline" 
            size="sm" 
            className="h-9 text-xs gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Ekspor CSV
          </Button>
          <div className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-right shadow-sm">
            <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">Total Mutasi</span>
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400 font-mono">{filteredMovements.length} Transaksi</span>
          </div>
        </div>
      </div>

      {/* Bagian Khusus Approval Inbound (Pending) */}
      {pendingInbounds.length > 0 && (
        <Card className="border border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-950/10 shadow-sm">
          <CardHeader className="pb-3 border-b border-amber-100 dark:border-amber-900/30">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-amber-800 dark:text-amber-400">
              <Clock className="w-4 h-4 text-amber-600" /> Menunggu Persetujuan Inbound ({pendingInbounds.length})
            </CardTitle>
            <CardDescription className="text-xs text-amber-700/80 dark:text-amber-500">
              Draf penerimaan barang dari staf yang memerlukan persetujuan Manajer sebelum stok resmi masuk ke rak.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-amber-100/50 dark:bg-amber-900/20 text-slate-600 dark:text-slate-300 uppercase text-[10px] font-semibold border-b border-amber-200 dark:border-amber-900/30">
                    <th className="py-3 px-4">Waktu & Referensi</th>
                    <th className="py-3 px-4">Supplier & Pembuat</th>
                    <th className="py-3 px-4">Detail Barang & Rak Tujuan</th>
                    <th className="py-3 px-4 text-right">Aksi Manajer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100 dark:divide-amber-900/20">
                  {pendingInbounds.map((item) => (
                    <tr key={item.id} className="hover:bg-amber-100/30 dark:hover:bg-amber-900/10 transition-colors">
                      <td className="py-3 px-4 align-top">
                        <span className="font-mono font-bold text-slate-900 dark:text-slate-100 block">
                          {new Date(item.createdAt).toLocaleString("id-ID", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">{item.referenceNumber}</span>
                      </td>
                      <td className="py-3 px-4 align-top">
                        <span className="font-medium text-slate-800 dark:text-slate-200 block">{item.supplier?.name || "Umum"}</span>
                        <span className="text-[11px] text-slate-400">Staf: {item.creator?.name || "System"}</span>
                      </td>
                      <td className="py-3 px-4 align-top space-y-1">
                        {item.items.map((i, idx) => (
                          <div key={idx} className="text-slate-700 dark:text-slate-300">
                            • <strong className="text-slate-900 dark:text-slate-100">{i.product.name}</strong> — {i.quantity} {i.product.unit} (Batch: <span className="font-mono">{i.batchNumber}</span>) <br />
                            <span className="text-[11px] text-slate-400">Rak: {i.location.warehouse.name} [{i.location.aisleRackBin}]</span>
                          </div>
                        ))}
                      </td>
                      <td className="py-3 px-4 align-top text-right">
                        {canApprove ? (
                          <div className="flex justify-end gap-1.5">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleReject(item.id, item.referenceNumber)}
                              disabled={isPending}
                              className="h-7 text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/30 text-[11px]"
                            >
                              Tolak
                            </Button>
                            <Button 
                              size="sm" 
                              onClick={() => handleApprove(item.id, item.referenceNumber)}
                              disabled={isPending}
                              className="h-7 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px]"
                            >
                              {isPending && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                              Setujui
                            </Button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-amber-600 font-medium italic">
                            Menunggu Manager
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bar Pencarian & Filter Lanjutan */}
      <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
        <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* Pencarian Global */}
          <div className="relative sm:col-span-1.5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari produk, SKU, nomor batch, ref..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          {/* Filter Tipe Transaksi */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full h-9 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">Semua Tipe Transaksi</option>
              <option value="TRANSFER">Transfer Rak</option>
              <option value="INBOUND">Masuk (Inbound)</option>
              <option value="OUTBOUND">Keluar (Outbound)</option>
              <option value="ADJUSTMENT">Penyesuaian</option>
            </select>
          </div>

          {/* Filter Tanggal Mulai */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400">Dari:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full h-9 px-2 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-mono"
            />
          </div>

          {/* Filter Tanggal Selesai */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400">Sampai:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full h-9 px-2 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-mono"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabel Riwayat */}
      <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/60">
          <CardTitle className="text-sm font-bold">Log Aktivitas Gudang</CardTitle>
          <CardDescription className="text-xs">Menampilkan daftar mutasi stok berdasarkan filter yang dipilih.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {filteredMovements.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-400">
              Tidak ada riwayat pergerakan stok yang cocok dengan kriteria pencarian Anda.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 uppercase text-[10px] font-semibold border-b border-slate-200 dark:border-slate-800">
                    <th className="py-3 px-4">Waktu & Referensi</th>
                    <th className="py-3 px-4">Tipe</th>
                    <th className="py-3 px-4">Produk & Batch</th>
                    <th className="py-3 px-4">Asal & Tujuan Rak</th>
                    <th className="py-3 px-4 text-right">Jumlah</th>
                    <th className="py-3 px-4">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredMovements.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono font-medium text-slate-900 dark:text-slate-100 block">
                          {new Date(m.createdAt).toLocaleString("id-ID", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">{m.referenceNumber}</span>
                      </td>
                      <td className="py-3 px-4">
                        {getMovementBadge(m.type)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                          {m.productBatch?.product?.name || "Produk Dihapus"}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">
                          SKU: {m.productBatch?.product?.sku || "-"} | Batch: {m.productBatch?.batchNumber || "-"}
                        </span>
                      </td>
                      <td className="py-3 px-4 space-y-0.5">
                        <div className="text-[11px] text-slate-600 dark:text-slate-300">
                          <span className="text-slate-400">Dari:</span> {m.fromLocation ? `${m.fromLocation.warehouse.name} (${m.fromLocation.aisleRackBin})` : "External / Awal"}
                        </div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-300">
                          <span className="text-slate-400">Ke:</span> {m.toLocation ? `${m.toLocation.warehouse.name} (${m.toLocation.aisleRackBin})` : "-"}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">
                        +{m.quantity} {m.productBatch?.product?.unit || "pcs"}
                      </td>
                      <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                        {m.notes || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}