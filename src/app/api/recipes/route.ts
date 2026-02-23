import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";

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
  const status = searchParams.get("status");

  const where: Prisma.RecipeWhereInput = {
    ...(name
      ? {
          name: {
            contains: name,
            mode: "insensitive" as const
          }
        }
      : {}),
    ...(ingredient
      ? {
          ingredients: {
            some: {
              name: {
                contains: ingredient,
                mode: "insensitive" as const
              }
            }
          }
        }
      : {}),
    ...(cuisineType
      ? {
          cuisineType: {
            contains: cuisineType,
            mode: "insensitive" as const
          }
        }
      : {}),
    ...(status ? { status } : {})
  };

  const recipes = await prisma.recipe.findMany({
    where,
    include: {
      createdBy: {
        select: { id: true, name: true, email: true, role: true }
      },
      sharedWith: {
        select: { id: true, name: true, email: true }
      },
      ingredients: {
        select: { name: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({
    data: recipes.map((recipe) => ({
      ...recipe,
      ingredients: recipe.ingredients.map((i) => i.name)
    }))
  });
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
      instructions: parsed.data.instructions,
      cuisineType: parsed.data.cuisineType,
      prepTime: parsed.data.prepTime,
      status: parsed.data.status,
      createdById: session.user.id,
      ingredients: {
        create: parsed.data.ingredients.map((name: string) => ({
          name
        }))
      },
      ...(parsed.data.sharedWithIds
        ? {
            sharedWith: {
              connect: parsed.data.sharedWithIds.map((id: string) => ({
                id
              }))
            }
          }
        : {})
    },
    include: {
      ingredients: { select: { name: true } },
      createdBy: {
        select: { id: true, name: true, email: true, role: true }
      },
      sharedWith: {
        select: { id: true, name: true, email: true }
      }
    }
  });

  return NextResponse.json(
    {
      data: {
        ...recipe,
        ingredients: recipe.ingredients.map((i) => i.name)
      }
    },
    { status: 201 }
  );
}