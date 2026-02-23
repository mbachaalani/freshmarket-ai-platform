import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { InventoryCategory, InventoryStatus, Unit } from "@/types/domain";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { inventoryCreateSchema } from "@/lib/validators";
import { canManageInventory } from "@/lib/roles";

function computeStatus(quantity: number, requested?: InventoryStatus) {
  if (quantity < 10) {
    return "LOW_STOCK";
  }
  return requested ?? "IN_STOCK";
}

function parseEnum<T extends string>(value: string | null, allowed: readonly T[]) {
  if (!value) return undefined;
  return allowed.includes(value as T) ? (value as T) : undefined;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name");
  const category = parseEnum(searchParams.get("category"), [
    "Fruit",
    "Vegetable",
    "Other"
  ] as const);
  const status = parseEnum(searchParams.get("status"), [
    "IN_STOCK",
    "LOW_STOCK",
    "ORDERED",
    "DISCONTINUED"
  ] as const);
  const supplier = searchParams.get("supplier");

  const items = await prisma.inventoryItem.findMany({
    where: {
      ...(name
        ? { name: { contains: name, mode: "insensitive" } }
        : undefined),
      ...(category ? { category } : undefined),
      ...(status ? { status } : undefined),
      ...(supplier
        ? { supplier: { contains: supplier, mode: "insensitive" } }
        : undefined)
    },
    include: {
      createdBy: { select: { id: true, name: true, email: true, role: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({ data: items });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canManageInventory(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = inventoryCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const status = computeStatus(parsed.data.quantity, parsed.data.status as InventoryStatus);

  const item = await prisma.inventoryItem.create({
    data: {
      name: parsed.data.name,
      category: parsed.data.category as InventoryCategory,
      quantity: parsed.data.quantity,
      unit: parsed.data.unit as Unit,
      costPrice: parsed.data.costPrice,
      sellingPrice: parsed.data.sellingPrice,
      supplier: parsed.data.supplier,
      expirationDate: new Date(parsed.data.expirationDate),
      status,
      createdById: session.user.id
    }
  });

  return NextResponse.json({ data: item }, { status: 201 });
}
