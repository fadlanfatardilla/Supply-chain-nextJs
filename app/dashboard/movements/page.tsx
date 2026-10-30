import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import StockMovementsClient from "./stock-movements-client";

export const instant = false;

export default async function StockMovementsPage() {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/login");
  }

  const userRole = (session.user.role || "").toUpperCase();

  // 1. Ambil data transaksi Inbound yang masih PENDING (untuk approval manajer)
  const pendingInbounds = await prisma.inbound.findMany({
    where: { status: "PENDING" },
    include: {
      supplier: true,
      creator: { select: { name: true } },
      items: {
        include: {
          product: { select: { name: true, sku: true, unit: true } },
          location: { include: { warehouse: { select: { name: true } } } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // 2. Ambil data riwayat mutasi dari database (konversi tanggal ke string JSON-safe)
  const rawMovements = await prisma.stockMovement.findMany({
    include: {
      productBatch: {
        include: {
          product: { select: { name: true, sku: true, unit: true } },
        },
      },
      fromLocation: { 
        include: { warehouse: { select: { name: true } } } 
      },
      toLocation: { 
        include: { warehouse: { select: { name: true } } } 
      },
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200, // Ambil hingga 200 log terakhir untuk difilter
  });

  // Format tanggal menjadi ISO string agar aman dikirim ke Client Component
  const movements = rawMovements.map((m) => ({
    ...m,
    createdAt: m.createdAt.toISOString(),
  }));

  // Format juga tanggal pada pendingInbounds
  const formattedPendingInbounds = pendingInbounds.map((inbound) => ({
    ...inbound,
    createdAt: inbound.createdAt.toISOString(),
    approvedAt: inbound.approvedAt ? inbound.approvedAt.toISOString() : null,
    updatedAt: inbound.updatedAt.toISOString(),
  }));

  return (
    <StockMovementsClient 
      initialMovements={movements} 
      pendingInbounds={formattedPendingInbounds}
      userRole={userRole}
    />
  );
}