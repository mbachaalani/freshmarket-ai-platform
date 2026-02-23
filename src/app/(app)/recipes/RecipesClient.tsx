"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import LoadingSpinner from "@/components/LoadingSpinner";

type Recipe = {
  id: string;
  name: string;
  ingredients: string[];
  instructions: string;
  cuisineType: string;
  prepTime: number;
  status: "FAVORITE" | "TO_TRY" | "MADE";
  createdById: string;
  sharedWith: { id: string; name: string | null; email: string | null }[];
};

type User = {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
};

const emptyForm = {
  name: "",
  ingredients: "",
  instructions: "",
  cuisineType: "",
  prepTime: 10,
  status: "TO_TRY" as Recipe["status"],
  sharedWithIds: [] as string[]
};

export default function RecipesClient() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    name: "",
    ingredient: "",
    cuisineType: "",
    prepTime: "",
    status: "",
    tags: ""
  });
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [aiResult, setAiResult] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.name) params.set("name", filters.name);
    if (filters.ingredient) params.set("ingredient", filters.ingredient);
    if (filters.cuisineType) params.set("cuisineType", filters.cuisineType);
    if (filters.prepTime) params.set("prepTime", filters.prepTime);
    if (filters.status) params.set("status", filters.status);
    if (filters.tags) params.set("tags", filters.tags);
    return params.toString();
  }, [filters]);

  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/recipes?${queryString}`);
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "Failed to load recipes.");
      }
      setRecipes(result.data ?? []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  const fetchUsers = useCallback(async () => {
    const response = await fetch("/api/users");
    const result = await response.json();
    if (response.ok) {
      setUsers(result.data ?? []);
    }
  }, []);

  useEffect(() => {
    fetchRecipes();
    fetchUsers();
  }, [fetchRecipes, fetchUsers]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.ingredients || !form.instructions) {
      setError("Name, ingredients, and instructions are required.");
      return;
    }
    const payload = {
      name: form.name,
      ingredients: form.ingredients
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      instructions: form.instructions,
      cuisineType: form.cuisineType,
      prepTime: Number(form.prepTime),
      status: form.status,
      sharedWithIds: form.sharedWithIds
    };

    const response = await fetch(editingId ? `/api/recipes/${editingId}` : "/api/recipes", {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const result = await response.json();
      setError(result.error ?? "Failed to save recipe.");
      return;
    }

    resetForm();
    fetchRecipes();
  };

  const handleEdit = (recipe: Recipe) => {
    setEditingId(recipe.id);
    setForm({
      name: recipe.name,
      ingredients: recipe.ingredients.join(", "),
      instructions: recipe.instructions,
      cuisineType: recipe.cuisineType,
      prepTime: recipe.prepTime,
      status: recipe.status,
      sharedWithIds: recipe.sharedWith.map((user) => user.id)
    });
  };

  const handleDelete = async (id: string) => {
    const response = await fetch(`/api/recipes/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const result = await response.json();
      setError(result.error ?? "Failed to delete recipe.");
      return;
    }
    fetchRecipes();
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const runAi = async (endpoint: string, body: Record<string, unknown>) => {
    setAiLoading(true);
    setAiResult("");
    try {
      const response = await fetch(`/api/ai/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
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
          <h1 className="text-2xl font-semibold">Recipes</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage recipes, collaborate, and generate meal plans with AI.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="btn-secondary"
            onClick={() => {
              const ingredientsList = form.ingredients
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean);
              if (!ingredientsList.length) {
                setAiResult("Add ingredients before generating a recipe.");
                return;
              }
              runAi("recipe-generate", { ingredients: ingredientsList });
            }}
          >
            Generate Recipe
          </button>
          <button
            className="btn-secondary"
            onClick={() => {
              if (!form.instructions.trim()) {
                setAiResult("Add instructions before improving a recipe.");
                return;
              }
              runAi("recipe-improve", { recipe: form.instructions });
            }}
          >
            Improve Recipe
          </button>
          <button
            className="btn-secondary"
            onClick={() => runAi("meal-plan", { preferences: filters.tags })}
          >
            7-Day Meal Plan
          </button>
          <button
            className="btn-secondary"
            onClick={() => {
              if (!selectedIds.length) {
                setAiResult("Select at least one recipe for a grocery list.");
                return;
              }
              runAi("grocery-list", { recipeIds: selectedIds });
            }}
          >
            Grocery List
          </button>
        </div>
      </div>

      {aiLoading ? <LoadingSpinner /> : null}
      {aiResult ? <div className="card whitespace-pre-wrap text-sm">{aiResult}</div> : null}

      <div className="card space-y-4">
        <h2 className="text-lg font-semibold">Search Filters</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <input
            className="input"
            placeholder="Name"
            value={filters.name}
            onChange={(event) => setFilters({ ...filters, name: event.target.value })}
          />
          <input
            className="input"
            placeholder="Ingredient"
            value={filters.ingredient}
            onChange={(event) => setFilters({ ...filters, ingredient: event.target.value })}
          />
          <input
            className="input"
            placeholder="Cuisine Type"
            value={filters.cuisineType}
            onChange={(event) => setFilters({ ...filters, cuisineType: event.target.value })}
          />
          <input
            className="input"
            type="number"
            placeholder="Prep Time (minutes)"
            value={filters.prepTime}
            onChange={(event) => setFilters({ ...filters, prepTime: event.target.value })}
          />
          <select
            className="input"
            value={filters.status}
            onChange={(event) => setFilters({ ...filters, status: event.target.value })}
          >
            <option value="">All status</option>
            <option value="FAVORITE">Favorite</option>
            <option value="TO_TRY">To try</option>
            <option value="MADE">Made</option>
          </select>
          <input
            className="input"
            placeholder="Tag filter (comma separated)"
            value={filters.tags}
            onChange={(event) => setFilters({ ...filters, tags: event.target.value })}
          />
        </div>
      </div>

      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{editingId ? "Edit Recipe" : "Add Recipe"}</h2>
          {editingId ? (
            <button className="btn-secondary" onClick={resetForm}>
              Cancel
            </button>
          ) : null}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            className="input"
            placeholder="Recipe name"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
          <input
            className="input"
            placeholder="Ingredients (comma separated)"
            value={form.ingredients}
            onChange={(event) => setForm({ ...form, ingredients: event.target.value })}
          />
          <input
            className="input"
            placeholder="Cuisine type"
            value={form.cuisineType}
            onChange={(event) => setForm({ ...form, cuisineType: event.target.value })}
          />
          <input
            className="input"
            type="number"
            min="1"
            placeholder="Prep time (minutes)"
            value={form.prepTime}
            onChange={(event) => setForm({ ...form, prepTime: Number(event.target.value) })}
          />
          <select
            className="input"
            value={form.status}
            onChange={(event) =>
              setForm({ ...form, status: event.target.value as Recipe["status"] })
            }
          >
            <option value="FAVORITE">Favorite</option>
            <option value="TO_TRY">To try</option>
            <option value="MADE">Made</option>
          </select>
          <select
            className="input"
            multiple
            value={form.sharedWithIds}
            onChange={(event) =>
              setForm({
                ...form,
                sharedWithIds: Array.from(event.target.selectedOptions).map(
                  (option) => option.value
                )
              })
            }
          >
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name ?? user.email ?? user.id}
              </option>
            ))}
          </select>
        </div>
        <textarea
          className="input min-h-[120px]"
          placeholder="Instructions"
          value={form.instructions}
          onChange={(event) => setForm({ ...form, instructions: event.target.value })}
        />
        <button className="btn w-full md:w-auto" onClick={handleSubmit}>
          {editingId ? "Save Changes" : "Add Recipe"}
        </button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <div className="card text-sm text-red-500">{error}</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th></th>
                <th>Name</th>
                <th>Cuisine</th>
                <th>Prep Time</th>
                <th>Status</th>
                <th>Shared With</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {recipes.length ? (
                recipes.map((recipe) => (
                  <tr key={recipe.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(recipe.id)}
                        onChange={() => toggleSelected(recipe.id)}
                      />
                    </td>
                    <td>
                      <div className="font-medium">{recipe.name}</div>
                      <div className="text-xs text-slate-500">
                        {recipe.ingredients.join(", ")}
                      </div>
                    </td>
                    <td>{recipe.cuisineType}</td>
                    <td>{recipe.prepTime} min</td>
                    <td>{recipe.status.replace("_", " ")}</td>
                    <td className="text-xs text-slate-500">
                      {recipe.sharedWith.map((user) => user.name ?? user.email).join(", ") ||
                        "Private"}
                    </td>
                    <td className="space-x-2 text-right">
                      <button className="btn-secondary" onClick={() => handleEdit(recipe)}>
                        Edit
                      </button>
                      <button className="btn-secondary" onClick={() => handleDelete(recipe.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-sm text-slate-500">
                    No recipes found.
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
