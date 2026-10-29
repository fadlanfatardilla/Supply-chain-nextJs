import { Suspense } from "react";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import WarehouseDetailClient from "./warehouse-detail-client";

export const instant = false;

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

// Komponen Async terpisah yang menerima id hasil unwrap params
async function WarehouseDetailWrapper({ idPromise }: { idPromise: Promise<{ id: string }> }) {
  const resolvedParams = await idPromise;
  const id = resolvedParams.id;

  const session = await auth();

  if (!session || !session.user) {
    redirect("/login");
  }

  const userRole = (session.user.role || "").toUpperCase();

  // Proteksi Akses
  if (!["WAREHOUSE_MANAGER", "SUPER_ADMIN"].includes(userRole)) {
    redirect("/dashboard");
  }

  // Ambil data gudang spesifik beserta relasi lokasi dan stok produk
  const warehouse = await prisma.warehouse.findUnique({
    where: { id },
    include: {
      locations: {
        include: {
          stocks: {
            include: {
              productBatch: {
                include: {
                  product: {
                    select: { name: true, sku: true, category: true, unit: true },
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
    notFound();
  }

  // Transformasi data agar mudah dibaca oleh Client Component (Disesuaikan dengan Status Visual Grid)
  const formattedWarehouse = {
    id: warehouse.id,
    name: warehouse.name,
    code: warehouse.code,
    city: warehouse.city,
    address: warehouse.address || "Alamat belum diatur",
    createdAt: warehouse.createdAt.toISOString(),
    locations: warehouse.locations.map((loc) => {
      const totalItems = loc.stocks.reduce((acc, s) => acc + s.quantity, 0);
      const isOccupied = totalItems > 0;

      const itemsList = loc.stocks.map((s) => ({
        id: s.id,
        productName: s.productBatch?.product?.name || "Produk Tidak Dikenal",
        sku: s.productBatch?.product?.sku || "-",
        category: s.productBatch?.product?.category || "Umum",
        quantity: s.quantity,
        batchNumber: s.productBatch?.batchNumber || "-",
      }));

      return {
        id: loc.id,
        code: loc.code,
        aisleRackBin: loc.aisleRackBin,
        status: isOccupied ? ("OCCUPIED" as const) : ("EMPTY" as const), // Status untuk visualisasi grid
        totalItems,
        capacityUsage: totalItems > 100 ? "85%" : totalItems > 50 ? "50%" : totalItems > 0 ? "20%" : "0%",
        items: itemsList,
      };
    }),
  };

  return <WarehouseDetailClient warehouse={formattedWarehouse} userRole={userRole} />;
}

export default function WarehouseDetailPage({ params }: PageProps) {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-slate-500">Memuat detail gudang dan daftar rak...</div>}>
      <WarehouseDetailWrapper idPromise={params} />
    </Suspense>
  );
}