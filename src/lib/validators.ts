import { z } from "zod";

export const inventoryCreateSchema = z.object({
  name: z.string().min(2),
  category: z.enum(["Fruit", "Vegetable", "Other"]),
  quantity: z.number().int().nonnegative(),
  unit: z.enum(["kg", "box", "piece"]),
  costPrice: z.number().nonnegative(),
  sellingPrice: z.number().nonnegative(),
  supplier: z.string().min(1),
  expirationDate: z.string().datetime(),
  status: z.enum(["IN_STOCK", "LOW_STOCK", "ORDERED", "DISCONTINUED"]).optional()
});

export const inventoryUpdateSchema = inventoryCreateSchema.partial();

export const recipeCreateSchema = z.object({
  name: z.string().min(2),
  ingredients: z.array(z.string().min(1)).min(1),
  instructions: z.string().min(5),
  cuisineType: z.string().min(2),
  prepTime: z.number().int().positive(),
  status: z.enum(["FAVORITE", "TO_TRY", "MADE"]).optional(),
  sharedWithIds: z.array(z.string().cuid()).optional()
});

export const recipeUpdateSchema = recipeCreateSchema.partial();
