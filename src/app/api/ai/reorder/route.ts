import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOpenAIClient } from "@/lib/openai";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const lowStockItems = await prisma.inventoryItem.findMany({
    where: {
      OR: [{ status: "LOW_STOCK" }, { quantity: { lt: 10 } }]
    },
    orderBy: { quantity: "asc" }
  });

  if (!lowStockItems.length) {
    return NextResponse.json({
      data: "All items are sufficiently stocked. No reorder suggestions needed."
    });
  }

  try {
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an inventory planner. Provide concise reorder quantities and reasoning."
        },
        {
          role: "user",
          content: `Low stock items:\n${lowStockItems
            .map(
              (item) =>
                `- ${item.name} (${item.category}) qty=${item.quantity} ${item.unit}, supplier=${item.supplier}`
            )
            .join("\n")}\n\nSuggest reorder quantities in a short list.`
        }
      ]
    });

    const suggestion = response.choices[0]?.message?.content ?? "No suggestion generated.";
    return NextResponse.json({ data: suggestion });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "AI request failed" }, { status: 500 });
  }
}
