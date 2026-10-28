"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "@/app/actions/auth";
import {
  UserCheck,
  Package,
  Boxes,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
} from "lucide-react";

type Role = "WAREHOUSE_MANAGER" | "STAFF";

interface RoleOption {
  id: Role;
  title: string;
  description: string;
  icon: React.ElementType;
  defaultEmail: string;
}

const ROLES: RoleOption[] = [
  {
    id: "WAREHOUSE_MANAGER",
    title: "Manager",
    description: "Kelola stok, laporan, approval & operasional gudang",
    icon: UserCheck,
    defaultEmail: "manager@supplychain.wms",
  },
  {
    id: "STAFF",
    title: "Staff",
    description: "Eksekusi transaksi inbound, outbound, & rak barang",
    icon: Package,
    defaultEmail: "staff@supplychain.wms",
  },
];

export default function LoginForm() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<Role>("WAREHOUSE_MANAGER");
  
  // Ambil konfigurasi role aktif untuk placeholder dinamis
  const currentRoleConfig = ROLES.find((r) => r.id === selectedRole) || ROLES[0];

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handler saat user mengganti pilihan role
  const handleRoleSelect = (roleId: Role) => {
    setSelectedRole(roleId);
    setEmail(""); // Reset input email agar placeholder dinamis terlihat jelas
    setPassword("");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Jika input email kosong saat submit, gunakan default email sesuai role yang dipilih
    const emailToSubmit = email.trim() === "" ? currentRoleConfig.defaultEmail : email;

    try {
      const res = await loginUser({
        email: emailToSubmit,
        password,
        role: selectedRole,
      });

      if (res && !res.success) {
        setError(res.error || "Email, password, atau role tidak cocok.");
        setLoading(false);
      } else if (res?.redirectTo) {
        // Menggunakan window.location.href agar full refresh & session cookie aman dari isu cache
        window.location.href = res.redirectTo;
      }
    } catch {
      setLoading(false);
      setError("Terjadi kesalahan jaringan atau sistem.");
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 p-4 font-sans text-slate-100">
      {/* Background Decorative Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Header Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/30 mb-3">
            <Boxes className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Stokio
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Sistem Manajemen Gudang & Rantai Pasok
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/80 border border-slate-800 backdrop-blur-xl rounded-2xl p-6 shadow-2xl">
          
          {/* Role Selector Tabs (2 Kolom: Manager & Staff) */}
          <div className="mb-6">
            <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
              Pilih Role Akses
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950/60 rounded-xl border border-slate-800/80">
              {ROLES.map((role) => {
                const Icon = role.icon;
                const isActive = selectedRole === role.id;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => handleRoleSelect(role.id)}
                    className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer ${
                      isActive
                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                    }`}
                  >
                    <Icon className="w-4 h-4 mb-1" />
                    <span className="truncate w-full text-center">
                      {role.title}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Description Banner for Selected Role */}
            <div className="mt-2.5 p-2.5 rounded-lg bg-slate-800/40 border border-slate-800 text-xs text-slate-400">
              {currentRoleConfig.description}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-xs text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form Credentials */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={currentRoleConfig.defaultEmail}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 text-white font-medium py-2.5 px-4 rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 cursor-pointer"
            >
              {loading ? (
                <span>Memproses Login...</span>
              ) : (
                <>
                  <span>Masuk ke Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-600 mt-6">
          WMS System v1.0 • Hak Akses Dilindungi
        </p>
      </div>
    </div>
  );
}