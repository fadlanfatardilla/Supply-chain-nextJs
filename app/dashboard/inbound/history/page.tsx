import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import InboundHistoryClient from "./inbound-history-client";

export const instant = false;

export default async function InboundHistoryPage() {
  const session = await auth();
  if (!session || !session.user) redirect("/login");

  const userRole = (session.user.role || "").toUpperCase();

  // Ambil seluruh riwayat inbound beserta detail item dan statusnya
  const inboundList = await prisma.inbound.findMany({
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
  });

  return (
    <InboundHistoryClient 
      inboundList={inboundList} 
      userRole={userRole} 
    />
  );
}