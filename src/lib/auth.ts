import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";

import { prisma } from "@/lib/prisma";

type AppRole = "ADMIN" | "MANAGER" | "STAFF";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? ""
    })
  ],

  session: { strategy: "jwt" },

  pages: { signIn: "/signin" },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;

        const dbUser = await prisma.user.findUnique({
          where: { id: user.id }
        });

        token.role = (dbUser?.role ?? "ADMIN") as AppRole;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role =
          (token.role as AppRole) ?? "ADMIN";
      }

      return session;
    }
  }
};