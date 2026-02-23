import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";

import { prisma } from "@/lib/prisma";

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
        // Force ADMIN role in DB for demo
        await prisma.user.update({
          where: { id: user.id },
          data: { role: "ADMIN" }
        });

        token.id = user.id;
        token.role = "ADMIN";
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = "ADMIN";
      }
      return session;
    }
  }
};