import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import InboundFormClient from "./inbound-form-client";

export const instant = false;

export default async function InboundPage() {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/login");
  }

  const userRole = (session.user.role || "").toUpperCase();

  // Ambil data referensi (produk, supplier, dan lokasi rak gudang) untuk pilihan form (Kode asli dipertahankan)
  const [products, suppliers, warehouses, inboundList] = await Promise.all([
    prisma.product.findMany({ select: { id: true, name: true, sku: true, unit: true }, orderBy: { name: "asc" } }),
    prisma.supplier.findMany({ select: { id: true, name: true, code: true }, orderBy: { name: "asc" } }),
    prisma.warehouse.findMany({
      include: {
        locations: { select: { id: true, aisleRackBin: true, code: true } },
      },
      orderBy: { name: "asc" },
    }),
    // Tambahan: Ambil riwayat/daftar inbound beserta status approval untuk dipantau
    prisma.inbound.findMany({
      include: {
        supplier: true,
        creator: { select: { name: true } },
        approver: { select: { name: true } },
        items: {
          include: {
            product: true,
            location: { include: { warehouse: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <InboundFormClient 
      products={products} 
      suppliers={suppliers} 
      warehouses={warehouses}
      inboundList={inboundList}
      userRole={userRole}
    />
  );
}