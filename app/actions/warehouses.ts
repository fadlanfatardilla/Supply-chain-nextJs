"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// 1. Action untuk Menambah Gudang Baru
export async function createWarehouse(data: {
  code: string;
  name: string;
  city: string;
  address?: string;
}) {
  try {
    if (!data.code || !data.name || !data.city) {
      return { success: false, error: "Kode, Nama, dan Kota Gudang wajib diisi." };
    }

    // Cek apakah kode gudang sudah ada
    const existing = await prisma.warehouse.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      return { success: false, error: `Kode gudang "${data.code}" sudah terdaftar.` };
    }

    const newWarehouse = await prisma.warehouse.create({
      data: {
        code: data.code,
        name: data.name,
        city: data.city,
        address: data.address || null,
      },
    });

    revalidatePath("/dashboard/warehouses");
    return { success: true, data: newWarehouse };
  } catch (error: any) {
    console.error("Gagal membuat gudang:", error);
    return { success: false, error: error.message || "Terjadi kesalahan pada server." };
  }
}

// Action untuk Mengambil Detail Gudang
export async function getWarehouseDetail(warehouseId: string) {
  try {
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: warehouseId },
      include: {
        locations: {
          include: {
            stocks: {
              include: {
                productBatch: {
                  include: {
                    product: {
                      select: { name: true, sku: true, category: true },
                    },
                  },
                },
              },
            },
          },
          orderBy: { code: "asc" },
        },
      },
    });

    if (!warehouse) {
      return { success: false, error: "Gudang tidak ditemukan." };
    }

    return { success: true, data: warehouse };
  } catch (error: any) {
    console.error("Gagal mengambil detail gudang:", error);
    return { success: false, error: error.message || "Terjadi kesalahan server." };
  }
}

export async function transferStock(data: {
  sourceStockId: string;
  targetLocationId: string;
  quantityToTransfer: number;
}) {
  try {
    const { sourceStockId, targetLocationId, quantityToTransfer } = data;

    if (quantityToTransfer <= 0) {
      return { success: false, error: "Jumlah mutasi harus lebih besar dari 0." };
    }

    // Jalankan transaksi secara atomik dengan timeout 10 detik (10000ms)
    await prisma.$transaction(
      async (tx) => {
        // 1. Ambil data stok asal beserta relasi lokasinya
        const sourceStock = await tx.inventoryStock.findUnique({
          where: { id: sourceStockId },
          include: { 
            productBatch: { include: { product: true } },
            location: true 
          },
        });

        if (!sourceStock) {
          throw new Error("Stok asal tidak ditemukan.");
        }

        if (sourceStock.quantity < quantityToTransfer) {
          throw new Error("Jumlah stok di rak asal tidak mencukupi untuk dipindahkan.");
        }

        // Ambil nama rak tujuan untuk catatan log
        const targetLocation = await tx.location.findUnique({
          where: { id: targetLocationId },
        });

        if (!targetLocation) {
          throw new Error("Rak tujuan tidak ditemukan.");
        }

        // 2. Kurangi atau hapus stok di rak asal
        if (sourceStock.quantity === quantityToTransfer) {
          await tx.inventoryStock.delete({
            where: { id: sourceStockId },
          });
        } else {
          await tx.inventoryStock.update({
            where: { id: sourceStockId },
            data: { quantity: sourceStock.quantity - quantityToTransfer },
          });
        }

        // 3. Cek apakah di rak tujuan sudah ada batch produk yang sama
        const existingTargetStock = await tx.inventoryStock.findFirst({
          where: {
            locationId: targetLocationId,
            productBatchId: sourceStock.productBatchId,
          },
        });

        if (existingTargetStock) {
          await tx.inventoryStock.update({
            where: { id: existingTargetStock.id },
            data: { quantity: existingTargetStock.quantity + quantityToTransfer },
          });
        } else {
          await tx.inventoryStock.create({
            data: {
              locationId: targetLocationId,
              productBatchId: sourceStock.productBatchId,
              quantity: quantityToTransfer,
            },
          });
        }

        // 4. CATAT KE TABEL STOCK MOVEMENT (Audit Trail)
        const refNumber = `TRX-TRF-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(100 + Math.random() * 900)}`;
        
        await tx.stockMovement.create({
          data: {
            referenceNumber: refNumber,
            type: "TRANSFER",
            productBatchId: sourceStock.productBatchId,
            fromLocationId: sourceStock.locationId,
            toLocationId: targetLocationId,
            quantity: quantityToTransfer,
            notes: `Mutasi ${quantityToTransfer} unit produk ${sourceStock.productBatch.product.name} dari rak ${sourceStock.location.aisleRackBin} ke ${targetLocation.aisleRackBin}`,
          },
        });
      },
      {
        maxWait: 10000, // Waktu tunggu antrean maksimal 10 detik
        timeout: 10000, // Batas waktu eksekusi transaksi diperpanjang ke 10 detik (mencegah timeout)
      }
    );

    revalidatePath("/dashboard/warehouses");
    return { success: true };
  } catch (error: any) {
    console.error("Gagal melakukan mutasi stok:", error);
    return { success: false, error: error.message || "Terjadi kesalahan saat memindahkan stok." };
  }
}

// Action untuk mengambil daftar riwayat mutasi / pergerakan stok
export async function getStockMovements() {
  try {
    const movements = await prisma.stockMovement.findMany({
      include: {
        productBatch: {
          include: {
            product: { select: { name: true, sku: true, unit: true } },
          },
        },
        fromLocation: { select: { aisleRackBin: true, code: true } },
        toLocation: { select: { aisleRackBin: true, code: true } },
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return { success: true, data: movements };
  } catch (error: any) {
    console.error("Gagal mengambil riwayat mutasi:", error);
    return { success: false, error: "Gagal memuat data riwayat mutasi." };
  }
}

// 2. Action untuk Menambah Rak / Lokasi ke Dalam Gudang Tertentu
export async function createLocation(data: {
  warehouseId: string;
  aisleRackBin: string;
  code: string;
}) {
  try {
    if (!data.warehouseId || !data.aisleRackBin || !data.code) {
      return { success: false, error: "Semua kolom lokasi rak wajib diisi." };
    }

    const existing = await prisma.location.findUnique({
      where: {
        warehouseId_code: {
          warehouseId: data.warehouseId,
          code: data.code,
        },
      },
    });

    if (existing) {
      return { success: false, error: `Kode rak "${data.code}" sudah ada di gudang ini.` };
    }

    const newLocation = await prisma.location.create({
      data: {
        warehouseId: data.warehouseId,
        aisleRackBin: data.aisleRackBin,
        code: data.code,
      },
    });

    revalidatePath("/dashboard/warehouses");
    return { success: true, data: newLocation };
  } catch (error: any) {
    console.error("Gagal membuat lokasi rak:", error);
    return { success: false, error: error.message || "Terjadi kesalahan pada server." };
  }
}