import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role?.toUpperCase();

  const isDashboardRoute = nextUrl.pathname.startsWith("/dashboard");
  const isStaffDashboard = nextUrl.pathname.startsWith("/dashboard/staff");
  const isAuthRoute = nextUrl.pathname.startsWith("/login");

  // 1. Jika belum login dan mencoba mengakses dashboard, lempar ke login
  if (isDashboardRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  // 2. Jika sudah login dan mencoba buka halaman login, lempar ke dashboard sesuai role masing-masing
  if (isAuthRoute && isLoggedIn) {
    const destination = userRole === "STAFF" ? "/dashboard/staff" : "/dashboard";
    return NextResponse.redirect(new URL(destination, nextUrl));
  }

  // 3. Proteksi & Routing Berbasis Role di dalam area Dashboard
  if (isLoggedIn && isDashboardRoute) {
    // Jika user adalah STAFF tapi memaksa buka /dashboard (utama manager), alihkan ke /dashboard/staff
    if (userRole === "STAFF" && nextUrl.pathname === "/dashboard") {
      return NextResponse.redirect(new URL("/dashboard/staff", nextUrl));
    }

    // Jika user adalah MANAGER (bukan staff) tapi membuka /dashboard/staff, alihkan kembali ke /dashboard
    if (userRole !== "STAFF" && isStaffDashboard) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};