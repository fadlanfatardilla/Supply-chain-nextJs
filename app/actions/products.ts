"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface CreateProductInput {
  sku: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  unit: string;
  warehouseId?: string;
}

export interface UpdateProductInput {
  id: string;
  name: string;
  category: string;
  minStock: number;
  unit: string;
}

export async function updateProduct(data: UpdateProductInput) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return { success: false, error: "Sesi tidak valid, silakan login kembali." };
    }

    const userRole = (session.user.role || "").toUpperCase();
    if (!["WAREHOUSE_MANAGER", "SUPER_ADMIN"].includes(userRole)) {
      return { success: false, error: "Akses ditolak. Anda tidak memiliki izin memperbarui produk." };
    }

    if (!data.id || !data.name || !data.category) {
      return { success: false, error: "ID, Nama, dan Kategori produk wajib diisi." };
    }

    await prisma.product.update({
      where: { id: data.id },
      data: {
        name: data.name.trim(),
        category: data.category.trim(),
        minStockAlert: Number(data.minStock) || 10,
        unit: data.unit.trim().toLowerCase() || "pcs",
      },
    });

    revalidatePath("/dashboard/products");
    return { success: true, message: "Data master produk berhasil diperbarui!" };
  } catch (error) {
    console.error("Error updateProduct Server Action:", error);
    return { success: false, error: "Gagal memperbarui data produk di database server." };
  }
}

export async function deleteProduct(productId: string) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return { success: false, error: "Sesi tidak valid, silakan login kembali." };
    }

    const userRole = (session.user.role || "").toUpperCase();
    if (!["WAREHOUSE_MANAGER", "SUPER_ADMIN"].includes(userRole)) {
      return { success: false, error: "Akses ditolak. Anda tidak memiliki izin menghapus produk." };
    }

    const productWithStock = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        batches: {
          include: { stocks: true }
        }
      }
    });

    const totalStock = productWithStock?.batches.reduce(
      (acc, b) => acc + b.stocks.reduce((sAcc, s) => sAcc + s.quantity, 0), 0
    ) || 0;

    if (totalStock > 0) {
      return { 
        success: false, 
        error: "Produk tidak dapat dihapus karena masih memiliki sisa stok fisik di gudang. Kosongkan stok terlebih dahulu melalui mutasi/outbound." 
      };
    }

    await prisma.product.delete({
      where: { id: productId },
    });

    revalidatePath("/dashboard/products");
    return { success: true, message: "Produk berhasil dihapus dari sistem." };
  } catch (error) {
    console.error("Error deleteProduct Server Action:", error);
    return { success: false, error: "Gagal menghapus produk karena terikat dengan riwayat transaksi database." };
  }
}

export async function createProduct(data: CreateProductInput) {
  try {
    // 1. Verifikasi Sesi Autentikasi User
    const session = await auth();
    if (!session || !session.user) {
      return { success: false, error: "Sesi tidak valid, silakan login kembali." };
    }

    // 2. Proteksi Otorisasi Role (RBAC)
    const userRole = (session.user.role || "").toUpperCase();
    if (!["WAREHOUSE_MANAGER", "SUPER_ADMIN"].includes(userRole)) {
      return { success: false, error: "Akses ditolak. Anda tidak memiliki izin menambahkan produk." };
    }

    const cleanSku = data.sku.toUpperCase().trim();

    // 3. Validasi Keberadaan SKU yang Sama di Database
    const existingSku = await prisma.product.findUnique({
      where: { sku: cleanSku },
    });

    if (existingSku) {
      return { success: false, error: `SKU "${cleanSku}" sudah terdaftar di sistem!` };
    }

    // 4. Gunakan Prisma Transaction untuk Membuat Produk + Batch + Stok Awal (Jika > 0 dan Lokasi Dipilih)
    await prisma.$transaction(async (tx) => {
      // A. Buat Master Produk
      const newProduct = await tx.product.create({
        data: {
          sku: cleanSku,
          name: data.name.trim(),
          category: data.category.trim(),
          minStockAlert: Number(data.minStock) || 10,
          unit: data.unit.trim().toLowerCase() || "pcs",
        },
      });

      // B. Jika user memasukkan stok awal > 0 DAN memilih lokasi gudang
      const initialStock = Number(data.stock) || 0;
      if (initialStock > 0 && data.warehouseId) {
        // Buat Batch Produk Default untuk stok awal
        const newBatch = await tx.productBatch.create({
          data: {
            productId: newProduct.id,
            batchNumber: `BATCH-${cleanSku}-${Date.now().toString().slice(-4)}`,
            expiredAt: new Date(new Date().setFullYear(new Date().getFullYear() + 2)), // Default expired 2 tahun ke depan
          },
        });

        // Masukkan ke InventoryStock pada lokasi yang DIPILIH USER
        await tx.inventoryStock.create({
          data: {
            locationId: data.warehouseId,
            productBatchId: newBatch.id,
            quantity: initialStock,
          },
        });

        // Catat ke StockMovement (Inbound)
        await tx.stockMovement.create({
          data: {
            referenceNumber: `TRX-INIT-${Date.now()}`,
            type: "INBOUND",
            productBatchId: newBatch.id,
            toLocationId: data.warehouseId,
            quantity: initialStock,
            notes: "Stok awal saat pembuatan produk baru",
            userId: session.user.id || null,
          },
        });
      }
    });

    // 5. Revalidasi Cache Halaman agar Data di Tabel Langsung Terbarukan
    revalidatePath("/dashboard/products");

    return { success: true, message: "Produk dan stok awal berhasil ditambahkan!" };
  } catch (error) {
    console.error("Error createProduct Server Action:", error);
    return { success: false, error: "Gagal menyimpan data produk ke database server." };
  }
}