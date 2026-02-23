import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { InventoryCategory, InventoryStatus, Unit } from "@/types/domain";
import { z } from "zod";

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

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const item = await prisma.inventoryItem.findUnique({
    where: { id: params.id },
    include: {
      createdBy: { select: { id: true, name: true, email: true, role: true } }
    }
  });

  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ data: item });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

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
      where: { id: params.id },
      data: {
        quantity: quantityParsed.data,
        status: computeStatus(quantityParsed.data)
      }
    });
    return NextResponse.json({ data: updated });
  }

  const parsed = inventoryUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = {
    ...(parsed.data.name ? { name: parsed.data.name } : undefined),
    ...(parsed.data.category
      ? { category: parsed.data.category as InventoryCategory }
      : undefined),
    ...(parsed.data.quantity !== undefined ? { quantity: parsed.data.quantity } : undefined),
    ...(parsed.data.unit ? { unit: parsed.data.unit as Unit } : undefined),
    ...(parsed.data.costPrice !== undefined ? { costPrice: parsed.data.costPrice } : undefined),
    ...(parsed.data.sellingPrice !== undefined
      ? { sellingPrice: parsed.data.sellingPrice }
      : undefined),
    ...(parsed.data.supplier ? { supplier: parsed.data.supplier } : undefined),
    ...(parsed.data.expirationDate
      ? { expirationDate: new Date(parsed.data.expirationDate) }
      : undefined)
  } as const;

  const updated = await prisma.inventoryItem.update({
    where: { id: params.id },
    data: {
      ...data,
      ...(parsed.data.quantity !== undefined
      ? { status: computeStatus(parsed.data.quantity, parsed.data.status as InventoryStatus) }
        : parsed.data.status
        ? { status: parsed.data.status as InventoryStatus }
        : undefined)
    }
  });

  return NextResponse.json({ data: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canDeleteInventory(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.inventoryItem.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
