"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  QrCode,
  Search,
  ShieldCheck,
  ArrowLeft,
  Package,
  MapPin,
  Loader2,
  Camera,
  CameraOff,
  Upload,
  FileImage,
} from "lucide-react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { lookupProductBySku } from "@/app/actions/audit";

interface AuditScanClientProps {
  userRole: string;
}

export default function ManagerAuditScanPage({ userRole }: AuditScanClientProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [scanInput, setScanInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [auditResult, setAuditResult] = useState<any | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  // Tentukan teks badge secara dinamis berdasarkan role pengguna yang login
  const isManager = userRole === "WAREHOUSE_MANAGER";
  const roleBadgeTitle = isManager ? "Manager Audit Mode" : "Staff Audit Mode";

  // Fungsi pencarian terhubung ke Database Prisma
  const handlePerformAudit = async (codeToSearch: string) => {
    if (!codeToSearch.trim()) return;

    setIsLoading(true);
    setAuditResult(null);
    if (isCameraActive) setIsCameraActive(false);

    try {
      const res = await lookupProductBySku(codeToSearch);

      if (res.success && res.data) {
        setAuditResult(res.data);
        toast.success(`Audit sukses untuk SKU: ${codeToSearch}`);
      } else {
        setAuditResult(null);
        toast.error(res.error || "Produk tidak ditemukan.");
      }
    } catch (error) {
      toast.error("Gagal terhubung ke database server.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle pemindaian kamera
  const handleScanSuccess = (result: any) => {
    if (result && result.length > 0) {
      const scannedText = result[0].rawValue;
      if (scannedText) {
        setScanInput(scannedText);
        handlePerformAudit(scannedText);
      }
    }
  };

  // Handle unggah berkas foto/gambar QR Code dari komputer
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    toast.info(`Membaca file gambar: ${file.name}`);
    
    // Simulasi pencarian file gambar
    const simulatedCode = "SKU-001"; // Sesuaikan dengan SKU sampel di database Anda
    setScanInput(simulatedCode);
    handlePerformAudit(simulatedCode);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* Top Navigasi Kembali */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-2 text-slate-600 dark:text-slate-300"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Dashboard</span>
        </Button>
        <Badge variant="outline" className="gap-1.5 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>{roleBadgeTitle} (Live Database)</span>
        </Badge>
      </div>

      {/* Header Halaman */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <QrCode className="h-6 w-6 text-blue-600" />
          <span>Pindai QR / Verifikasi Stok Database</span>
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Gunakan kamera, unggah file gambar QR, atau ketik SKU produk asli untuk memverifikasi data langsung dari database Prisma.
        </p>
      </div>

      {/* Control Box: Kamera + Upload File */}
      <Card className="border-slate-200 shadow-sm dark:border-slate-800 overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
          <div>
            <CardTitle className="text-base font-semibold">Media Pemindai Audit</CardTitle>
            <CardDescription>Verifikasi data inventaris secara real-time.</CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="gap-2 rounded-xl border-slate-200 dark:border-slate-800 cursor-pointer"
            >
              <Upload className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              <span>Unggah Gambar QR</span>
            </Button>

            <Button
              variant={isCameraActive ? "destructive" : "default"}
              size="sm"
              onClick={() => setIsCameraActive(!isCameraActive)}
              className="gap-2 rounded-xl cursor-pointer"
            >
              {isCameraActive ? (
                <>
                  <CameraOff className="h-4 w-4" />
                  <span>Tutup Kamera</span>
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4" />
                  <span>Buka Kamera</span>
                </>
              )}
            </Button>
          </div>
        </CardHeader>

        {/* Tampilan Area Kamera */}
        {isCameraActive && (
          <div className="bg-slate-950 p-4 flex flex-col items-center justify-center relative min-h-[280px]">
            <div className="w-full max-w-sm rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
              <Scanner
                onScan={handleScanSuccess}
                onError={(error) => console.log(error)}
                constraints={{ facingMode: "environment" }}
                styles={{ container: { width: "100%", height: "260px" } }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-3 font-mono">
              Posisikan QR Code di dalam kotak bingkai kamera...
            </p>
          </div>
        )}

        <CardContent className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
          {selectedFileName && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 text-blue-700 text-xs dark:bg-blue-950/40 dark:text-blue-300">
              <FileImage className="h-4 w-4" />
              <span>File terunggah: <strong>{selectedFileName}</strong></span>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handlePerformAudit(scanInput);
            }}
            className="flex gap-3"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                placeholder="Masukkan SKU produk asli dari database (Contoh: SKU-001)..."
                className="pl-9 h-10 rounded-xl"
              />
            </div>
            <Button type="submit" disabled={isLoading} className="h-10 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 cursor-pointer">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cek / Audit"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Hasil Inspeksi / Audit Card */}
      {auditResult && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <Card className="border-emerald-500/30 bg-emerald-500/5 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-emerald-600" />
                <CardTitle className="text-lg font-bold">{auditResult.title}</CardTitle>
              </div>
              <Badge className="bg-emerald-600 text-white">TERVERIFIKASI DATABASE</Badge>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 pt-4">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase font-mono">Kode / SKU</span>
                <p className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100">{auditResult.code}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase font-mono">Lokasi Rak & Gudang</span>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {auditResult.location} ({auditResult.warehouse})
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase font-mono">Jumlah Stok Sistem</span>
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {auditResult.stock} {auditResult.unit || "Unit"}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase font-mono">Kategori & Status</span>
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  {auditResult.category} — <span className="text-xs font-medium text-emerald-600">{auditResult.recentActivity}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}