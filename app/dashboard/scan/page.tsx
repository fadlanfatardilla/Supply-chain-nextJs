import { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ScanClient from "./scan-client";

export const instant = false

async function ScanContent() {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/login");
  }

  return (
    <ScanClient
      user={{
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
      }}
    />
  );
}

export default function ScanPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-slate-500">Memulai modul pemindai QR...</div>}>
      <ScanContent />
    </Suspense>
  );
}