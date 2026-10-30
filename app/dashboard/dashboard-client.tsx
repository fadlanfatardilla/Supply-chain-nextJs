"use client";

import { motion } from "framer-motion";
import { NotificationBell } from "@/components/notification-bell";
import {
  Package,
  AlertTriangle,
  Warehouse,
  ArrowDownLeft,
  QrCode,
  Plus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0 },
};

interface DashboardClientProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string;
  };
  metricsData: {
    totalProducts: number;
    lowStockCount: number;
    totalWarehouses: number;
    warehouseNamesText: string;
    todayInboundCount: number;
  };
  movementsData: any[];
  initialNotifications?: any[];
}

export default function DashboardClient({
  user,
  metricsData,
  movementsData,
  initialNotifications = [],
}: DashboardClientProps) {
  const userRole = user.role?.toUpperCase() || "";

  // Tentukan judul dinamis berdasarkan role user
  const dashboardTitle =
    userRole === "MANAGER"
      ? "Ringkasan Operasional Manager"
      : userRole === "STAFF"
      ? "Ringkasan Operasional Staff"
      : "Ringkasan Operasional";

  const metrics = [
    {
      title: "Total SKU Produk",
      value: `${metricsData.totalProducts} SKU`,
      description: "Produk terdaftar di sistem",
      icon: Package,
    },
    {
      title: "Stok Menipis (Alert)",
      value: `${metricsData.lowStockCount} SKU`,
      description: "Perlu re-stock / pemantauan",
      icon: AlertTriangle,
      alert: metricsData.lowStockCount > 0,
    },
    {
      title: "Total Gudang Aktif",
      value: `${metricsData.totalWarehouses} Gudang`,
      description: metricsData.warehouseNamesText,
      icon: Warehouse,
    },
    {
      title: "Inbound Hari Ini",
      value: `+${metricsData.todayInboundCount} Unit`,
      description: "Barang masuk telah disetujui",
      icon: ArrowDownLeft,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Halaman & Profil User */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {dashboardTitle}
            </h1>
            <span className="text-slate-400 dark:text-slate-600 font-normal">
              /
            </span>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {user.name || "Warehouse User"}
            </span>
            <Badge
              variant="outline"
              className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20 text-[11px] font-mono tracking-wide px-2 py-0.5 uppercase"
            >
              {user.role}
            </Badge>
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-400 font-normal flex flex-wrap items-center gap-2">
            <span>Data inventaris & mutasi stok real-time</span>
            <span className="inline-block w-1 h-1 rounded-full bg-slate-400 dark:bg-slate-700" />
            <span className="font-mono text-xs text-slate-500 dark:text-slate-500">
              {user.email}
            </span>
          </p>
        </div>
      </div>

      {/* Grid Summary Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      >
        {metrics.map((metric, i) => (
          <motion.div key={i} variants={itemVariants}>
            <Card
              className={
                metric.alert ? "border-amber-500/50 bg-amber-500/5" : ""
              }
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {metric.title}
                </CardTitle>
                <metric.icon
                  className={`h-4 w-4 ${
                    metric.alert ? "text-amber-500" : "text-muted-foreground"
                  }`}
                />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metric.description}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Tabel Mutasi Stok */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Mutasi Stok Terakhir</CardTitle>
          <CardDescription>
            Aktivitas transaksi barang masuk (inbound) dan pergerakan stok dari
            database.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Referensi</TableHead>
                <TableHead>Produk / SKU</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Jumlah</TableHead>
                <TableHead>Lokasi Tujuan Rak</TableHead>
                <TableHead className="text-right">Waktu</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movementsData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground py-6 text-xs"
                  >
                    Belum ada riwayat mutasi stok tercatat di database.
                  </TableCell>
                </TableRow>
              ) : (
                movementsData.map((trx) => {
                  // Ambil data produk melalui relasi productBatch -> product
                  const productObj = trx.productBatch?.product;
                  // Ambil data lokasi tujuan melalui relasi toLocation -> warehouse
                  const locationObj = trx.toLocation;

                  return (
                    <TableRow key={trx.id}>
                      <TableCell className="font-mono text-xs font-semibold">
                        {trx.referenceNumber ||
                          trx.id.substring(0, 8).toUpperCase()}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900 dark:text-slate-100">
                            {productObj?.name || "Produk SKU"}
                          </span>
                          <span className="text-xs text-muted-foreground font-mono">
                            {productObj?.sku || "-"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const typeUpper = trx.type?.toUpperCase() || "";
                          let badgeClass = "text-[10px] font-semibold ";

                          if (typeUpper === "INBOUND") {
                            badgeClass +=
                              "bg-emerald-500 text-white hover:bg-emerald-600";
                          } else if (typeUpper === "OUTBOUND") {
                            badgeClass +=
                              "bg-rose-500 text-white hover:bg-rose-600";
                          } else if (typeUpper === "TRANSFER") {
                            badgeClass +=
                              "bg-blue-500 text-white hover:bg-blue-600";
                          } else {
                            badgeClass +=
                              "bg-slate-500 text-white hover:bg-slate-600";
                          }

                          return (
                            <Badge variant="default" className={badgeClass}>
                              {trx.type}
                            </Badge>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="font-semibold">
                        +{trx.quantity} Unit
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {locationObj
                          ? `${locationObj.warehouse?.name || "Gudang"} Rak (${
                              locationObj.aisleRackBin || locationObj.code || "-"
                            })`
                          : "Lokasi Umum"}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground font-mono">
                        {new Date(trx.createdAt).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}