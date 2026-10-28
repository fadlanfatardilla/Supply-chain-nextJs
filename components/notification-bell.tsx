"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Bell, CheckCircle2, AlertCircle, PackagePlus, ArrowRight, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: "INBOUND" | "ALERT" | "INFO";
  isRead: boolean;
  link?: string;
  createdAt: string;
}

interface NotificationBellProps {
  initialNotifications?: NotificationItem[];
}

export function NotificationBell({ initialNotifications = [] }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);

  // Fungsi untuk mengambil data notifikasi terbaru dari API Route Server
  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        if (data.notifications) {
          setNotifications(data.notifications);
        }
      }
    } catch (error) {
      console.error("Gagal menyinkronkan notifikasi:", error);
    }
  };

  // Polling otomatis setiap 8 detik di latar belakang
  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(() => {
      fetchNotifications();
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const toggleRead = (id: string) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, isRead: !n.isRead } : n))
    );
  };

  return (
    <div className="relative">
      {/* Tombol Lonceng Notifikasi */}
      <Button
        variant="outline"
        size="icon"
        className="relative h-10 w-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Buka Notifikasi"
      >
        <Bell className="h-5 w-5 text-slate-700 dark:text-slate-200" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white shadow-md animate-pulse">
            {unreadCount}
          </span>
        )}
      </Button>

      {/* Popover Box */}
      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute right-0 mt-3 w-88 sm:w-[400px] rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-md shadow-2xl dark:border-slate-800 dark:bg-slate-900/95 z-50 overflow-hidden"
            >
              {/* Header Popover */}
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Notifikasi Sistem
                  </h3>
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className="text-xs px-2 py-0.5">
                      {unreadCount} Baru
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400 cursor-pointer"
                    >
                      Tandai dibaca
                    </button>
                  )}
                  <button
                    onClick={clearNotifications}
                    className="text-slate-400 hover:text-red-500 transition-colors p-1 cursor-pointer"
                    title="Hapus semua"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Daftar Konten Notifikasi */}
              <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                {notifications.length === 0 ? (
                  <div className="py-12 text-center text-sm text-slate-400">
                    Tidak ada notifikasi saat ini.
                  </div>
                ) : (
                  notifications.map((item) => {
                    // Bungkus seluruh item dengan Link jika memiliki properti link
                    const contentWrapperClass = `p-4 transition-colors flex gap-3.5 items-start block w-full text-left ${
                      !item.isRead
                        ? "bg-blue-50/60 dark:bg-blue-950/30"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    }`;

                    const innerContent = (
                      <>
                        {/* Icon */}
                        <div className="mt-0.5 shrink-0">
                          {item.type === "INBOUND" ? (
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400 shadow-sm">
                              <PackagePlus className="h-5 w-5" />
                            </div>
                          ) : item.type === "ALERT" ? (
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400 shadow-sm">
                              <AlertCircle className="h-5 w-5" />
                            </div>
                          ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 shadow-sm">
                              <CheckCircle2 className="h-5 w-5" />
                            </div>
                          )}
                        </div>

                        {/* Teks Pesan */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <p className={`text-xs font-bold truncate ${!item.isRead ? "text-slate-900 dark:text-slate-100" : "text-slate-800 dark:text-slate-200"}`}>
                              {item.title}
                            </p>
                            <span className="text-[11px] text-slate-400 shrink-0 font-mono">
                              {item.createdAt}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                            {item.message}
                          </p>

                          <div className="pt-1.5 flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 group">
                            <span>Tinjau Persetujuan</span>
                            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                          </div>
                        </div>

                        {!item.isRead && (
                          <span className="h-2.5 w-2.5 rounded-full bg-blue-600 shrink-0 self-center shadow-sm" />
                        )}
                      </>
                    );

                    return item.link ? (
                      <Link
                        key={item.id}
                        href={item.link}
                        onClick={() => {
                          setIsOpen(false);
                          toggleRead(item.id);
                        }}
                        className={contentWrapperClass}
                      >
                        {innerContent}
                      </Link>
                    ) : (
                      <div
                        key={item.id}
                        onClick={() => toggleRead(item.id)}
                        className={`${contentWrapperClass} cursor-pointer`}
                      >
                        {innerContent}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer Popover */}
              <div className="border-t border-slate-100 bg-slate-50/80 px-4 py-3 text-center dark:border-slate-800 dark:bg-slate-900/50">
                <Link
                  href="/dashboard/movements"
                  onClick={() => setIsOpen(false)}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                >
                  Lihat Semua Riwayat & Persetujuan &rarr;
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}