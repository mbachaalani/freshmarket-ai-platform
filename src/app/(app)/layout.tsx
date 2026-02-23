import Link from "next/link";

import Sidebar from "@/components/Sidebar";
import ThemeToggle from "@/components/ThemeToggle";

const mobileLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/inventory", label: "Inventory" },
  { href: "/recipes", label: "Recipes" }
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="flex min-h-screen">
        <div className="hidden w-64 lg:block">
          <Sidebar />
        </div>
        <div className="flex-1">
          <div className="border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-950 lg:hidden">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Produce Hub</span>
              <ThemeToggle />
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {mobileLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-full bg-slate-100 px-3 py-1 text-slate-700 dark:bg-slate-900 dark:text-slate-200"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <main className="px-6 py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
