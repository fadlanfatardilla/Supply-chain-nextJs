'use server'

import { prisma } from "@/lib/prisma";

export async function lookupProductBySku(code: string) {
  try {
    const cleanCode = code.trim();
    if (!cleanCode) {
      return { success: false, error: "Kode SKU tidak boleh kosong." };
    }

    // 1. Cari produk berdasarkan SKU di tabel products
    const product = await prisma.product.findFirst({
      where: {
        OR: [
          { sku: cleanCode },
          { sku: cleanCode.toUpperCase() },
          { sku: cleanCode.toLowerCase() },
        ],
      },
      include: {
        batches: {
          include: {
            stocks: {
              include: {
                location: {
                  include: {
                    warehouse: true, // Menarik data Gudang & Rak dari relasi bertingkat
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!product) {
      return { 
        success: false, 
        error: `Produk dengan SKU "${cleanCode}" tidak ditemukan di database.` 
      };
    }

    // 2. Hitung total stok dari seluruh batch & kumpulkan informasi lokasi rak/gudang
    let totalStock = 0;
    const locationsSet = new Set<string>();
    const warehousesSet = new Set<string>();

    product.batches.forEach((batch) => {
      batch.stocks.forEach((inv) => {
        totalStock += inv.quantity;
        if (inv.location) {
          locationsSet.add(inv.location.aisleRackBin); // Contoh: "Rak-A-02-B"
          if (inv.location.warehouse) {
            warehousesSet.add(inv.location.warehouse.name); // Contoh: "Gudang Utama JKT"
          }
        }
      });
    });

    const locationString = locationsSet.size > 0 ? Array.from(locationsSet).join(", ") : "Belum ditempatkan di rak";
    const warehouseString = warehousesSet.size > 0 ? Array.from(warehousesSet).join(", ") : "Gudang Utama";

    return {
      success: true,
      data: {
        type: "PRODUCT",
        title: product.name,
        code: product.sku,
        status: "VERIFIED",
        stock: totalStock,
        unit: product.unit,
        warehouse: warehouseString,
        location: locationString,
        category: product.category,
        recentActivity: `Min Stock Alert: ${product.minStockAlert} ${product.unit}`,
      },
    };
  } catch (error: any) {
    console.error("DATABASE AUDIT ERROR DETAIL:", error);
    return { 
      success: false, 
      error: `Gagal database: ${error?.message || "Terjadi kesalahan pada server."}` 
    };
  }
}