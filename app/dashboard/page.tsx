import { Suspense } from 'react'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import DashboardClient from './dashboard-client'

export const instant = false

async function DashboardContent() {
  const session = await auth()

  if (!session || !session.user) {
    redirect('/login')
  }

  // 1. Ambil Total SKU Produk
  const totalProducts = await prisma.product.count()

  // 2. Ambil Total & Daftar Gudang Aktif
  const warehouses = await prisma.warehouse.findMany({
    select: { name: true },
  })
  const totalWarehouses = warehouses.length
  
  // Format nama gudang menjadi string (Contoh: "Jakarta, Surabaya" atau "Belum ada gudang")
  const warehouseNamesText = 
    warehouses.length > 0 
      ? warehouses.map(w => w.name).join(', ') 
      : 'Belum ada gudang terdaftar'

  // 3. Ambil Stok Menipis (Produk yang minStockAlert > 0)
  const lowStockCount = await prisma.product.count({
    where: {
      minStockAlert: {
        gt: 0,
      },
    },
  })

  // 4. Ambil Total Unit Inbound Hari Ini (Status APPROVED berdasarkan approvedAt)
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  let todayInboundCount = 0
  let recentMovements: any[] = []

  try {
    const approvedInboundsToday = await prisma.inbound.findMany({
      where: {
        status: 'APPROVED',
        approvedAt: { gte: todayStart },
      },
      include: {
        items: true,
      },
    })

    // Hitung total akumulasi unit dari seluruh item inbound yang disetujui hari ini
    todayInboundCount = approvedInboundsToday.reduce((totalAcc, inbound) => {
      const inboundSum = inbound.items.reduce((itemAcc, item) => itemAcc + item.quantity, 0)
      return totalAcc + inboundSum
    }, 0)

    // 5. Ambil 5 Mutasi Stok Terakhir dengan Relasi Prisma yang Valid
    recentMovements = await prisma.stockMovement.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        productBatch: {
          include: {
            product: true,
          },
        },
        toLocation: {
          include: { warehouse: true },
        },
      },
    })
  } catch (error) {
    console.error("Dashboard Data Fetch Error:", error)
    todayInboundCount = 0
    recentMovements = []
  }

  const metricsData = {
    totalProducts,
    lowStockCount,
    totalWarehouses,
    warehouseNamesText,
    todayInboundCount,
  }

  return (
    <DashboardClient
      user={{
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
      }}
      metricsData={metricsData}
      movementsData={recentMovements}
    />
  )
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 p-8 text-slate-400">
          Memuat data dashboard...
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  )
}