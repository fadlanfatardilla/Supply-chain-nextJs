import { Suspense } from "react";
import { auth } from "@/auth";
import ManagerAuditScanPage from "./audit-scan-client";

// Konfigurasi wajib untuk melewati validasi instant navigation di Next.js
export const instant = false;

export default async function Page() {
  const session = await auth();
  const userRole = session?.user?.role || "STAFF";

  return (
    <Suspense fallback={<div className="flex h-96 items-center justify-center text-xs text-slate-400">Memuat Halaman Audit...</div>}>
      <ManagerAuditScanPage />
    </Suspense>
  );
}