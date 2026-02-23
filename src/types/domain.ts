export type Role = "ADMIN" | "MANAGER" | "STAFF";
export type InventoryCategory = "Fruit" | "Vegetable" | "Other";
export type InventoryStatus = "IN_STOCK" | "LOW_STOCK" | "ORDERED" | "DISCONTINUED";
export type Unit = "kg" | "box" | "piece";
export type RecipeStatus = "FAVORITE" | "TO_TRY" | "MADE";

export const INVENTORY_CATEGORIES: InventoryCategory[] = ["Fruit", "Vegetable", "Other"];
export const INVENTORY_STATUSES: InventoryStatus[] = [
  "IN_STOCK",
  "LOW_STOCK",
  "ORDERED",
  "DISCONTINUED"
];
export const INVENTORY_UNITS: Unit[] = ["kg", "box", "piece"];
export const RECIPE_STATUSES: RecipeStatus[] = ["FAVORITE", "TO_TRY", "MADE"];
