import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import type { InventoryCategory, InventoryStatus, Unit } from "@/types/domain";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { inventoryUpdateSchema } from "@/lib/validators";
import { canDeleteInventory } from "@/lib/roles";

function computeStatus(quantity: number, requested?: InventoryStatus) {
  if (quantity < 10) {
    return "LOW_STOCK";
  }
  return requested ?? "IN_STOCK";
}

/**
 * GET /api/inventory/[id]
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

  const item = await prisma.inventoryItem.findUnique({
    where: { id },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true, role: true }
      }
    }
  });

  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ data: item });
}

/**
 * PUT /api/inventory/[id]
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

  const body = await req.json();

  // STAFF can only update quantity
  if (session.user.role === "STAFF") {
    const quantitySchema = z.number().int().nonnegative();
    const quantityParsed = quantitySchema.safeParse(body.quantity);

    if (!quantityParsed.success) {
      return NextResponse.json(
        { error: "Invalid quantity", details: quantityParsed.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await prisma.inventoryItem.update({
      where: { id },
      data: {
        quantity: quantityParsed.data,
        status: computeStatus(quantityParsed.data)
      }
    });

    return NextResponse.json({ data: updated });
  }

  // ADMIN / MANAGER full update
  const parsed = inventoryUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const updateData = {
    ...(parsed.data.name && { name: parsed.data.name }),
    ...(parsed.data.category && {
      category: parsed.data.category as InventoryCategory
    }),
    ...(parsed.data.quantity !== undefined && {
      quantity: parsed.data.quantity
    }),
    ...(parsed.data.unit && {
      unit: parsed.data.unit as Unit
    }),
    ...(parsed.data.costPrice !== undefined && {
      costPrice: parsed.data.costPrice
    }),
    ...(parsed.data.sellingPrice !== undefined && {
      sellingPrice: parsed.data.sellingPrice
    }),
    ...(parsed.data.supplier && {
      supplier: parsed.data.supplier
    }),
    ...(parsed.data.expirationDate && {
      expirationDate: new Date(parsed.data.expirationDate)
    })
  };

  const updated = await prisma.inventoryItem.update({
    where: { id },
    data: {
      ...updateData,
      ...(parsed.data.quantity !== undefined
        ? {
            status: computeStatus(
              parsed.data.quantity,
              parsed.data.status as InventoryStatus
            )
          }
        : parsed.data.status && {
            status: parsed.data.status as InventoryStatus
          })
    }
  });

  return NextResponse.json({ data: updated });
}

/**
 * DELETE /api/inventory/[id]
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

  if (!canDeleteInventory(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.inventoryItem.delete({
    where: { id }
  });

  return NextResponse.json({ ok: true });
}