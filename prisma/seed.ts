import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Memulai seeding data awal WMS...')

  // Hash password standar untuk testing login
  const managerPassword = await bcrypt.hash('manager123', 10)
  const staffPassword = await bcrypt.hash('staff123', 10)

  // 1. Seed User Manager Awal
  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@supplychain.wms' },
    update: {
      password: managerPassword,
    },
    create: {
      email: 'manager@supplychain.wms',
      name: 'Pak Hendra (Manager)',
      role: Role.MANAGER,
      password: managerPassword, 
    },
  })
  console.log(`👤 User Manager diperbarui: ${managerUser.email} (Password: manager123)`)

  // 2. Seed User Staff Awal (Baru ditambahkan)
  const staffUser = await prisma.user.upsert({
    where: { email: 'staff@supplychain.wms' },
    update: {
      password: staffPassword,
    },
    create: {
      email: 'staff@supplychain.wms',
      name: 'Budi (Staf Gudang)',
      role: Role.STAFF,
      password: staffPassword,
    },
  })
  console.log(`👤 User Staff dibuat: ${staffUser.email} (Password: staff123)`)

  // 3. Seed Warehouse Utama (JKT-01)
  const warehouseJKT = await prisma.warehouse.upsert({
    where: { code: 'JKT-01' },
    update: {},
    create: {
      code: 'JKT-01',
      name: 'Gudang Utama Jakarta',
      city: 'Jakarta Barat',
      address: 'Jl. Daan Mogot KM 12 No. 8, Jakarta Barat',
    },
  })
  console.log(`🏢 Warehouse dibuat: ${warehouseJKT.name} (${warehouseJKT.code})`)

  // 4. Seed Rak / Locations di Gudang JKT-01
  const locationsData = [
    { code: 'A1-01-01', aisleRackBin: 'Rak-A-01-01' },
    { code: 'A1-01-02', aisleRackBin: 'Rak-A-01-02' },
    { code: 'B2-01-01', aisleRackBin: 'Rak-B-02-01' },
  ]

  for (const loc of locationsData) {
    await prisma.location.upsert({
      where: {
        warehouseId_code: {
          warehouseId: warehouseJKT.id,
          code: loc.code,
        },
      },
      update: {},
      create: {
        code: loc.code,
        aisleRackBin: loc.aisleRackBin,
        warehouseId: warehouseJKT.id,
      },
    })
  }
  console.log(`📍 ${locationsData.length} Rak/Location berhasil dibuat di Gudang JKT-01`)

  // 5. Seed Master Product Awal
  const productsData = [
    {
      sku: 'SKU-LOGI-MX3',
      name: 'Logitech MX Master 3S Wireless Mouse',
      description: 'Performance Wireless Mouse with Quiet Clicks',
      category: 'Elektronik',
      unit: 'pcs',
      minStockAlert: 10,
    },
    {
      sku: 'SKU-KEYB-K380',
      name: 'Logitech K380 Multi-Device Bluetooth Keyboard',
      description: 'Compact wireless keyboard for computers, tablets and phones',
      category: 'Elektronik',
      unit: 'pcs',
      minStockAlert: 5,
    },
  ]

  for (const prod of productsData) {
    await prisma.product.upsert({
      where: { sku: prod.sku },
      update: {},
      create: prod,
    })
  }
  console.log(`📦 ${productsData.length} Master Product awal berhasil dibuat`)

  console.log('✅ Seeding selesai dengan sukses!')
}

main()
  .catch((e) => {
    console.error('❌ Terjadi kesalahan saat seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })