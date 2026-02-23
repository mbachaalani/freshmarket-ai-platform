"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";

import LoadingSpinner from "@/components/LoadingSpinner";

type InventoryItem = {
  id: string;
  name: string;
  category: "Fruit" | "Vegetable" | "Other";
  quantity: number;
  unit: "kg" | "box" | "piece";
  costPrice: number;
  sellingPrice: number;
  supplier: string;
  expirationDate: string;
  status: "IN_STOCK" | "LOW_STOCK" | "ORDERED" | "DISCONTINUED";
};

const emptyForm: Omit<InventoryItem, "id"> = {
  name: "",
  category: "Fruit",
  quantity: 0,
  unit: "kg",
  costPrice: 0,
  sellingPrice: 0,
  supplier: "",
  expirationDate: "",
  status: "IN_STOCK"
};

export default function InventoryClient() {
  const { data: session } = useSession();
  const role = session?.user?.role ?? "STAFF";
  const canManage = role === "ADMIN" || role === "MANAGER";

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    name: "",
    category: "",
    status: "",
    supplier: ""
  });
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.name) params.set("name", filters.name);
    if (filters.category) params.set("category", filters.category);
    if (filters.status) params.set("status", filters.status);
    if (filters.supplier) params.set("supplier", filters.supplier);
    return params.toString();
  }, [filters]);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/inventory?${queryString}`);
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "Failed to load inventory.");
      }
      setItems(result.data ?? []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (role === "STAFF" && !editingId) return;
    if (role !== "STAFF" && (!form.name || !form.expirationDate)) {
      setError("Name and expiration date are required.");
      return;
    }
    const payload =
      role === "STAFF"
        ? { quantity: Number(form.quantity) }
        : {
            ...form,
            quantity: Number(form.quantity),
            costPrice: Number(form.costPrice),
            sellingPrice: Number(form.sellingPrice),
            expirationDate: new Date(form.expirationDate).toISOString()
          };

    const response = await fetch(editingId ? `/api/inventory/${editingId}` : "/api/inventory", {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const result = await response.json();
      setError(result.error ?? "Failed to save item.");
      return;
    }

    resetForm();
    fetchItems();
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      costPrice: item.costPrice,
      sellingPrice: item.sellingPrice,
      supplier: item.supplier,
      expirationDate: item.expirationDate.slice(0, 10),
      status: item.status
    });
  };

  const handleDelete = async (id: string) => {
    const response = await fetch(`/api/inventory/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const result = await response.json();
      setError(result.error ?? "Failed to delete item.");
      return;
    }
    fetchItems();
  };

  const runAi = async (endpoint: string) => {
    setAiLoading(true);
    setAiResult("");
    try {
      const response = await fetch(`/api/ai/${endpoint}`, { method: "POST" });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "AI request failed.");
      }
      setAiResult(result.data ?? "");
    } catch (err) {
      setAiResult((err as Error).message);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Inventory</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Track fruits and vegetables with smart AI suggestions.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-secondary" onClick={() => runAi("reorder")}>
            Smart Reorder
          </button>
          <button className="btn-secondary" onClick={() => runAi("spoilage")}>
            Spoilage Risk
          </button>
          <button className="btn-secondary" onClick={() => runAi("demand")}>
            Demand Insight
          </button>
        </div>
      </div>

      {aiLoading ? <LoadingSpinner /> : null}
      {aiResult ? <div className="card whitespace-pre-wrap text-sm">{aiResult}</div> : null}

      <div className="card space-y-4">
        <h2 className="text-lg font-semibold">Search Filters</h2>
        <div className="grid gap-3 md:grid-cols-4">
          <input
            className="input"
            placeholder="Name"
            value={filters.name}
            onChange={(event) => setFilters({ ...filters, name: event.target.value })}
          />
          <select
            className="input"
            value={filters.category}
            onChange={(event) => setFilters({ ...filters, category: event.target.value })}
          >
            <option value="">All categories</option>
            <option value="Fruit">Fruit</option>
            <option value="Vegetable">Vegetable</option>
            <option value="Other">Other</option>
          </select>
          <select
            className="input"
            value={filters.status}
            onChange={(event) => setFilters({ ...filters, status: event.target.value })}
          >
            <option value="">All status</option>
            <option value="IN_STOCK">In stock</option>
            <option value="LOW_STOCK">Low stock</option>
            <option value="ORDERED">Ordered</option>
            <option value="DISCONTINUED">Discontinued</option>
          </select>
          <input
            className="input"
            placeholder="Supplier"
            value={filters.supplier}
            onChange={(event) => setFilters({ ...filters, supplier: event.target.value })}
          />
        </div>
      </div>

      {canManage || editingId ? (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {editingId ? "Edit Item" : "Add Item"}
            </h2>
            {editingId ? (
              <button className="btn-secondary" onClick={resetForm}>
                Cancel
              </button>
            ) : null}
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <input
              className="input"
              placeholder="Name"
              value={form.name}
              disabled={!canManage}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
            <select
              className="input"
              value={form.category}
              disabled={!canManage}
              onChange={(event) =>
                setForm({ ...form, category: event.target.value as InventoryItem["category"] })
              }
            >
              <option value="Fruit">Fruit</option>
              <option value="Vegetable">Vegetable</option>
              <option value="Other">Other</option>
            </select>
            <input
              className="input"
              type="number"
              min="0"
              placeholder="Quantity"
              value={form.quantity}
              onChange={(event) => setForm({ ...form, quantity: Number(event.target.value) })}
            />
            <select
              className="input"
              value={form.unit}
              disabled={!canManage}
              onChange={(event) =>
                setForm({ ...form, unit: event.target.value as InventoryItem["unit"] })
              }
            >
              <option value="kg">kg</option>
              <option value="box">box</option>
              <option value="piece">piece</option>
            </select>
            <input
              className="input"
              type="number"
              min="0"
              placeholder="Cost Price"
              value={form.costPrice}
              disabled={!canManage}
              onChange={(event) => setForm({ ...form, costPrice: Number(event.target.value) })}
            />
            <input
              className="input"
              type="number"
              min="0"
              placeholder="Selling Price"
              value={form.sellingPrice}
              disabled={!canManage}
              onChange={(event) => setForm({ ...form, sellingPrice: Number(event.target.value) })}
            />
            <input
              className="input"
              placeholder="Supplier"
              value={form.supplier}
              disabled={!canManage}
              onChange={(event) => setForm({ ...form, supplier: event.target.value })}
            />
            <input
              className="input"
              type="date"
              value={form.expirationDate}
              disabled={!canManage}
              onChange={(event) => setForm({ ...form, expirationDate: event.target.value })}
            />
          </div>
          <button className="btn w-full md:w-auto" onClick={handleSubmit}>
            {editingId ? "Save Changes" : "Add Item"}
          </button>
          {!canManage ? (
            <p className="text-xs text-slate-500">
              Staff can update quantity only. Other fields are read-only.
            </p>
          ) : null}
        </div>
      ) : null}

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <div className="card text-sm text-red-500">{error}</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Qty</th>
                <th>Status</th>
                <th>Supplier</th>
                <th>Expires</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.length ? (
                items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.category}</td>
                    <td>
                      {item.quantity} {item.unit}
                    </td>
                    <td>{item.status.replace("_", " ")}</td>
                    <td>{item.supplier}</td>
                    <td>{item.expirationDate.slice(0, 10)}</td>
                    <td className="space-x-2 text-right">
                      <button className="btn-secondary" onClick={() => handleEdit(item)}>
                        Edit
                      </button>
                      {canManage ? (
                        <button className="btn-secondary" onClick={() => handleDelete(item.id)}>
                          Delete
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-sm text-slate-500">
                    No inventory items found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
