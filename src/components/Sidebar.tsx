"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import clsx from "clsx";

import ThemeToggle from "@/components/ThemeToggle";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/inventory", label: "Inventory" },
  { href: "/recipes", label: "Recipes" }
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data } = useSession();

  return (
    <aside className="flex h-full w-full flex-col gap-6 border-r border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
      <div>
        <h2 className="text-lg font-semibold">Produce Hub</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Inventory & recipes</p>
      </div>

      <nav className="space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "block rounded-lg px-3 py-2 text-sm font-medium transition",
              pathname === item.href
                ? "bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mt-auto space-y-3">
        <div className="rounded-lg border border-slate-200 p-3 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-300">
          <p className="font-semibold">{data?.user?.name ?? "Signed in"}</p>
          <p>{data?.user?.email}</p>
          <p className="uppercase">{data?.user?.role}</p>
        </div>
        <ThemeToggle />
        <button className="btn-secondary w-full" onClick={() => signOut()}>
          Sign out
        </button>
      </div>
    </aside>
  );
}
