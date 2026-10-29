"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Box, Layers, AlertCircle, CheckCircle2, ShieldAlert } from "lucide-react";

// Tipe Data Slot
interface RackSlot {
  id: string;
  level: number;
  slot: string;
  status: "OCCUPIED" | "EMPTY";
  sku?: string;
  itemName?: string;
  quantity?: number;
  maxCapacity: number;
}

// Dummy Data Rak 4x4
const RACK_DATA: RackSlot[] = [
  // Level 4 (Atas)
  { id: "L4-A", level: 4, slot: "A", status: "EMPTY", maxCapacity: 200 },
  { id: "L4-B", level: 4, slot: "B", status: "EMPTY", maxCapacity: 200 },
  { id: "L4-C", level: 4, slot: "C", status: "OCCUPIED", sku: "SKU-PROD-001", itemName: "Industrial Bearing Set", quantity: 120, maxCapacity: 200 },
  { id: "L4-D", level: 4, slot: "D", status: "EMPTY", maxCapacity: 200 },

  // Level 3
  { id: "L3-A", level: 3, slot: "A", status: "OCCUPIED", sku: "SKU-PROD-002", itemName: "Hydraulic Pump 50L", quantity: 50, maxCapacity: 150 },
  { id: "L3-B", level: 3, slot: "B", status: "OCCUPIED", sku: "SKU-PROD-005", itemName: "Steel Pipe 2-inch", quantity: 150, maxCapacity: 150 },
  { id: "L3-C", level: 3, slot: "C", status: "EMPTY", maxCapacity: 150 },
  { id: "L3-D", level: 3, slot: "D", status: "EMPTY", maxCapacity: 150 },

  // Level 2
  { id: "L2-A", level: 2, slot: "A", status: "OCCUPIED", sku: "SKU-PROD-003", itemName: "Electric Motor 5HP", quantity: 80, maxCapacity: 200 },
  { id: "L2-B", level: 2, slot: "B", status: "EMPTY", maxCapacity: 200 },
  { id: "L2-C", level: 2, slot: "C", status: "OCCUPIED", sku: "SKU-PROD-004", itemName: "Control Valve V2", quantity: 140, maxCapacity: 200 },
  { id: "L2-D", level: 2, slot: "D", status: "OCCUPIED", sku: "SKU-PROD-001", itemName: "Industrial Bearing Set", quantity: 90, maxCapacity: 200 },

  // Level 1 (Bawah)
  { id: "L1-A", level: 1, slot: "A", status: "OCCUPIED", sku: "SKU-PROD-006", itemName: "Baut Industri M12", quantity: 300, maxCapacity: 300 },
  { id: "L1-B", level: 1, slot: "B", status: "OCCUPIED", sku: "SKU-PROD-007", itemName: "Oli Pelumas Shell 20L", quantity: 250, maxCapacity: 300 },
  { id: "L1-C", level: 1, slot: "C", status: "OCCUPIED", sku: "SKU-PROD-008", itemName: "Kabel Tembaga 100m", quantity: 180, maxCapacity: 300 },
  { id: "L1-D", level: 1, slot: "D", status: "EMPTY", maxCapacity: 300 },
];

export default function RackLayoutViewer() {
  const [selectedSlot, setSelectedSlot] = useState<RackSlot | null>(RACK_DATA[2]); // Default L4-C

  // Hitung Statistik Keterisian
  const totalSlots = RACK_DATA.length;
  const occupiedSlots = RACK_DATA.filter((s) => s.status === "OCCUPIED").length;
  const emptySlots = totalSlots - occupiedSlots;
  const occupancyRate = Math.round((occupiedSlots / totalSlots) * 100);

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Layers className="h-6 w-6 text-blue-600" />
             Visualisasi Tata Letak Rak (Blok A1)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Klik pada slot rak untuk melihat status keterisian stok dan detail produk.
          </p>
        </div>

        {/* Ringkasan Status */}
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="px-3 py-1 bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400">
            Terisi: {occupiedSlots} Slot
          </Badge>
          <Badge variant="outline" className="px-3 py-1 bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-400">
            Kosong: {emptySlots} Slot
          </Badge>
          <Badge className="px-3 py-1 bg-blue-600 text-white">
            Utilisasi: {occupancyRate}%
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grid Visualisasi Rak 2D (2 Kolom di Layar Lebar) */}
        <Card className="lg:col-span-2 border-slate-200 shadow-sm dark:border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Tampilan Rak Fisik Grid 2D</CardTitle>
            <CardDescription>Sumbu Vertikal = Level Tingkat | Sumbu Horizontal = Slot Posisi</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Render Level 4 hingga Level 1 */}
            {[4, 3, 2, 1].map((levelNum) => {
              const levelSlots = RACK_DATA.filter((s) => s.level === levelNum);

              return (
                <div key={levelNum} className="flex items-center gap-3">
                  {/* Label Level */}
                  <div className="w-16 shrink-0 text-xs font-bold font-mono text-slate-500 text-right uppercase">
                    Level {levelNum}
                  </div>

                  {/* Grid Slot per Level */}
                  <div className="grid grid-cols-4 gap-3 flex-1">
                    {levelSlots.map((slot) => {
                      const isSelected = selectedSlot?.id === slot.id;
                      const isOccupied = slot.status === "OCCUPIED";

                      return (
                        <button
                          key={slot.id}
                          onClick={() => setSelectedSlot(slot)}
                          className={`
                            relative h-20 rounded-xl p-2 flex flex-col justify-between items-start transition-all cursor-pointer border-2
                            ${isSelected ? "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-950" : ""}
                            ${
                              isOccupied
                                ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-900 dark:text-emerald-300 hover:bg-emerald-500/20"
                                : "bg-rose-500/5 border-rose-500/30 text-rose-900 dark:text-rose-400 hover:bg-rose-500/10"
                            }
                          `}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="text-xs font-bold font-mono">Slot {slot.slot}</span>
                            <span
                              className={`h-2.5 w-2.5 rounded-full ${
                                isOccupied ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                              }`}
                            />
                          </div>

                          <div className="w-full truncate text-left">
                            {isOccupied ? (
                              <div className="space-y-0.5">
                                <p className="text-[10px] font-semibold truncate leading-tight">{slot.itemName}</p>
                                <p className="text-[9px] font-mono opacity-80">{slot.quantity} Unit</p>
                              </div>
                            ) : (
                              <p className="text-[10px] font-semibold text-rose-600 dark:text-rose-400">KOSONG</p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Panel Detail Slot Terpilih */}
        <Card className="border-slate-200 shadow-sm dark:border-slate-800 h-fit">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Box className="h-5 w-5 text-blue-600" />
              Detail Slot {selectedSlot?.id}
            </CardTitle>
            <CardDescription>Informasi riwayat dan muatan barang saat ini</CardDescription>
          </CardHeader>

          <CardContent className="pt-4 space-y-4">
            {selectedSlot ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-mono uppercase">Status Lokasi</span>
                  {selectedSlot.status === "OCCUPIED" ? (
                    <Badge className="bg-emerald-600 text-white gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Terisi (Occupied)
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="gap-1">
                      <AlertCircle className="h-3 w-3" /> Kosong (Empty)
                    </Badge>
                  )}
                </div>

                {selectedSlot.status === "OCCUPIED" ? (
                  <div className="space-y-3 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono">Nama Barang / SKU</span>
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{selectedSlot.itemName}</p>
                      <p className="text-xs font-mono text-blue-600 dark:text-blue-400">{selectedSlot.sku}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-mono">Stok Saat Ini</span>
                        <p className="text-base font-bold text-emerald-600">{selectedSlot.quantity} Unit</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-mono">Kapasitas Maks</span>
                        <p className="text-base font-semibold text-slate-700 dark:text-slate-300">{selectedSlot.maxCapacity} Unit</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 text-center border border-dashed border-rose-200 dark:border-rose-900/50 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 space-y-2">
                    <Package className="h-8 w-8 text-rose-400 mx-auto opacity-60" />
                    <p className="text-xs font-semibold text-rose-700 dark:text-rose-400">Slot ini siap ditempati</p>
                    <p className="text-[11px] text-slate-500">Staf dapat melakukan alokasi Inbound barang ke slot ini.</p>
                  </div>
                )}

                <div className="pt-2">
                  <Button variant="outline" className="w-full text-xs h-9 rounded-xl gap-2">
                    <ShieldAlert className="h-3.5 w-3.5 text-blue-600" />
                    <span>Audit Slot Ini via QR</span>
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-xs text-slate-400 text-center py-8">Pilih salah satu slot rak di samping.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}