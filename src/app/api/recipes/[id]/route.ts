import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { RecipeStatus } from "@/types/domain";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recipeUpdateSchema } from "@/lib/validators";

/**
 * GET /api/recipes/[id]
 */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const recipe = await prisma.recipe.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, name: true, email: true, role: true } },
      sharedWith: { select: { id: true, name: true, email: true } },
      ingredients: { select: { name: true } }
    }
  });

  if (!recipe) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isOwner = recipe.createdById === session.user.id;
  const isShared = recipe.sharedWith.some(
    (user) => user.id === session.user.id
  );
  const isAdmin = session.user.role === "ADMIN";

  if (!isOwner && !isShared && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    data: {
      ...recipe,
      ingredients: recipe.ingredients.map((item) => item.name)
    }
  });
}

/**
 * PUT /api/recipes/[id]
 */
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.recipe.findUnique({
    where: { id },
    include: { sharedWith: { select: { id: true } } }
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isOwner = existing.createdById === session.user.id;
  const isAdmin = session.user.role === "ADMIN";

  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = recipeUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const recipe = await prisma.recipe.update({
    where: { id },
    data: {
      ...(parsed.data.name && { name: parsed.data.name }),
      ...(parsed.data.ingredients && {
        ingredients: {
          deleteMany: {},
          create: parsed.data.ingredients.map((item) => ({
            name: item
          }))
        }
      }),
      ...(parsed.data.instructions && {
        instructions: parsed.data.instructions
      }),
      ...(parsed.data.cuisineType && {
        cuisineType: parsed.data.cuisineType
      }),
      ...(parsed.data.prepTime !== undefined && {
        prepTime: parsed.data.prepTime
      }),
      ...(parsed.data.status && {
        status: parsed.data.status as RecipeStatus
      }),
      ...(parsed.data.sharedWithIds && {
        sharedWith: {
          set: parsed.data.sharedWithIds.map((id) => ({ id }))
        }
      })
    },
    include: {
      createdBy: { select: { id: true, name: true, email: true, role: true } },
      sharedWith: { select: { id: true, name: true, email: true } },
      ingredients: { select: { name: true } }
    }
  });

  return NextResponse.json({
    data: {
      ...recipe,
      ingredients: recipe.ingredients.map((item) => item.name)
    }
  });
}

/**
 * DELETE /api/recipes/[id]
 */
export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.recipe.findUnique({
    where: { id }
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isOwner = existing.createdById === session.user.id;
  const isAdmin = session.user.role === "ADMIN";

  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.recipe.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}