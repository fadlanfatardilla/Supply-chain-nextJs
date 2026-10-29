import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SuppliersClient from "./suppliers-client";

export const instant = false;

export default async function SuppliersPage() {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/login");
  }

  // Ambil daftar supplier beserta jumlah batch yang disuplai
  const suppliers = await prisma.supplier.findMany({
    include: {
      _count: {
        select: { batches: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return <SuppliersClient initialSuppliers={suppliers} />;
}