"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createInboundTransaction } from "@/app/actions/inbound";
import { toast } from "sonner";
import { PackagePlus, ArrowLeft, Loader2, Calendar, Building, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface Product {
  id: string;
  name: string;
  sku: string;
  unit: string;
}

interface Supplier {
  id: string;
  name: string;
  code: string;
}

interface Location {
  id: string;
  aisleRackBin: string;
  code: string;
}

interface Warehouse {
  id: string;
  name: string;
  code: string;
  locations: Location[];
}

interface Props {
  products: Product[];
  suppliers: Supplier[];
  warehouses: Warehouse[];
}

export default function InboundFormClient({ products, suppliers, warehouses }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [productId, setProductId] = useState(products[0]?.id || "");
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || "");
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id || "");
  const [locationId, setLocationId] = useState(warehouses[0]?.locations[0]?.id || "");
  const [batchNumber, setBatchNumber] = useState("");
  const [quantity, setQuantity] = useState<number>(1);
  const [manufacturedDate, setManufacturedDate] = useState("");
  const [expiredDate, setExpiredDate] = useState("");
  const [notes, setNotes] = useState("");

  // Update pilihan lokasi ketika gudang berubah
  const selectedWarehouse = warehouses.find((w) => w.id === warehouseId);
  const availableLocations = selectedWarehouse?.locations || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !locationId || !batchNumber || quantity <= 0) {
      toast.error("Form Belum Lengkap", { description: "Harap isi semua kolom wajib dengan benar." });
      return;
    }

    startTransition(async () => {
      const result = await createInboundTransaction({
        productId,
        supplierId: supplierId || undefined,
        locationId,
        batchNumber,
        manufacturedDate: manufacturedDate || undefined,
        expiredDate: expiredDate || undefined,
        quantity: Number(quantity),
        notes: notes || undefined,
      });

      if (result.success) {
        toast.success("Inbound Berhasil", {
          description: `Penerimaan ${quantity} unit berhasil dicatat ke dalam sistem.`,
        });
        router.push("/dashboard/movements");
        router.refresh();
      } else {
        toast.error("Gagal Memproses Inbound", { description: result.error });
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
          <PackagePlus className="w-6 h-6 text-emerald-600" /> Form Penerimaan Barang (Inbound)
        </h1>
        <p className="text-xs text-slate-500 pt-1">
          Catat barang masuk dari pemasok, tentukan nomor batch, tanggal kedaluwarsa (FEFO), dan alokasikan ke rak gudang.
        </p>
      </div>

      {/* Form Card */}
      <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 pb-4">
          <CardTitle className="text-sm font-bold">Detail Transaksi Inbound</CardTitle>
          <CardDescription className="text-xs">Pastikan informasi batch dan tanggal kedaluwarsa sesuai dengan fisik barang.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Pilih Produk & Supplier */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-medium block mb-1">Pilih Produk <span className="text-red-500">*</span></label>
                <select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  required
                  className="w-full h-9 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (SKU: {p.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-medium block mb-1">Pemasok / Supplier</label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full h-9 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">-- Pilih Supplier (Opsional) --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Pilih Gudang & Rak Tujuan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="font-medium block mb-1">Gudang Tujuan <span className="text-red-500">*</span></label>
                <select
                  value={warehouseId}
                  onChange={(e) => {
                    const newWhId = e.target.value;
                    setWarehouseId(newWhId);
                    const targetWh = warehouses.find((w) => w.id === newWhId);
                    setLocationId(targetWh?.locations[0]?.id || "");
                  }}
                  required
                  className="w-full h-9 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-medium block mb-1">Rak / Zonasi Penempatan <span className="text-red-500">*</span></label>
                <select
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  required
                  className="w-full h-9 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {availableLocations.length === 0 ? (
                    <option value="">Belum ada rak di gudang ini</option>
                  ) : (
                    availableLocations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.aisleRackBin} ({loc.code})
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {/* Nomor Batch & Jumlah */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="font-medium block mb-1">Nomor Batch Manufaktur <span className="text-red-500">*</span></label>
                <Input
                  placeholder="Contoh: BATCH-2026-X99"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  required
                  className="h-9 font-mono"
                />
              </div>

              <div>
                <label className="font-medium block mb-1">Jumlah Masuk (Kuantitas Pcs) <span className="text-red-500">*</span></label>
                <Input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  required
                  className="h-9 font-mono text-emerald-600 font-bold"
                />
              </div>
            </div>

            {/* Tanggal Manufaktur & Kedaluwarsa (FEFO) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="font-medium block mb-1">Tanggal Pembuatan (Manufactured Date)</label>
                <Input
                  type="date"
                  value={manufacturedDate}
                  onChange={(e) => setManufacturedDate(e.target.value)}
                  className="h-9 font-mono text-slate-500"
                />
              </div>

              <div>
                <label className="font-medium block mb-1">Tanggal Kedaluwarsa (Expired Date) - <strong className="text-blue-600">FEFO</strong></label>
                <Input
                  type="date"
                  value={expiredDate}
                  onChange={(e) => setExpiredDate(e.target.value)}
                  className="h-9 font-mono text-amber-600 font-medium"
                />
              </div>
            </div>

            {/* Catatan / Keterangan */}
            <div className="pt-2">
              <label className="font-medium block mb-1">Catatan / Keterangan Tambahan (Opsional)</label>
              <textarea
                placeholder="Contoh: Diterima dalam kondisi baik menggunakan truk ekspedisi..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full p-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Tombol Aksi */}
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="outline" size="sm" onClick={() => router.back()}>
                Batal
              </Button>
              <Button type="submit" size="sm" disabled={isPending} className="bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer">
                {isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                Simpan & Proses Inbound
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}