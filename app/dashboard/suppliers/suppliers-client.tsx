"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSupplier, updateSupplier, deleteSupplier, SupplierInput } from "/app/actions/suppliers";
import { toast } from "sonner";
import { Building2, Plus, Search, Edit2, Trash2, Mail, Phone, MapPin, Loader2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SupplierItem {
  id: string;
  name: string;
  code: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  createdAt: Date;
  _count: {
    batches: number;
  };
}

interface Props {
  initialSuppliers: SupplierItem[];
}

export default function SuppliersClient({ initialSuppliers }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<SupplierItem | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const filteredSuppliers = initialSuppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase()) ||
      (s.email && s.email.toLowerCase().includes(search.toLowerCase()))
  );

  const handleOpenModal = (supplier?: SupplierItem) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setName(supplier.name);
      setCode(supplier.code);
      setEmail(supplier.email || "");
      setPhone(supplier.phone || "");
      setAddress(supplier.address || "");
    } else {
      setEditingSupplier(null);
      setName("");
      setCode(`SUP-${Math.floor(100 + Math.random() * 900)}`);
      setEmail("");
      setPhone("");
      setAddress("");
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) {
      toast.error("Form Belum Lengkap", { description: "Nama dan Kode Supplier wajib diisi." });
      return;
    }

    const payload: SupplierInput = { name, code, email, phone, address };

    startTransition(async () => {
      let res;
      if (editingSupplier) {
        res = await updateSupplier(editingSupplier.id, payload);
      } else {
        res = await createSupplier(payload);
      }

      if (res.success) {
        toast.success(editingSupplier ? "Supplier Diperbarui" : "Supplier Ditambahkan");
        setIsModalOpen(false);
        router.refresh();
      } else {
        toast.error("Gagal Menyimpan", { description: res.error });
      }
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus supplier "${name}"?`)) return;

    startTransition(async () => {
      const res = await deleteSupplier(id);
      if (res.success) {
        toast.success("Supplier Berhasil Dihapus");
        router.refresh();
      } else {
        toast.error("Gagal Menghapus", { description: res.error });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600" /> Manajemen Pemasok (Supplier)
          </h1>
          <p className="text-xs text-slate-500 pt-1">
            Kelola data mitra pemasok/vendor barang untuk integrasi transaksi Inbound gudang.
          </p>
        </div>
        <Button onClick={() => handleOpenModal()} size="sm" className="bg-blue-600 hover:bg-blue-500 text-white gap-1.5 cursor-pointer">
          <Plus className="w-4 h-4" /> Tambah Supplier
        </Button>
      </div>

      {/* Bar Pencarian */}
      <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari berdasarkan nama, kode, atau email supplier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabel Data Supplier */}
      <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/60">
          <CardTitle className="text-sm font-bold">Daftar Supplier</CardTitle>
          <CardDescription className="text-xs">Total {filteredSuppliers.length} supplier terdaftar.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {filteredSuppliers.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-400">Belum ada data supplier yang tersedia.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 uppercase text-[10px] font-semibold border-b border-slate-200 dark:border-slate-800">
                    <th className="py-3 px-4">Kode & Nama</th>
                    <th className="py-3 px-4">Kontak</th>
                    <th className="py-3 px-4">Alamat</th>
                    <th className="py-3 px-4 text-center">Total Inbound Batch</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredSuppliers.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 dark:text-slate-100 block">{s.name}</span>
                        <Badge variant="outline" className="font-mono text-[10px] mt-0.5">{s.code}</Badge>
                      </td>
                      <td className="py-3 px-4 space-y-1">
                        {s.email && (
                          <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                            <Mail className="w-3 h-3 text-slate-400" /> {s.email}
                          </div>
                        )}
                        {s.phone && (
                          <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                            <Phone className="w-3 h-3 text-slate-400" /> {s.phone}
                          </div>
                        )}
                        {!s.email && !s.phone && <span className="text-slate-400 italic">-</span>}
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-slate-600 dark:text-slate-400">
                        {s.address ? (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" /> {s.address}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                        <Badge variant="secondary" className="gap-1">
                          <Package className="w-3 h-3 text-blue-600" /> {s._count.batches} Batch
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer" onClick={() => handleOpenModal(s)}>
                            <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 cursor-pointer" onClick={() => handleDelete(s.id, s.name)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Form Tambah / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg max-w-md w-full p-6 space-y-4 shadow-xl">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {editingSupplier ? "Edit Supplier" : "Tambah Supplier Baru"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-medium block mb-1">Kode Supplier <span className="text-red-500">*</span></label>
                <Input value={code} onChange={(e) => setCode(e.target.value)} required className="h-9 font-mono" placeholder="SUP-001" />
              </div>
              <div>
                <label className="font-medium block mb-1">Nama Supplier / Perusahaan <span className="text-red-500">*</span></label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required className="h-9" placeholder="PT. Indofood Sukses Makmur" />
              </div>
              <div>
                <label className="font-medium block mb-1">Email Kontak</label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-9" placeholder="sales@indofood.com" />
              </div>
              <div>
                <label className="font-medium block mb-1">Nomor Telepon / WhatsApp</label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-9" placeholder="08123456789" />
              </div>
              <div>
                <label className="font-medium block mb-1">Alamat Kantor / Pabrik</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Jl. Raya Industri No. 12..."
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" size="sm" disabled={isPending} className="bg-blue-600 hover:bg-blue-500 text-white cursor-pointer">
                  {isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                  Simpan
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}