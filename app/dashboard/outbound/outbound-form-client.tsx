"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createOutboundTransaction } from "@/app/actions/outbound";
import { toast } from "sonner";
import { PackageMinus, ArrowLeft, Loader2, Calendar, MapPin, Building, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface InventoryItem {
  id: string;
  quantity: number;
  locationId: string;
  productBatchId: string;
  location: {
    id: string;
    aisleRackBin: string;
    warehouse: {
      name: string;
      code: string;
    };
  };
  productBatch: {
    id: string;
    batchNumber: string;
    expiredAt: Date | null;
    product: {
      id: string;
      name: string;
      sku: string;
      unit: string; // Satuan dinamis: pcs, box, kg, liter, dll.
    };
  };
}

interface Props {
  inventoryStocks: InventoryItem[];
}

export default function OutboundFormClient({ inventoryStocks }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [selectedStockId, setSelectedStockId] = useState(inventoryStocks[0]?.id || "");
  const [quantity, setQuantity] = useState<number>(1);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");

  const currentStock = inventoryStocks.find((s) => s.id === selectedStockId);
  const productUnit = currentStock?.productBatch.product.unit || "pcs";

  // Handler perubahan kuantitas dengan proteksi langsung
  const handleQuantityChange = (val: number) => {
    if (currentStock && val > currentStock.quantity) {
      toast.error("Jumlah Melebihi Stok!", {
        description: `Maksimal stok yang tersedia di rak ini adalah ${currentStock.quantity} ${productUnit}.`,
      });
      setQuantity(currentStock.quantity); // Batasi otomatis ke max stok
      return;
    }
    setQuantity(val < 1 ? 1 : val);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStock || quantity <= 0) {
      toast.error("Form Belum Lengkap", { description: "Pilih stok dan pastikan jumlah keluar valid." });
      return;
    }

    if (quantity > currentStock.quantity) {
      toast.error("Kuantitas Melebihi Stok", {
        description: `Maksimal stok tersedia di rak ini adalah ${currentStock.quantity} ${productUnit}.`,
      });
      return;
    }

    startTransition(async () => {
      const result = await createOutboundTransaction({
        productId: currentStock.productBatch.product.id,
        locationId: currentStock.locationId,
        productBatchId: currentStock.productBatchId,
        quantity: Number(quantity),
        referenceNumber: referenceNumber || undefined,
        notes: notes || undefined,
      });

      if (result.success) {
        toast.success("Outbound Berhasil", { description: result.message });
        router.push("/dashboard/movements");
        router.refresh();
      } else {
        toast.error("Gagal Memproses Outbound", { description: result.error });
      }
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.push("/dashboard/warehouses")}
          className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 p-0 h-auto gap-1 mb-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Manajemen Gudang
        </Button>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <PackageMinus className="w-6 h-6 text-amber-600" /> Form Pengeluaran Barang (Outbound)
        </h1>
        <p className="text-xs text-slate-500 pt-1">
          Keluarkan stok barang dari rak gudang berdasarkan prioritas kedaluwarsa (<strong className="text-blue-600">FEFO</strong>).
        </p>
      </div>

      {/* Form Card */}
      <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 pb-4">
          <CardTitle className="text-sm font-bold">Pilih Stok & Alokasi Rak Sumber</CardTitle>
          <CardDescription className="text-xs">Sistem mengurutkan batch berdasarkan tanggal kedaluwarsa terdekat (FEFO).</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {inventoryStocks.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              Tidak ada stok barang di dalam gudang saat ini. Lakukan Inbound terlebih dahulu.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Pilihan Batch Stok */}
              <div>
                <label className="font-medium block mb-1">Pilih Batch & Lokasi Rak Asal <span className="text-red-500">*</span></label>
                <select
                  value={selectedStockId}
                  onChange={(e) => {
                    setSelectedStockId(e.target.value);
                    setQuantity(1);
                  }}
                  required
                  className="w-full h-10 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-medium focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  {inventoryStocks.map((item) => (
                    <option key={item.id} value={item.id}>
                      [{item.productBatch.product.sku}] {item.productBatch.product.name} — Batch: {item.productBatch.batchNumber} (Rak: {item.location.aisleRackBin} | Stok: {item.quantity} {item.productBatch.product.unit})
                    </option>
                  ))}
                </select>
              </div>

              {/* Ringkasan Stok Terpilih */}
              {currentStock && (
                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Detail Rak & Batch Terpilih:</span>
                    <Badge variant="outline" className="font-mono text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30">
                      Stok Tersedia: {currentStock.quantity} {productUnit}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-blue-500" />
                      <span>Gudang: <strong>{currentStock.location.warehouse.name}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-red-500" />
                      <span>Rak: <strong className="font-mono">{currentStock.location.aisleRackBin}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-500" />
                      <span>Expired: <strong className="font-mono">{currentStock.productBatch.expiredAt ? new Date(currentStock.productBatch.expiredAt).toLocaleDateString("id-ID") : "Tidak Ada"}</strong></span>
                    </div>
                  </div>
                </div>
              )}

              {/* Kuantitas Keluar & No Referensi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-medium">
                      Jumlah Keluar <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] font-mono text-blue-600 uppercase font-semibold">
                      Satuan: {productUnit}
                    </span>
                  </div>
                  <Input
                    type="number"
                    min={1}
                    max={currentStock?.quantity || 1}
                    value={quantity}
                    onChange={(e) => handleQuantityChange(Number(e.target.value))}
                    required
                    className="h-9 font-mono text-amber-600 font-bold"
                  />
                  {currentStock && quantity > currentStock.quantity && (
                    <p className="text-[10px] text-red-500 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3" /> Jumlah melebihi stok maksimum ({currentStock.quantity} {productUnit})
                    </p>
                  )}
                </div>

                <div>
                  <label className="font-medium block mb-1">Nomor Referensi / Surat Jalan (Opsional)</label>
                  <Input
                    placeholder="Contoh: DO-2026-001"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    className="h-9 font-mono"
                  />
                </div>
              </div>

              {/* Catatan / Keterangan */}
              <div className="pt-2">
                <label className="font-medium block mb-1">Catatan Pengeluaran (Opsional)</label>
                <textarea
                  placeholder="Contoh: Pengiriman pesanan untuk cabang Jakarta..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full p-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* Tombol Aksi */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" size="sm" onClick={() => router.back()}>
                  Batal
                </Button>
                <Button type="submit" size="sm" disabled={isPending} className="bg-amber-600 hover:bg-amber-500 text-white cursor-pointer">
                  {isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                  Proses Outbound (Keluarkan Stok)
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}