import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";
import { isAdminEmail } from "@/features/admin/auth";

function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}
 
export const { handlers, signIn, signOut, auth } = NextAuth({
  // Self-hosted deployments (Docker / reverse proxies) must explicitly trust the host.
  // This prevents UntrustedHost errors when hitting /api/auth/session.
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        const email = normalizeEmail(credentials?.email);
        const password = typeof credentials?.password === "string" ? credentials.password : "";

        if (!email || !password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            email: email
          }
        });

        if (!user || (!isAdminEmail(email) && user.role !== "admin")) {
          return null;
        }

        const isPasswordValid = await compare(password, user.password);

        if(!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.role = user.role ?? null;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session?.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
    authorized: async ({ auth }) => {
      // Logged in users are authenticated, otherwise redirect to login page
      return !!auth
    },
  }, 
})