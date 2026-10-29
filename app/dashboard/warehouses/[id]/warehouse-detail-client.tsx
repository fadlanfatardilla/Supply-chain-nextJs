"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { transferStock } from "@/app/actions/warehouses";
import { toast } from "sonner";
import { 
  Building2, 
  ArrowLeft, 
  Search, 
  MapPin, 
  Layers, 
  Package, 
  CheckCircle2, 
  AlertCircle,
  ShieldAlert,
  ArrowRightLeft,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ItemDetail {
  id: string;
  productName: string;
  sku: string;
  category: string;
  quantity: number;
  batchNumber: string;
}

interface LocationDetail {
  id: string;
  code: string;
  aisleRackBin: string;
  status: "OCCUPIED" | "EMPTY";
  totalItems: number;
  capacityUsage: string;
  items: ItemDetail[];
}

interface WarehouseData {
  id: string;
  name: string;
  code: string;
  city: string;
  address: string;
  createdAt: string;
  locations: LocationDetail[];
}

interface Props {
  warehouse: WarehouseData;
  userRole: string;
}

export default function WarehouseDetailClient({ warehouse, userRole }: Props) {
  const router = useRouter();
  const [searchRack, setSearchRack] = useState("");
  
  // State Grid Visual Rak
  const [selectedRack, setSelectedRack] = useState<LocationDetail | null>(
    warehouse.locations[0] || null
  );

  // State Dialog & Form Transfer Stok
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<{
    id: string;
    productName: string;
    sourceLocationId: string;
    sourceLocationName: string;
    maxQuantity: number;
  } | null>(null);
  const [targetLocationId, setTargetLocationId] = useState<string>("");
  const [quantityToTransfer, setQuantityToTransfer] = useState<number>(1);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filter lokasi rak berdasarkan pencarian
  const filteredLocations = warehouse.locations.filter((loc) =>
    loc.aisleRackBin.toLowerCase().includes(searchRack.toLowerCase()) ||
    loc.code.toLowerCase().includes(searchRack.toLowerCase())
  );

  const totalRacks = warehouse.locations.length;
  const occupiedRacks = warehouse.locations.filter((l) => l.status === "OCCUPIED").length;
  const emptyRacks = totalRacks - occupiedRacks;
  const occupancyRate = totalRacks > 0 ? Math.round((occupiedRacks / totalRacks) * 100) : 0;

  // Buka dialog transfer stok
  const handleOpenTransferModal = (
    stock: ItemDetail, 
    locationId: string, 
    locationName: string
  ) => {
    setErrorMessage(null);
    setSelectedStock({
      id: stock.id,
      productName: stock.productName,
      sourceLocationId: locationId,
      sourceLocationName: locationName,
      maxQuantity: stock.quantity,
    });
    setQuantityToTransfer(1);
    
    // Pilih otomatis lokasi rak tujuan lain jika tersedia
    const otherLocations = warehouse.locations.filter((l) => l.id !== locationId);
    setTargetLocationId(otherLocations[0]?.id || "");
    setIsTransferDialogOpen(true);
  };

  // Handler Submit Mutasi Stok
  const handleSubmitTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStock || !targetLocationId) return;

    if (quantityToTransfer <= 0) {
      const err = "Jumlah mutasi minimal 1 pcs.";
      setErrorMessage(err);
      toast.error("Validasi Gagal", { description: err });
      return;
    }

    if (quantityToTransfer > selectedStock.maxQuantity) {
      const err = `Jumlah transfer (${quantityToTransfer} pcs) melebihi stok tersedia (${selectedStock.maxQuantity} pcs).`;
      setErrorMessage(err);
      toast.error("Stok Tidak Mencukupi", { description: err });
      return;
    }

    setErrorMessage(null);

    startTransition(async () => {
      const result = await transferStock({
        sourceStockId: selectedStock.id,
        targetLocationId: targetLocationId,
        quantityToTransfer: Number(quantityToTransfer),
      });

      if (result.success) {
        setIsTransferDialogOpen(false);
        toast.success("Mutasi Stok Berhasil", {
          description: `${quantityToTransfer} unit ${selectedStock.productName} berhasil dipindahkan.`,
        });
        router.refresh();
      } else {
        const err = result.error || "Gagal melakukan mutasi stok.";
        setErrorMessage(err);
        toast.error("Terjadi Kesalahan", { description: err });
      }
    });
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Tombol Kembali & Navigasi Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push("/dashboard/warehouses")}
            className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 p-0 h-auto gap-1 mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Gudang
          </Button>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {warehouse.name}
            </h1>
            <Badge variant="outline" className="font-mono text-xs bg-blue-50 text-blue-700 border-blue-200">
              {warehouse.code}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 flex items-center gap-1.5 pt-0.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" /> {warehouse.address} ({warehouse.city})
          </p>
        </div>

        {/* Ringkasan Statistik */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
            Terisi: {occupiedRacks} Rak
          </Badge>
          <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">
            Kosong: {emptyRacks} Rak
          </Badge>
          <Badge className="bg-blue-600 text-white">
            Utilisasi: {occupancyRate}%
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Layers className="h-5 w-5 text-blue-600" />
              Peta Visual Zonasi Rak Gudang
            </CardTitle>
            <CardDescription>
              🟢 Hijau = Terisi Stok | 🔴 Merah = Rak Kosong
            </CardDescription>
          </CardHeader>
          <CardContent>
            {warehouse.locations.length === 0 ? (
              <div className="p-10 text-center border border-dashed rounded-xl text-xs text-slate-400 bg-slate-50/50 dark:bg-slate-900/20">
                Belum ada data rak/lokasi terdaftar di database untuk gudang ini.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-[360px] overflow-y-auto pr-1">
                {warehouse.locations.map((loc) => {
                  const isSelected = selectedRack?.id === loc.id;
                  const isOccupied = loc.status === "OCCUPIED";
                  const skuCount = loc.items.length;

                  return (
                    <button
                      key={loc.id}
                      onClick={() => setSelectedRack(loc)}
                      className={`
                        relative h-24 rounded-xl p-3 flex flex-col justify-between items-start transition-all cursor-pointer border-2 text-left
                        ${isSelected ? "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-950" : ""}
                        ${
                          isOccupied
                            ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-900 dark:text-emerald-300 hover:bg-emerald-500/20"
                            : "bg-rose-500/5 border-rose-500/30 text-rose-900 dark:text-rose-400 hover:bg-rose-500/10"
                        }
                      `}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-bold font-mono truncate">{loc.aisleRackBin}</span>
                        <span
                          className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                            isOccupied ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                          }`}
                        />
                      </div>

                      {/* Tampilan Ringkas & Informatif Berbasis Jumlah SKU & Total Unit */}
                      <div className="w-full truncate">
                        {isOccupied ? (
                          <div className="space-y-0.5">
                            <p className="text-[10px] font-semibold truncate leading-tight text-emerald-700 dark:text-emerald-400">
                              {skuCount} {skuCount > 1 ? "Variasi SKU" : "Jenis Barang"}
                            </p>
                            <p className="text-[11px] font-mono font-bold text-slate-800 dark:text-slate-100">
                              {loc.totalItems} <span className="text-[9px] font-normal text-slate-500">Unit</span>
                            </p>
                          </div>
                        ) : (
                          <p className="text-[10px] font-semibold text-rose-600 dark:text-rose-400">KOSONG</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Panel Detail Rak Terpilih (Dilengkapi Tombol Mutasi & Audit) */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm h-fit">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              Detail Rak: {selectedRack?.aisleRackBin || "Pilih Rak"}
            </CardTitle>
            <CardDescription className="font-mono text-[11px]">
              Barcode: {selectedRack?.code || "-"}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {selectedRack ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-mono uppercase">Status Lokasi</span>
                  {selectedRack.status === "OCCUPIED" ? (
                    <Badge className="bg-emerald-600 text-white gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Terisi
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="gap-1">
                      <AlertCircle className="h-3 w-3" /> Kosong
                    </Badge>
                  )}
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Daftar Barang di Rak Ini ({selectedRack.totalItems} Unit):
                  </span>
                  
                  {selectedRack.items.length === 0 ? (
                    <div className="p-4 text-center border border-dashed rounded-xl text-xs text-slate-400 bg-slate-50 dark:bg-slate-900/40">
                      Rak ini kosong dan siap digunakan untuk alokasi inbound.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {selectedRack.items.map((item) => (
                        <div key={item.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800 text-xs space-y-2">
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-slate-900 dark:text-slate-100">{item.productName}</span>
                            <span className="font-mono font-semibold text-blue-600">{item.quantity} Unit</span>
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                            <span>SKU: {item.sku}</span>
                            <span>Batch: {item.batchNumber}</span>
                          </div>
                          
                          {/* Tombol Aksi Mutasi Stok per Item */}
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleOpenTransferModal(item, selectedRack.id, selectedRack.aisleRackBin)}
                            className="w-full h-7 text-[10px] gap-1 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/50 dark:text-blue-300 dark:hover:bg-blue-900/50 cursor-pointer"
                          >
                            <ArrowRightLeft className="w-3 h-3" /> Transfer / Pindah Stok
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <Button 
                    variant="outline" 
                    onClick={() => router.push(`/dashboard/audit-scan?code=${selectedRack.code}`)}
                    className="w-full text-xs h-9 rounded-xl gap-2 cursor-pointer"
                  >
                    <ShieldAlert className="h-3.5 w-3.5 text-blue-600" />
                    <span>Audit Rak Ini via QR Scanner</span>
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-xs text-slate-400 text-center py-8">Pilih salah satu kotak rak pada peta grid di samping.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bar Pencarian Rak Spesifik */}
      <Card>
        <CardContent className="p-4 flex items-center justify-between gap-3">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari berdasarkan kode rak atau nomor bin..."
              value={searchRack}
              onChange={(e) => setSearchRack(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
          <span className="text-xs text-slate-500 hidden sm:inline-block">
            Menampilkan {filteredLocations.length} dari {totalRacks} rak
          </span>
        </CardContent>
      </Card>

      {/* ======================================================== */}
      {/* 🔄 DIALOG MODAL MUTASI / TRANSFER STOK ANTAR RAK         */}
      {/* ======================================================== */}
      <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Transfer / Mutasi Stok Antar Rak</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmitTransfer} className="space-y-4 pt-2">
            {errorMessage && (
              <div className="p-3 text-xs bg-red-50 text-red-600 border border-red-200 rounded-md">
                {errorMessage}
              </div>
            )}

            {selectedStock && (
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Produk:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{selectedStock.productName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Rak Asal:</span>
                  <span className="font-mono font-medium text-slate-800 dark:text-slate-200">{selectedStock.sourceLocationName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Stok Tersedia:</span>
                  <span className="font-mono font-bold text-emerald-600">{selectedStock.maxQuantity} Unit</span>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium block mb-1">Pilih Rak Tujuan</label>
                <select
                  value={targetLocationId}
                  onChange={(e) => setTargetLocationId(e.target.value)}
                  required
                  className="w-full h-9 rounded-md border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 px-3 text-xs text-slate-900 dark:text-slate-100"
                >
                  <option value="" disabled>-- Pilih Rak Tujuan --</option>
                  {warehouse.locations
                    .filter((loc) => loc.id !== selectedStock?.sourceLocationId)
                    .map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.aisleRackBin} ({loc.status === "EMPTY" ? "Kosong" : `${loc.totalItems} items`})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium block mb-1">Jumlah Unit yang Dipindahkan</label>
                <Input
                  type="number"
                  min={1}
                  max={selectedStock?.maxQuantity || 1}
                  value={quantityToTransfer}
                  onChange={(e) => setQuantityToTransfer(parseInt(e.target.value) || 0)}
                  required
                  className="h-9 text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsTransferDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" size="sm" disabled={isPending} className="bg-blue-600 hover:bg-blue-500 text-white gap-1.5">
                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Konfirmasi Transfer
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}