import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ notifications: [], unreadCount: 0 }, { status: 401 });
    }

    // Ambil transaksi Inbound berstatus PENDING beserta nama Pembuat (Staff) & Supplier
    const pendingInbounds = await prisma.inbound.findMany({
      where: {
        status: "PENDING",
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        creator: {
          select: { name: true, email: true },
        },
        supplier: {
          select: { name: true },
        },
      },
      take: 10,
    });

    const notifications = pendingInbounds.map((inbound) => ({
      id: inbound.id,
      title: "Penerimaan Barang Baru (Inbound)",
      message: `${inbound.creator?.name || "Staff"} mengajukan Inbound ${inbound.referenceNumber} dari ${inbound.supplier?.name}`,
      time: inbound.createdAt,
      refNumber: inbound.referenceNumber,
    }));

    return NextResponse.json({
      notifications,
      unreadCount: notifications.length,
    });
  } catch (error) {
    console.error("Notification Fetch Error:", error);
    return NextResponse.json({ notifications: [], unreadCount: 0 }, { status: 500 });
  }
}