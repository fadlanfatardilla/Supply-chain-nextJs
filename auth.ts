import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password || !credentials?.role) {
          return null;
        }

        // 1. Cari user di database berdasarkan email
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user) return null;

        // 2. Cek kecocokan password dengan bcrypt
        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) return null;

        // 3. 🔒 VALIDASI KETAT ROLE: 
        // Tolak login jika role user di database tidak sama dengan role yang dipilih di form login!
        if (user.role !== credentials.role) {
          return null; // Ini akan memicu error CredentialsSignin ("Email, password, atau role tidak valid.")
        }

        // 4. Jika lolos semua, kembalikan data user
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role, 
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as any;
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});