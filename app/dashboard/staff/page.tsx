import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import StaffDashboardClient from "./staff-dashboard-client";

export const instant = false;

export default async function StaffDashboardPage() {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/login");
  }

  // Pengamanan ekstra: Jika role bukan STAFF/MANAGER, kembalikan ke halaman login
  const userRole = (session.user.role || "").toUpperCase();

  // Ambil ringkasan statistik khusus operasional staf
  const [myPendingInbounds, totalMovementsCount] = await Promise.all([
    prisma.inbound.count({
      where: {
        createdById: session.user.id,
        status: "PENDING",
      },
    }),
    prisma.stockMovement.count(),
  ]);

  return (
    <StaffDashboardClient
      userName={session.user.name || "Staf Gudang"}
      userEmail={session.user.email || ""}
      pendingInboundsCount={myPendingInbounds}
      totalMovementsCount={totalMovementsCount}
    />
  );
}