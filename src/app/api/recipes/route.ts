import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { RECIPE_STATUSES, type RecipeStatus } from "@/types/domain";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recipeCreateSchema } from "@/lib/validators";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name");
  const ingredient = searchParams.get("ingredient");
  const cuisineType = searchParams.get("cuisineType");
  const prepTime = searchParams.get("prepTime");
  const statusValue = searchParams.get("status");
  const status = RECIPE_STATUSES.includes(statusValue as RecipeStatus)
    ? (statusValue as RecipeStatus)
    : undefined;
  const tags = searchParams.get("tags");

  const baseWhere = {
    OR: [
      { createdById: session.user.id },
      { sharedWith: { some: { id: session.user.id } } }
    ]
  };

  const tagList = tags
    ? tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
    : [];

  const prepTimeValue = prepTime ? Number(prepTime) : undefined;
  const ingredientFilter = ingredient
    ? { ingredients: { some: { name: { contains: ingredient, mode: "insensitive" } } } }
    : undefined;

  const tagFilters = tagList.length
    ? {
        OR: tagList.flatMap((tag) => [
          { ingredients: { some: { name: { contains: tag, mode: "insensitive" } } } },
          { cuisineType: { contains: tag, mode: "insensitive" } }
        ])
      }
    : undefined;

  const conditions = [
    baseWhere,
    {
      ...(name ? { name: { contains: name, mode: "insensitive" } } : undefined),
      ...(ingredientFilter ?? undefined),
      ...(cuisineType
        ? { cuisineType: { contains: cuisineType, mode: "insensitive" } }
        : undefined),
      ...(Number.isFinite(prepTimeValue) ? { prepTime: prepTimeValue } : undefined),
      ...(status ? { status } : undefined)
    },
    ...(tagFilters ? [tagFilters] : [])
  ];

  const where = { AND: conditions };

  const recipes = await prisma.recipe.findMany({
    where,
    include: {
      createdBy: { select: { id: true, name: true, email: true, role: true } },
      sharedWith: { select: { id: true, name: true, email: true } },
      ingredients: { select: { name: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  const mapped = recipes.map((recipe) => ({
    ...recipe,
    ingredients: recipe.ingredients.map((item) => item.name)
  }));

  return NextResponse.json({ data: mapped });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = recipeCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const recipe = await prisma.recipe.create({
    data: {
      name: parsed.data.name,
      ingredients: {
        create: parsed.data.ingredients.map((item) => ({ name: item }))
      },
      instructions: parsed.data.instructions,
      cuisineType: parsed.data.cuisineType,
      prepTime: parsed.data.prepTime,
      status: (parsed.data.status as RecipeStatus) ?? "TO_TRY",
      createdById: session.user.id,
      sharedWith: parsed.data.sharedWithIds?.length
        ? {
            connect: parsed.data.sharedWithIds.map((id) => ({ id }))
          }
        : undefined
    },
    include: {
      createdBy: { select: { id: true, name: true, email: true, role: true } },
      sharedWith: { select: { id: true, name: true, email: true } },
      ingredients: { select: { name: true } }
    }
  });

  return NextResponse.json(
    {
      data: {
        ...recipe,
        ingredients: recipe.ingredients.map((item) => item.name)
      }
    },
    { status: 201 }
  );
}
