"use client";

import { useState, useTransition, useEffect } from "react";
import { createProduct, updateProduct, deleteProduct } from "@/app/actions/products";
import { toast } from "sonner";
import { 
  Plus, 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Edit,
  Trash2,
  Loader2,
  RotateCcw,
  ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSearchParams } from "next/navigation";

interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  unit: string;
  warehouse: string;
  status: string;
}

interface LocationOption {
  id: string;
  name: string;
}

interface ProductsClientProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string;
  };
  initialProducts: Product[];
  locations: LocationOption[];
}

export default function ProductsClient({ user, initialProducts, locations }: ProductsClientProps) {
  const searchParams = useSearchParams();
  const urlSearchQuery = searchParams.get("search") || "";

  // Inisialisasi searchTerm dari URL jika ada pencarian global dari navbar
  const [searchTerm, setSearchTerm] = useState(urlSearchQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  
  // Sinkronisasi jika URL berubah saat mengetik dari navbar
  useEffect(() => {
    if (urlSearchQuery) {
      setSearchTerm(urlSearchQuery);
    }
  }, [urlSearchQuery]);
  
  // State Modal Dialogs
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // State Selected Items
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Daftar Kategori Unik
  const categoriesList = Array.from(
    new Set(initialProducts.map((p) => p.category).filter(Boolean))
  );

  // Logika Pemfilteran Ganda
  const filteredProducts = initialProducts.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "ALL" || p.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Handler Submit Form Tambah Produk
  const handleSubmitProduct = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    const formData = new FormData(e.currentTarget);
    const inputData = {
      sku: formData.get("sku") as string,
      name: formData.get("name") as string,
      category: formData.get("category") as string,
      stock: Number(formData.get("stock")),
      minStock: Number(formData.get("minStock")),
      unit: formData.get("unit") as string,
      warehouseId: formData.get("warehouseId") as string,
    };

    startTransition(async () => {
      const result = await createProduct(inputData);

      if (result.success) {
        setIsDialogOpen(false);
        toast.success("Produk Berhasil Ditambahkan", {
          description: `SKU [${inputData.sku}] berhasil disimpan ke dalam sistem WMS.`,
          duration: 4000,
        });
      } else {
        setErrorMessage(result.error || "Gagal menyimpan produk.");
      }
    });
  };

  // Handler Submit Form Edit Produk
  const handleUpdateProduct = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingProduct) return;
    setErrorMessage(null);

    const formData = new FormData(e.currentTarget);
    const updateData = {
      id: editingProduct.id,
      name: formData.get("name") as string,
      category: formData.get("category") as string,
      minStock: Number(formData.get("minStock")),
      unit: formData.get("unit") as string,
    };

    startTransition(async () => {
      const result = await updateProduct(updateData);

      if (result.success) {
        setIsEditDialogOpen(false);
        setEditingProduct(null);
        toast.success("Produk Berhasil Diperbarui", {
          description: `Data master produk berhasil diperbarui.`,
          duration: 4000,
        });
      } else {
        setErrorMessage(result.error || "Gagal memperbarui produk.");
      }
    });
  };

  // Handler Buka Modal Konfirmasi Hapus
  const handleOpenDeleteModal = (product: Product) => {
    setDeletingProduct(product);
    setErrorMessage(null);
    setIsDeleteDialogOpen(true);
  };

  // Handler Eksekusi Hapus Produk
  const handleConfirmDelete = () => {
    if (!deletingProduct) return;

    startTransition(async () => {
      const result = await deleteProduct(deletingProduct.id);
      if (result.success) {
        setIsDeleteDialogOpen(false);
        setDeletingProduct(null);
        toast.success("Produk Berhasil Dihapus", {
          description: `SKU ${deletingProduct.sku} telah dihapus dari sistem.`,
        });
      } else {
        setErrorMessage(result.error || "Gagal menghapus produk.");
        toast.error("Gagal Menghapus Produk", {
          description: result.error,
        });
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
              Master Produk
            </h1>
            <Badge 
              variant="outline" 
              className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 text-[11px] font-mono tracking-wide px-2 py-0.5 uppercase"
            >
              {user.role} ACCESS
            </Badge>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Pengelolaan katalog SKU, penentuan batas minimum stok, dan alokasi gudang.
          </p>
        </div>

        {/* Tombol & Dialog Tambah Produk */}
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => { setErrorMessage(null); setIsDialogOpen(true); }}
            className="bg-blue-600 hover:bg-blue-500 text-white gap-2 shadow-sm cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Tambah Produk Baru
          </Button>

          {/* Modal Dialog Tambah Produk */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Tambah Produk Baru</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmitProduct} className="space-y-4 pt-2">
                {errorMessage && (
                  <div className="p-3 text-xs bg-red-50 text-red-600 border border-red-200 rounded-md">
                    {errorMessage}
                  </div>
                )}

                <div className="grid gap-3">
                  <div>
                    <label className="text-xs font-medium">Kode SKU</label>
                    <Input name="sku" placeholder="misal: SKU-BEV-001" required className="h-9 text-xs mt-1 font-mono" />
                  </div>

                  <div>
                    <label className="text-xs font-medium">Nama Produk</label>
                    <Input name="name" placeholder="misal: Kopi Arabika 500g" required className="h-9 text-xs mt-1" />
                  </div>

                  <div>
                    <label className="text-xs font-medium">Kategori</label>
                    <select
                      name="category"
                      required
                      defaultValue=""
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm mt-1"
                    >
                      <option value="" disabled>-- Pilih Kategori Produk --</option>
                      <option value="Makanan & Minuman">Makanan & Minuman</option>
                      <option value="Elektronik">Elektronik</option>
                      <option value="Bahan Baku">Bahan Baku</option>
                      <option value="Barang Umum">Barang Umum</option>
                      <option value="Logistik & Kemasan">Logistik & Kemasan</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium">Stok Awal</label>
                      <Input name="stock" type="number" defaultValue={0} min={0} required className="h-9 text-xs mt-1 font-mono" />
                    </div>
                    <div>
                      <label className="text-xs font-medium">Batas Min. Stok</label>
                      <Input name="minStock" type="number" defaultValue={10} min={0} required className="h-9 text-xs mt-1 font-mono" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium">Lokasi / Rak Gudang Penempatan</label>
                    <select
                      name="warehouseId"
                      required
                      defaultValue=""
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm mt-1"
                    >
                      <option value="" disabled>-- Pilih Gudang & Rak Penempatan --</option>
                      {locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium">Satuan Unit</label>
                    <select
                      name="unit"
                      required
                      defaultValue="pcs"
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm mt-1 font-mono"
                    >
                      <option value="pcs">PCS (Pieces)</option>
                      <option value="karton">Karton</option>
                      <option value="box">Box</option>
                      <option value="pouch">Pouch</option>
                      <option value="kg">Kg (Kilogram)</option>
                      <option value="liter">Liter</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit" size="sm" disabled={isPending} className="bg-blue-600 hover:bg-blue-500 text-white">
                    {isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                    Simpan Produk
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Modal Dialog Edit Produk */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Master Produk</DialogTitle>
          </DialogHeader>

          {editingProduct && (
            <form onSubmit={handleUpdateProduct} className="space-y-4 pt-2">
              {errorMessage && (
                <div className="p-3 text-xs bg-red-50 text-red-600 border border-red-200 rounded-md">
                  {errorMessage}
                </div>
              )}

              <div className="grid gap-3">
                <div>
                  <label className="text-xs font-medium">Kode SKU (Tidak dapat diubah)</label>
                  <Input value={editingProduct.sku} disabled className="h-9 text-xs mt-1 font-mono bg-slate-100 dark:bg-slate-800" />
                </div>

                <div>
                  <label className="text-xs font-medium">Nama Produk</label>
                  <Input name="name" defaultValue={editingProduct.name} required className="h-9 text-xs mt-1" />
                </div>

                <div>
                  <label className="text-xs font-medium">Kategori</label>
                  <select
                    name="category"
                    required
                    defaultValue={editingProduct.category}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm mt-1"
                  >
                    <option value="Makanan & Minuman">Makanan & Minuman</option>
                    <option value="Elektronik">Elektronik</option>
                    <option value="Bahan Baku">Bahan Baku</option>
                    <option value="Barang Umum">Barang Umum</option>
                    <option value="Logistik & Kemasan">Logistik & Kemasan</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium">Batas Min. Stok (Alert)</label>
                  <Input name="minStock" type="number" defaultValue={editingProduct.minStock} min={0} required className="h-9 text-xs mt-1 font-mono" />
                </div>

                <div>
                  <label className="text-xs font-medium">Satuan Unit</label>
                  <select
                    name="unit"
                    required
                    defaultValue={editingProduct.unit}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm mt-1 font-mono"
                  >
                    <option value="pcs">PCS (Pieces)</option>
                    <option value="karton">Karton</option>
                    <option value="box">Box</option>
                    <option value="pouch">Pouch</option>
                    <option value="kg">Kg (Kilogram)</option>
                    <option value="liter">Liter</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsEditDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" size="sm" disabled={isPending} className="bg-blue-600 hover:bg-blue-500 text-white">
                  {isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                  Simpan Perubahan
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Dialog Hapus Produk */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader className="flex flex-col items-center text-center space-y-3 pt-2">
            <div className="p-3 bg-red-100 text-red-600 rounded-full dark:bg-red-950/50 dark:text-red-400">
              <ShieldAlert className="h-7 w-7" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Hapus Produk Ini?
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-1">
                Tindakan ini tidak dapat dibatalkan. Produk akan dihapus permanen dari katalog master WMS.
              </DialogDescription>
            </div>
          </DialogHeader>

          {deletingProduct && (
            <div className="space-y-3 py-2">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Nama Produk:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{deletingProduct.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">SKU:</span>
                  <span className="font-mono font-medium text-blue-600 dark:text-blue-400">{deletingProduct.sku}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Sisa Stok Fisik:</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                    {deletingProduct.stock} {deletingProduct.unit}
                  </span>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 text-xs bg-red-50 text-red-600 border border-red-200 rounded-lg">
                  {errorMessage}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex sm:justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isPending}
              className="w-full sm:w-auto"
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleConfirmDelete}
              disabled={isPending}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white gap-1.5"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Ya, Hapus Produk
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Filter & Bar Pencarian */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari berdasarkan SKU, Nama, atau Kategori..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <div className="relative flex-1 sm:w-56">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background pl-8 pr-3 py-1 text-xs shadow-sm cursor-pointer"
              >
                <option value="ALL">Semua Kategori ({initialProducts.length})</option>
                {categoriesList.map((cat) => {
                  const count = initialProducts.filter((p) => p.category === cat).length;
                  return (
                    <option key={cat} value={cat}>
                      {cat} ({count})
                    </option>
                  );
                })}
              </select>
            </div>

            {(selectedCategory !== "ALL" || searchTerm) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedCategory("ALL");
                  setSearchTerm("");
                }}
                className="h-9 px-2.5 text-xs text-slate-500 hover:text-slate-900 gap-1"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabel Master Produk */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Daftar Produk Aktif</CardTitle>
          <CardDescription className="text-xs">
            Menampilkan {filteredProducts.length} dari {initialProducts.length} produk terdaftar dalam katalog Stokio WMS.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU & Produk</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Status Stok</TableHead>
                <TableHead>Min. Stok</TableHead>
                <TableHead>Lokasi Utama</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-xs text-slate-400">
                    Tidak ada produk yang cocok dengan pencarian / filter kategori.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => {
                  const isOut = product.stock === 0;
                  const isLow = product.stock > 0 && product.stock < 100;
                  const isWarning = product.stock >= 100 && product.stock <= 200;

                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                            {product.name}
                          </span>
                          <span className="font-mono text-xs text-slate-500">
                            {product.sku}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 dark:text-slate-400">
                        <Badge variant="outline" className="font-normal text-[11px]">
                          {product.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {isOut ? (
                            <Badge variant="destructive" className="gap-1 text-[10px]">
                              <XCircle className="w-3 h-3" /> Habis (0)
                            </Badge>
                          ) : isLow ? (
                            <Badge variant="destructive" className="gap-1 text-[10px]">
                              <XCircle className="w-3 h-3" /> Rendah ({product.stock} {product.unit})
                            </Badge>
                          ) : isWarning ? (
                            <Badge className="bg-amber-500/10 text-amber-600 border border-amber-500/25 hover:bg-amber-500/20 gap-1 text-[10px]">
                              <AlertTriangle className="w-3 h-3" /> Menipis ({product.stock} {product.unit})
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 gap-1 text-[10px]">
                              <CheckCircle2 className="w-3 h-3" /> Aman ({product.stock} {product.unit})
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {product.minStock} {product.unit}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 dark:text-slate-400">
                        {product.warehouse}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Tombol Edit */}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => {
                              setEditingProduct(product);
                              setErrorMessage(null);
                              setIsEditDialogOpen(true);
                            }}
                            className="h-8 w-8 text-slate-500 hover:text-blue-600 cursor-pointer"
                            title="Edit Produk"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>

                          {/* Tombol Hapus */}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleOpenDeleteModal(product)}
                            className="h-8 w-8 text-slate-500 hover:text-red-600 cursor-pointer"
                            title="Hapus Produk"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}