import { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import WarehousesClient from "./warehouses-client";

export const instant = false;

async function WarehousesContent() {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/login");
  }

  const userRole = (session.user.role || "").toUpperCase();

  // Proteksi Akses (Hanya Manager & Super Admin)
  if (!["WAREHOUSE_MANAGER", "SUPER_ADMIN"].includes(userRole)) {
    redirect("/dashboard");
  }

  // Ambil Data Gudang dari Database
  const rawWarehouses = await prisma.warehouse.findMany({
    // Urutkan berdasarkan waktu pembuatan (ascending) agar gudang yang pertama kali dibuat (Gudang Jakarta) selalu di awal
    orderBy: { createdAt: "asc" }, 
    include: {
      locations: {
        include: {
          stocks: {
            include: {
              productBatch: {
                include: {
                  product: {
                    select: { category: true },
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

  // Transformasi Data untuk Komponen Client
  const warehouses = rawWarehouses.map((wh) => {
    const totalRacks = wh.locations.length;

    const racks = wh.locations.map((loc) => {
      const itemsCount = loc.stocks.reduce((acc, s) => acc + s.quantity, 0);
      const firstCategory = loc.stocks[0]?.productBatch?.product?.category || "Umum";

      return {
        id: loc.id,
        code: loc.code,
        aisleRackBin: loc.aisleRackBin,
        category: firstCategory,
        itemsCount: itemsCount,
        capacity: itemsCount > 100 ? "85%" : itemsCount > 50 ? "50%" : "20%",
      };
    });

    return {
      id: wh.id,
      name: wh.name,
      code: wh.code,
      address: wh.address || "Alamat belum diatur",
      capacity: totalRacks > 0 ? "75%" : "0%",
      totalRacks: totalRacks,
      status: "ACTIVE",
      racks: racks,
    };
  });

  return (
    <WarehousesClient
      user={{
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
      }}
      initialWarehouses={warehouses}
    />
  );
}

export default function WarehousesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-slate-500">Memuat data lokasi gudang dari database...</div>}>
      <WarehousesContent />
    </Suspense>
  );
}