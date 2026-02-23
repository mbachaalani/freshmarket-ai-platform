import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { getServerSession } from "next-auth";

import "./globals.css";
import Providers from "@/app/providers";
import { authOptions } from "@/lib/auth";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Produce Hub",
  description: "Inventory and recipe management with AI insights."
};

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen`}>
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
