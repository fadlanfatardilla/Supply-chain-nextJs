"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { approveInboundTransaction, rejectInboundTransaction } from "@/app/actions/inbound";
import { toast } from "sonner";
import { ClipboardList, CheckCircle2, XCircle, Clock, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface InboundItemDetail {
  id: string;
  batchNumber: string;
  quantity: number;
  expiredAt: Date | null;
  product: {
    name: string;
    sku: string;
    unit: string;
  };
  location: {
    aisleRackBin: string;
    warehouse: {
      name: string;
    };
  };
}

interface InboundRecord {
  id: string;
  referenceNumber: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  notes: string | null;
  createdAt: Date;
  supplier: { name: string; code: string } | null;
  creator: { name: string } | null;
  approver: { name: string } | null;
  items: InboundItemDetail[];
}

interface Props {
  inboundList: InboundRecord[];
  userRole: string;
}

export default function InboundHistoryClient({ inboundList, userRole }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.push("/dashboard/inbound")}
          className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 p-0 h-auto gap-1 mb-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Form Inbound
        </Button>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-blue-600" /> Riwayat & Approval Transaksi Inbound
        </h1>
        <p className="text-xs text-slate-500 pt-1">
          Pantau status pengajuan barang masuk dan berikan persetujuan bagi manajer gudang sebelum stok resmi masuk ke rak.
        </p>
      </div>

      {/* Tabel Riwayat */}
      <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 pb-4">
          <CardTitle className="text-sm font-bold">Daftar Pengajuan Inbound Gudang</CardTitle>
          <CardDescription className="text-xs">Menampilkan seluruh transaksi masuk dari semua staf.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {inboundList.length === 0 ? (
            <div className="py-16 text-center text-sm text-slate-400">
              Belum ada riwayat transaksi inbound.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                  <tr>
                    <th className="p-3.5">No. Referensi / Tanggal</th>
                    <th className="p-3.5">Supplier & Pembuat</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Detail Barang & Rak Tujuan</th>
                    <th className="p-3.5 text-right">Aksi Manajer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                  {inboundList.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                      <td className="p-3.5 align-top">
                        <div className="font-mono font-bold text-slate-900 dark:text-slate-100">{item.referenceNumber}</div>
                        <div className="text-[11px] text-slate-400 pt-0.5">
                          {new Date(item.createdAt).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>
                      <td className="p-3.5 align-top">
                        <div className="font-medium text-slate-800 dark:text-slate-200">{item.supplier?.name || "Supplier Umum"}</div>
                        <div className="text-[11px] text-slate-400 pt-0.5">Staf: {item.creator?.name || "System"}</div>
                      </td>
                      <td className="p-3.5 align-top">
                        {item.status === "PENDING" && (
                          <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 flex items-center gap-1 w-fit">
                            <Clock className="w-3 h-3" /> Pending
                          </Badge>
                        )}
                        {item.status === "APPROVED" && (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3" /> Approved ({item.approver?.name || "Manager"})
                          </Badge>
                        )}
                        {item.status === "REJECTED" && (
                          <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 flex items-center gap-1 w-fit">
                            <XCircle className="w-3 h-3" /> Rejected
                          </Badge>
                        )}
                      </td>
                      <td className="p-3.5 align-top space-y-1">
                        {item.items.map((i, idx) => (
                          <div key={idx} className="text-slate-600 dark:text-slate-400">
                            • <strong className="text-slate-800 dark:text-slate-200">{i.product.name}</strong> — {i.quantity} {i.product.unit} (Batch: <span className="font-mono">{i.batchNumber}</span>) <br />
                            <span className="text-[11px] text-slate-400">Rak: {i.location.warehouse.name} [{i.location.aisleRackBin}]</span>
                          </div>
                        ))}
                      </td>
                      <td className="p-3.5 align-top text-right">
                        {item.status === "PENDING" && canApprove ? (
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
                          <span className="text-[11px] text-slate-400 italic">
                            {item.status === "PENDING" ? "Menunggu Manajer" : "Selesai"}
                          </span>
                        )}
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