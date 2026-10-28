'use server'

import { Role } from '@prisma/client'
import { signIn, auth } from '@/auth'
import { AuthError } from 'next-auth'

export async function loginUser(formData: {
  email: string
  password: string
  role: Role
}) {
  try {
    // 1. Jalankan proses sign in dengan redirect: false agar cookie aman
    await signIn('credentials', {
      email: formData.email,
      password: formData.password,
      role: formData.role,
      redirect: false, 
    })

    // 2. Ambil session yang baru saja terbentuk untuk membaca role riil dari database/token
    const session = await auth()
    const actualRole = session?.user?.role?.toUpperCase()

    // 3. Tentukan halaman tujuan berdasarkan role asli di database/session
    const targetRedirect = actualRole === 'STAFF' ? '/dashboard/staff' : '/dashboard'

    return { success: true, redirectTo: targetRedirect }
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { success: false, error: 'Email, password, atau role tidak valid.' }
        default:
          return { success: false, error: 'Terjadi kesalahan saat memproses login.' }
      }
    }
    
    // Menangkap error turunan Next.js redirect jika terjadi secara internal
    if (error && typeof error === 'object' && 'message' in error && String(error.message).includes('NEXT_REDIRECT')) {
      // Cek ulang via session jika memungkinkan, atau fallback ke formData
      const targetRedirect = formData.role === Role.STAFF ? '/dashboard/staff' : '/dashboard'
      return { success: true, redirectTo: targetRedirect }
    }
    
    throw error
  }
}