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

  const soon = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
  const items = await prisma.inventoryItem.findMany({
    where: { expirationDate: { lte: soon } },
    orderBy: { expirationDate: "asc" }
  });

  if (!items.length) {
    return NextResponse.json({
      data: "No items are at spoilage risk in the next 7 days."
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
            "You analyze perishables. Suggest discount or action plans to avoid spoilage."
        },
        {
          role: "user",
          content: `Items expiring soon:\n${items
            .map(
              (item) =>
                `- ${item.name}: qty=${item.quantity} ${item.unit}, expires=${item.expirationDate.toISOString().slice(0, 10)}`
            )
            .join("\n")}\n\nRecommend discount actions in 3-5 bullets.`
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
