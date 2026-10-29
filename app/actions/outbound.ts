"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const outboundSchema = z.object({
  productId: z.string().min(1, "Produk wajib dipilih"),
  locationId: z.string().min(1, "Lokasi / rak asal wajib dipilih"),
  productBatchId: z.string().min(1, "Batch produk wajib dipilih"),
  quantity: z.number().positive("Jumlah kuantitas keluar minimal 1 pcs"),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
});

export type OutboundInput = z.infer<typeof outboundSchema>;

export async function createOutboundTransaction(input: OutboundInput) {
  try {
    const validated = outboundSchema.parse(input);
    const { productId, locationId, productBatchId, quantity, referenceNumber, notes } = validated;

    await prisma.$transaction(async (tx) => {
      // 1. Cek ketersediaan record stok di inventory_stocks berdasarkan rak dan batch
      const stockRecord = await tx.inventoryStock.findUnique({
        where: {
          locationId_productBatchId: {
            locationId,
            productBatchId,
          },
        },
        include: {
          location: { include: { warehouse: true } },
          productBatch: { include: { product: true } },
        },
      });

      if (!stockRecord) {
        throw new Error("Record stok untuk batch dan lokasi rak tersebut tidak ditemukan.");
      }

      if (stockRecord.quantity < quantity) {
        throw new Error(
          `Stok tidak mencukupi! Stok tersedia di rak ${stockRecord.location.aisleRackBin} hanya ${stockRecord.quantity} unit.`
        );
      }

      // 2. Kurangi atau hapus record stok jika kuantitas habis
      const newQuantity = stockRecord.quantity - quantity;
      if (newQuantity === 0) {
        await tx.inventoryStock.delete({
          where: { id: stockRecord.id },
        });
      } else {
        await tx.inventoryStock.update({
          where: { id: stockRecord.id },
          data: { quantity: newQuantity },
        });
      }

      // 3. Catat Audit Trail ke tabel StockMovement (OUTBOUND)
      const refNum = referenceNumber || `TRX-OUT-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(100 + Math.random() * 900)}`;

      await tx.stockMovement.create({
        data: {
          referenceNumber: refNum,
          type: "OUTBOUND",
          productBatchId,
          fromLocationId: locationId,
          toLocationId: null, // Keluar dari gudang
          quantity,
          notes: notes || `Pengeluaran ${quantity} unit produk ${stockRecord.productBatch.product.name} (Batch: ${stockRecord.productBatch.batchNumber}) dari ${stockRecord.location.warehouse.name} (${stockRecord.location.aisleRackBin})`,
        },
      });
    });

    revalidatePath("/dashboard/warehouses");
    revalidatePath("/dashboard/movements");
    return { success: true, message: "Outbound berhasil diproses." };
  } catch (err: any) {
    console.error("Outbound Transaction Error:", err);
    return { success: false, error: err.message || "Gagal memproses pengeluaran barang." };
  }
}