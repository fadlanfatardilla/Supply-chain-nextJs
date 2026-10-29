"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// 1. Skema Validasi Input dengan Zod
const inboundSchema = z.object({
  productId: z.string().min(1, "Produk wajib dipilih"),
  supplierId: z.string().optional(),
  locationId: z.string().min(1, "Rak / lokasi tujuan wajib dipilih"),
  quantity: z.number().positive("Jumlah barang harus lebih dari 0"),
  batchNumber: z.string().min(1, "Nomor batch wajib diisi"),
  manufacturedDate: z.string().optional(),
  expiredAt: z.string().optional(),
  notes: z.string().optional(),
});

export type InboundInput = z.infer<typeof inboundSchema>;

export type ActionResult<T = unknown> = {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
};

// 2. Server Action Pengajuan Inbound (Status: PENDING)
export async function createInboundTransaction(
  input: InboundInput
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return { success: false, message: "Unauthorized", error: "Sesi pengguna tidak valid." };
    }

    const validatedData = inboundSchema.parse(input);

    const {
      productId,
      supplierId,
      locationId,
      quantity,
      batchNumber,
      expiredAt,
      notes,
    } = validatedData;

    const refNumber = `TRX-INB-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(100 + Math.random() * 900)}`;

    const inbound = await prisma.inbound.create({
      data: {
        referenceNumber: refNumber,
        supplierId: supplierId || "",
        status: "PENDING",
        notes: notes || null,
        createdById: session.user.id,
        items: {
          create: {
            productId,
            locationId,
            batchNumber: batchNumber.trim(),
            quantity,
            expiredAt: expiredAt ? new Date(expiredAt) : null,
          },
        },
      },
      include: {
        items: true,
      },
    });

    revalidatePath("/dashboard/inbound");

    return {
      success: true,
      message: `Pengajuan inbound berhasil dibuat (${refNumber}) dan menunggu approval Manager.`,
      data: inbound,
    };
  } catch (err: unknown) {
    console.error("Inbound Transaction Error:", err);
    const errorMessage =
      err instanceof z.ZodError
        ? err.errors[0]?.message || "Input tidak valid"
        : err instanceof Error
        ? err.message
        : "Gagal memproses pengajuan Inbound";

    return {
      success: false,
      message: errorMessage,
      error: errorMessage,
    };
  }
}

// 3. Server Action Approval oleh Manager dengan Optimasi Timeout Prisma
export async function approveInboundTransaction(inboundId: string): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return { success: false, message: "Unauthorized", error: "Sesi pengguna tidak valid." };
    }

    const userRole = (session.user.role || "").toUpperCase();
    if (userRole !== "WAREHOUSE_MANAGER" && userRole !== "SUPER_ADMIN") {
      return { success: false, message: "Akses ditolak", error: "Hanya Manager Gudang atau Super Admin yang dapat menyetujui Inbound." };
    }

    // Pengecekan awal di luar transaksi untuk memastikan data benar-benar PENDING
    const existingInbound = await prisma.inbound.findUnique({
      where: { id: inboundId },
      select: { status: true },
    });

    if (!existingInbound) {
      return { success: false, message: "Transaksi tidak ditemukan", error: "Data transaksi inbound tidak ditemukan di database." };
    }

    if (existingInbound.status === "APPROVED") {
      return { success: false, message: "Sudah disetujui", error: "Transaksi inbound ini sudah disetujui sebelumnya." };
    }

    // 💡 Eksekusi transaksi dengan konfigurasi maxWait & timeout yang diperpanjang (30 detik)
    const result = await prisma.$transaction(
      async (tx) => {
        const inbound = await tx.inbound.findUnique({
          where: { id: inboundId },
          include: { items: { include: { product: true, location: { include: { warehouse: true } } } } },
        });

        if (!inbound || inbound.status !== "PENDING") {
          throw new Error("Transaksi inbound sudah diproses atau tidak valid.");
        }

        // Update status Inbound menjadi APPROVED
        await tx.inbound.update({
          where: { id: inboundId },
          data: {
            status: "APPROVED",
            approvedById: session.user.id,
            approvedAt: new Date(),
          },
        });

        const processedItems = [];

        for (const item of inbound.items) {
          // Step A: Buat ProductBatch baru
          const newBatch = await tx.productBatch.create({
            data: {
              productId: item.productId,
              supplierId: inbound.supplierId || null,
              batchNumber: item.batchNumber,
              expiredAt: item.expiredAt,
            },
          });

          // Step B: Tambah/Update InventoryStock di Rak
          const existingStock = await tx.inventoryStock.findUnique({
            where: {
              locationId_productBatchId: {
                locationId: item.locationId,
                productBatchId: newBatch.id,
              },
            },
          });

          let updatedStock;
          if (existingStock) {
            updatedStock = await tx.inventoryStock.update({
              where: { id: existingStock.id },
              data: { quantity: { increment: item.quantity } },
            });
          } else {
            updatedStock = await tx.inventoryStock.create({
              data: {
                locationId: item.locationId,
                productBatchId: newBatch.id,
                quantity: item.quantity,
              },
            });
          }

          // Step C: Catat StockMovement Ledger
          await tx.stockMovement.create({
            data: {
              referenceNumber: inbound.referenceNumber,
              type: "INBOUND",
              productBatchId: newBatch.id,
              fromLocationId: null,
              toLocationId: item.locationId,
              quantity: item.quantity,
              notes: `Penerimaan disetujui oleh manager. Batch: ${item.batchNumber}`,
              userId: session.user.id,
            },
          });

          processedItems.push({ inventory: updatedStock, batchId: newBatch.id });
        }

        return processedItems;
      },
      {
        maxWait: 10000, // Waktu tunggu antrean maksimal (10 detik)
        timeout: 30000, // Batas waktu eksekusi transaksi diperpanjang jadi 30 detik
      }
    );

    revalidatePath("/dashboard/inbound");
    revalidatePath("/dashboard/warehouses");
    revalidatePath("/dashboard/movements");

    return {
      success: true,
      message: "Inbound berhasil disetujui dan stok fisik resmi masuk ke rak gudang.",
      data: result,
    };
  } catch (err: unknown) {
    console.error("Approve Inbound Error:", err);
    const errorMessage = err instanceof Error ? err.message : "Gagal menyetujui transaksi inbound.";
    return {
      success: false,
      message: errorMessage,
      error: errorMessage,
    };
  }
}