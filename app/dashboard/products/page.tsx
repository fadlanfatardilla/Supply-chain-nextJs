import { Suspense } from 'react'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ProductsClient from './products-client'

export const instant = false

async function ProductsContent({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const session = await auth()

  if (!session || !session.user) {
    redirect('/login')
  }

  const userRole = (session.user.role || '').toUpperCase()

  if (!['WAREHOUSE_MANAGER'].includes(userRole)) {
    redirect('/dashboard')
  }

  // 🔍 Ambil parameter pencarian dari URL (dikirim dari global search navbar)
  const query = (await searchParams).search || ''

  // 1. Ambil Data Produk + Stok (dengan filter pencarian jika ada)
  const rawProducts = await prisma.product.findMany({
    where: query
      ? {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { sku: { contains: query, mode: 'insensitive' } },
            { category: { contains: query, mode: 'insensitive' } },
          ],
        }
      : undefined,
    orderBy: { createdAt: 'desc' },
    include: {
      batches: {
        include: {
          stocks: {
            include: {
              location: {
                include: {
                  warehouse: {
                    select: { name: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  // 2. Ambil Daftar Lokasi Rak & Gudang untuk Pilihan Dropdown Form
  const rawLocations = await prisma.location.findMany({
    include: {
      warehouse: {
        select: { name: true, code: true },
      },
    },
    orderBy: { code: 'asc' },
  })

  const availableLocations = rawLocations.map((loc) => ({
    id: loc.id,
    name: `${loc.warehouse.name} - Rak (${loc.aisleRackBin})`,
  }))

  // 3. Mapping Produk dengan Aturan Status Stok Baru
  const products = rawProducts.map((p) => {
    const totalStock = p.batches.reduce((accBatch, batch) => {
      const batchStockSum = batch.stocks.reduce(
        (accStock, stockItem) => accStock + stockItem.quantity,
        0
      )
      return accBatch + batchStockSum
    }, 0)

    const minStock = p.minStockAlert
    
    // Aturan Kustom Status Stok Berdasarkan Kuantitas Total
    let status = 'IN_STOCK'
    if (totalStock === 0) {
      status = 'OUT_OF_STOCK' // Merah (Habis)
    } else if (totalStock < 100) {
      status = 'LOW_STOCK' // Merah / Peringatan di bawah 100
    } else if (totalStock >= 100 && totalStock <= 200) {
      status = 'WARNING_STOCK' // Kuning (Range 100 - 200)
    } else {
      status = 'IN_STOCK' // Hijau (Di atas 200)
    }

    const firstBatch = p.batches?.[0]
    const firstStock = firstBatch?.stocks?.[0]
    const warehouseName =
      firstStock?.location?.warehouse?.name || 'Belum Dialokasikan'

    return {
      id: p.id,
      sku: p.sku,
      name: p.name,
      category: p.category,
      stock: totalStock,
      minStock: minStock,
      unit: p.unit,
      warehouse: warehouseName,
      status: status,
    }
  })

  return (
    <ProductsClient
      user={{
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
      }}
      initialProducts={products}
      locations={availableLocations}
    />
  )
}

export default function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-sm text-slate-500">
          Memuat katalog produk dari database...
        </div>
      }
    >
      <ProductsContent searchParams={searchParams} />
    </Suspense>
  )
}