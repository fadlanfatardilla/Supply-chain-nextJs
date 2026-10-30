"use client";

import { useState, useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { 
  QrCode, 
  Camera, 
  Search, 
  PackageCheck, 
  AlertCircle, 
  RefreshCw, 
  CheckCircle2, 
  Box, 
  ArrowRight 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ScanClientProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string;
  };
}

interface ScannedProduct {
  sku: string;
  name: string;
  category: string;
  stock: number;
  unit: string;
  location: string;
  status: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
}

// Data sampel produk terdaftar
const sampleProductsDatabase: Record<string, ScannedProduct> = {
  "SKU-BEV-001": {
    sku: "SKU-BEV-001",
    name: "Kopi Arabika Premium 500g",
    category: "Minuman & Makanan",
    stock: 450,
    unit: "Pouch",
    location: "Gudang Utama - Rak A-01",
    status: "IN_STOCK",
  },
  "SKU-ELEC-014": {
    sku: "SKU-ELEC-014",
    name: "Barcode Scanner Wireless",
    category: "Elektronik & Alat",
    stock: 12,
    unit: "Unit",
    location: "Gudang Surabaya - Rak B-01",
    status: "LOW_STOCK",
  },
};

export default function ScanClient({ user }: ScanClientProps) {
  const [manualSku, setManualSku] = useState("");
  const [scannedResult, setScannedResult] = useState<ScannedProduct | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // Inisialisasi Kamera HTML5 QR Code
  useEffect(() => {
    if (isScanning) {
      const scanner = new Html5QrcodeScanner(
        "reader",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          rememberLastUsedCamera: true,
        },
        /* verbose= */ false
      );

      scanner.render(
        (decodedText) => {
          handleLookupSku(decodedText);
          scanner.clear();
          setIsScanning(false);
        },
        () => {
          // Callback saat pencarian frame QR belum/gagal terdeteksi
        }
      );

      scannerRef.current = scanner;

      return () => {
        scanner.clear().catch(() => {});
      };
    }
  }, [isScanning]);

  const handleLookupSku = (code: string) => {
    setErrorMsg(null);
    const cleanCode = code.trim().toUpperCase();
    
    if (sampleProductsDatabase[cleanCode]) {
      setScannedResult(sampleProductsDatabase[cleanCode]);
    } else {
      setScannedResult(null);
      setErrorMsg(`Produk dengan SKU/QR "${cleanCode}" tidak ditemukan di sistem.`);
    }
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualSku) {
      handleLookupSku(manualSku);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Scanner QR & Barcode
            </h1>
            <Badge
              variant="outline"
              className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20 text-[11px] font-mono tracking-wide px-2 py-0.5 uppercase"
            >
              {user.role}
            </Badge>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Pindai QR Code / Barcode pada kemasan barang untuk verifikasi stok dan lokasi rak secara cepat.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Kolom Kiri: Kamera Scanner & Input Manual */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Camera className="h-4 w-4 text-blue-600" />
                Pemindai Kamera
              </CardTitle>
              <CardDescription className="text-xs">
                Gunakan kamera perangkat untuk memindai label barang secara langsung.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isScanning ? (
                <div className="space-y-3">
                  <div id="reader" className="overflow-hidden rounded-lg border bg-black"></div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      scannerRef.current?.clear().catch(() => {});
                      setIsScanning(false);
                    }}
                    className="w-full text-xs"
                  >
                    Batal Pindai
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg bg-slate-50 dark:bg-slate-900/50 text-center space-y-3">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/40 text-blue-600 rounded-full">
                    <QrCode className="h-8 w-8" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Kamera Pemindai Nonaktif
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Klik tombol di bawah untuk mengaktifkan akses kamera.
                    </p>
                  </div>
                  <Button
                    onClick={() => setIsScanning(true)}
                    className="bg-blue-600 hover:bg-blue-500 text-white gap-2 shadow-sm text-xs"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    Aktifkan Kamera Scanner
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Input Manual SKU */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Atau Input Kode SKU Manual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleManualSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    placeholder="Contoh: SKU-BEV-001"
                    value={manualSku}
                    onChange={(e) => setManualSku(e.target.value)}
                    className="pl-8 h-9 text-xs"
                  />
                </div>
                <Button type="submit" size="sm" className="gap-1.5 text-xs">
                  Cari SKU
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Kolom Kanan: Hasil Pemindaian / Detail Barang */}
        <div className="space-y-4">
          <Card className="h-full flex flex-col justify-between">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <PackageCheck className="h-4 w-4 text-emerald-600" />
                Hasil Identifikasi Barang
              </CardTitle>
              <CardDescription className="text-xs">
                Informasi detail produk, posisi stok, dan lokasi penyimpanan rak.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              {scannedResult ? (
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    SKU Berhasil Ditemukan!
                  </div>

                  <div className="space-y-3">
                    <div>
                      <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                        Kode SKU
                      </span>
                      <p className="text-base font-bold font-mono text-slate-900 dark:text-slate-100">
                        {scannedResult.sku}
                      </p>
                    </div>

                    <div>
                      <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                        Nama Produk
                      </span>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {scannedResult.name}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                      <div>
                        <span className="text-[10px] text-slate-500">Kategori</span>
                        <p className="text-xs font-medium">{scannedResult.category}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500">Jumlah Stok</span>
                        <p className="text-xs font-medium">
                          {scannedResult.stock} {scannedResult.unit}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <span className="text-[10px] text-slate-500">Lokasi Rak Utama</span>
                      <p className="text-xs font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1.5 mt-0.5">
                        <Box className="h-3.5 w-3.5" />
                        {scannedResult.location}
                      </p>
                    </div>
                  </div>
                </div>
              ) : errorMsg ? (
                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 flex items-start gap-2.5 text-red-700 dark:text-red-400 text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              ) : (
                <div className="h-48 flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
                  <QrCode className="h-10 w-10 stroke-1" />
                  <p className="text-xs">
                    Belum ada data barang terindeks. Pindai kode atau masukkan SKU untuk menampilkan detail.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}