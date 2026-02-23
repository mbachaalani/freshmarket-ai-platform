import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import StatCard from "@/components/StatCard";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/signin");
  }

  const [totalItems, lowStockCount, items] = await Promise.all([
    prisma.inventoryItem.count(),
    prisma.inventoryItem.count({
      where: { OR: [{ status: "LOW_STOCK" }, { quantity: { lt: 10 } }] }
    }),
    prisma.inventoryItem.findMany()
  ]);

  const inventoryValue = items.reduce(
    (sum, item) => sum + item.quantity * item.sellingPrice,
    0
  );

  const soon = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
  const expiringSoon = await prisma.inventoryItem.findMany({
    where: { expirationDate: { lte: soon } },
    orderBy: { expirationDate: "asc" }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Overview of inventory health and upcoming risks.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total Items" value={totalItems} />
        <StatCard label="Low Stock" value={lowStockCount} />
        <StatCard
          label="Inventory Value"
          value={`$${inventoryValue.toFixed(2)}`}
          hint="Based on selling price"
        />
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold">Items Expiring Soon</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Next 7 days
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Quantity</th>
                <th>Expires</th>
              </tr>
            </thead>
            <tbody>
              {expiringSoon.length ? (
                expiringSoon.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>
                      {item.quantity} {item.unit}
                    </td>
                    <td>{item.expirationDate.toISOString().slice(0, 10)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-sm text-slate-500">
                    No items expiring within 7 days.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
