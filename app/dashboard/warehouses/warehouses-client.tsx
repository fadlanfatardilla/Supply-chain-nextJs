"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createWarehouse, createLocation } from "@/app/actions/warehouses";
import { toast } from "sonner";
import { 
  Building2, 
  Plus, 
  MapPin, 
  Layers, 
  Search, 
  CheckCircle2, 
  Loader2,
  Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface RackItem {
  id: string;
  code: string;
  aisleRackBin: string;
  category: string;
  itemsCount: number;
  capacity: string;
}

interface WarehouseItem {
  id: string;
  name: string;
  code: string;
  address: string;
  capacity: string;
  totalRacks: number;
  status: string;
  racks: RackItem[];
}

interface WarehousesClientProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string;
  };
  initialWarehouses: WarehouseItem[];
}

export default function WarehousesClient({ user, initialWarehouses }: WarehousesClientProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [isWarehouseDialogOpen, setIsWarehouseDialogOpen] = useState(false);
  const [isRackDialogOpen, setIsRackDialogOpen] = useState(false);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filter gudang berdasarkan nama, kode, atau kota
  const filteredWarehouses = initialWarehouses.filter((wh) =>
    wh.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wh.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wh.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handler Submit Tambah Gudang Baru
  const handleSubmitWarehouse = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      code: formData.get("code") as string,
      name: formData.get("name") as string,
      city: formData.get("city") as string,
      address: formData.get("address") as string,
    };

    startTransition(async () => {
      const result = await createWarehouse(data);
      if (result.success) {
        setIsWarehouseDialogOpen(false);
        toast.success("Gudang Berhasil Ditambahkan", {
          description: `Gudang [${data.code}] - ${data.name} berhasil disimpan ke sistem.`,
        });
      } else {
        setErrorMessage(result.error || "Gagal menyimpan gudang.");
      }
    });
  };

  // Handler Submit Tambah Rak/Lokasi Baru
  const handleSubmitRack = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      warehouseId: selectedWarehouseId,
      aisleRackBin: formData.get("aisleRackBin") as string,
      code: formData.get("code") as string,
    };

    startTransition(async () => {
      const result = await createLocation(data);
      if (result.success) {
        setIsRackDialogOpen(false);
        toast.success("Lokasi Rak Berhasil Ditambahkan", {
          description: `Rak ${data.aisleRackBin} berhasil ditambahkan ke gudang.`,
        });
      } else {
        setErrorMessage(result.error || "Gagal menyimpan rak.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Manajemen Gudang & Zonasi Rak
            </h1>
            <Badge 
              variant="outline" 
              className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 text-[11px] font-mono tracking-wide px-2 py-0.5 uppercase"
            >
              {user.role} ACCESS
            </Badge>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Pengelolaan multi-gudang, penataan struktur lorong/rak (Aisle, Rack, Bin), dan kapasitas penyimpanan.
          </p>
        </div>

        {/* Tombol Tambah Gudang Baru */}
        <Button 
          type="button"
          onClick={() => { 
            setErrorMessage(null); 
            setIsWarehouseDialogOpen(true); 
          }}
          className="bg-blue-600 hover:bg-blue-500 text-white gap-2 shadow-sm cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Tambah Gudang Baru
        </Button>
      </div>

      {/* Bar Pencarian */}
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari berdasarkan nama atau kode gudang..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* Grid Daftar Gudang */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredWarehouses.map((wh) => {
          // Hitung kapasitas secara dinamis berdasarkan jumlah rak aktif yang terisi item
          const totalRacks = wh.totalRacks || wh.racks.length;
          const occupiedRacks = wh.racks.filter((r) => r.itemsCount > 0).length;
          const occupancyRate = totalRacks > 0 ? Math.round((occupiedRacks / totalRacks) * 100) : 0;

          const isCritical = occupancyRate > 85;
          const isWarning = occupancyRate > 60 && occupancyRate <= 85;

          return (
            <Card key={wh.id} className="border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between transition-all duration-200 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md group">
              <div>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded-lg">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
                          {wh.name}
                        </CardTitle>
                        <span className="font-mono text-xs text-slate-500">
                          Kode: {wh.code}
                        </span>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                      {wh.status}
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center gap-1.5 text-xs mt-2 text-slate-600 dark:text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {wh.address}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 pt-0">
                  <div className="space-y-2.5 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Kapasitas Penyimpanan</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {occupancyRate}% <span className="text-[10px] font-normal text-slate-400">({totalRacks} Rak Aktif)</span>
                      </span>
                    </div>

                    {/* Progress Bar Dinamis */}
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCritical 
                            ? "bg-red-500" 
                            : isWarning 
                            ? "bg-amber-500" 
                            : "bg-emerald-500"
                        }`}
                        style={{ width: `${occupancyRate}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                      <span>0%</span>
                      <span className={`font-medium ${
                        isCritical 
                          ? "text-red-600 dark:text-red-400" 
                          : isWarning 
                          ? "text-amber-600 dark:text-amber-400" 
                          : "text-emerald-600 dark:text-emerald-400"
                      }`}>
                        {isCritical ? "Kritis: Hampir Penuh" : isWarning ? "Perhatian: Menengah" : "Optimal / Aman"}
                      </span>
                      <span>100%</span>
                    </div>
                  </div>

                  {/* Daftar Rak di Gudang Ini */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-slate-400" /> Daftar Rak / Zonasi Aktif
                      </span>
                      <Button 
                        type="button"
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          setSelectedWarehouseId(wh.id);
                          setErrorMessage(null);
                          setIsRackDialogOpen(true);
                        }}
                        className="h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Tambah Rak
                      </Button>
                    </div>

                    {wh.racks.length === 0 ? (
                      <div className="p-4 text-center border border-dashed rounded-lg text-xs text-slate-400">
                        Belum ada rak/lokasi terdaftar di gudang ini.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                        {wh.racks.map((rack) => (
                          <div key={rack.id} className="flex items-center justify-between p-2 rounded-md bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-medium text-slate-900 dark:text-slate-100">
                                {rack.aisleRackBin}
                              </span>
                              <span className="text-[10px] text-slate-400">({rack.code})</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-slate-500">{rack.itemsCount} pcs</span>
                              <Badge variant="secondary" className="text-[10px] font-mono">
                                {rack.capacity}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </div>

              {/* Tombol Navigasi ke Halaman Detail Spesifik per Gudang */}
              <div className="p-4 pt-2 border-t border-slate-100 dark:border-slate-800/60 mt-4">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/dashboard/warehouses/${wh.id}`)}
                  className="w-full h-8 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 gap-1.5 cursor-pointer"
                >
                  Kelola Detail & Semua Rak Gudang →
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Modal Dialog: Tambah Gudang Baru */}
      <Dialog open={isWarehouseDialogOpen} onOpenChange={setIsWarehouseDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Tambah Gudang Baru</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmitWarehouse} className="space-y-4 pt-2">
            {errorMessage && (
              <div className="p-3 text-xs bg-red-50 text-red-600 border border-red-200 rounded-md">
                {errorMessage}
              </div>
            )}

            <div className="grid gap-3">
              <div>
                <label className="text-xs font-medium">Kode Gudang</label>
                <Input name="code" placeholder="misal: BDG-01 atau JOG-01" required className="h-9 text-xs mt-1 font-mono" />
              </div>

              <div>
                <label className="text-xs font-medium">Nama Gudang</label>
                <Input name="name" placeholder="misal: Gudang Cabang Bandung" required className="h-9 text-xs mt-1" />
              </div>

              <div>
                <label className="text-xs font-medium">Kota</label>
                <Input name="city" placeholder="misal: Bandung / Yogyakarta" required className="h-9 text-xs mt-1" />
              </div>

              <div>
                <label className="text-xs font-medium">Alamat Lengkap</label>
                <Input name="address" placeholder="misal: Jl. Soekarno-Hatta No. 123" className="h-9 text-xs mt-1" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsWarehouseDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" size="sm" disabled={isPending} className="bg-blue-600 hover:bg-blue-500 text-white">
                {isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                Simpan Gudang
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Dialog: Tambah Rak/Lokasi ke Gudang */}
      <Dialog open={isRackDialogOpen} onOpenChange={setIsRackDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Tambah Lokasi Rak Gudang</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmitRack} className="space-y-4 pt-2">
            {errorMessage && (
              <div className="p-3 text-xs bg-red-50 text-red-600 border border-red-200 rounded-md">
                {errorMessage}
              </div>
            )}

            <div className="grid gap-3">
              <div>
                <label className="text-xs font-medium">Nama/Format Rak (Aisle-Rack-Bin)</label>
                <Input name="aisleRackBin" placeholder="misal: Rak-A-01-B" required className="h-9 text-xs mt-1 font-mono" />
              </div>

              <div>
                <label className="text-xs font-medium">Kode Barcode / QR Unik Rak</label>
                <Input name="code" placeholder="misal: WH1-RAK-A01-B" required className="h-9 text-xs mt-1 font-mono" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsRackDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" size="sm" disabled={isPending} className="bg-blue-600 hover:bg-blue-500 text-white">
                {isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                Simpan Rak
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}