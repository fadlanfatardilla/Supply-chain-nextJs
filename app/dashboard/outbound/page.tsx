import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import OutboundFormClient from "./outbound-form-client";

export const instant = false;

export default async function OutboundPage() {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/login");
  }

  // Ambil seluruh data stok inventaris yang ada di rak saat ini beserta relasi batch dan lokasinya
  const inventoryStocks = await prisma.inventoryStock.findMany({
    where: {
      quantity: { gt: 0 }, // Hanya ambil stok yang ada isinya (> 0)
    },
    include: {
      productBatch: {
        include: {
          product: true,
          supplier: true,
        },
      },
      location: {
        include: {
          warehouse: true,
        },
      },
    },
    orderBy: {
      productBatch: {
        expiredAt: "asc", // Urutkan berdasarkan FEFO (Expired terdekat di atas)
      },
    },
  });

  return <OutboundFormClient inventoryStocks={inventoryStocks} />;
}