"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const supplierSchema = z.object({
  name: z.string().min(2, "Nama supplier minimal 2 karakter"),
  code: z.string().min(2, "Kode supplier minimal 2 karakter"),
  email: z.string().email("Format email tidak valid").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export type SupplierInput = z.infer<typeof supplierSchema>;

// 1. Tambah Supplier Baru
export async function createSupplier(input: SupplierInput) {
  try {
    const validated = supplierSchema.parse(input);

    const existingCode = await prisma.supplier.findUnique({
      where: { code: validated.code.trim().toUpperCase() },
    });

    if (existingCode) {
      return { success: false, error: "Kode supplier sudah digunakan." };
    }

    const supplier = await prisma.supplier.create({
      data: {
        name: validated.name.trim(),
        code: validated.code.trim().toUpperCase(),
        email: validated.email || null,
        phone: validated.phone || null,
        address: validated.address || null,
      },
    });

    revalidatePath("/dashboard/suppliers");
    return { success: true, data: supplier };
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal menambahkan supplier." };
  }
}

// 2. Update Supplier
export async function updateSupplier(id: string, input: SupplierInput) {
  try {
    const validated = supplierSchema.parse(input);

    await prisma.supplier.update({
      where: { id },
      data: {
        name: validated.name.trim(),
        code: validated.code.trim().toUpperCase(),
        email: validated.email || null,
        phone: validated.phone || null,
        address: validated.address || null,
      },
    });

    revalidatePath("/dashboard/suppliers");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal memperbarui supplier." };
  }
}

// 3. Hapus Supplier
export async function deleteSupplier(id: string) {
  try {
    // Cek apakah supplier sudah memiliki batch terkait
    const batchCount = await prisma.productBatch.count({
      where: { supplierId: id },
    });

    if (batchCount > 0) {
      return {
        success: false,
        error: `Supplier tidak dapat dihapus karena terikat dengan ${batchCount} batch produk masuk.`,
      };
    }

    await prisma.supplier.delete({
      where: { id },
    });

    revalidatePath("/dashboard/suppliers");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal menghapus supplier." };
  }
}