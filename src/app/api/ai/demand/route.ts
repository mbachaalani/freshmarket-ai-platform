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

  const items = await prisma.inventoryItem.findMany({
    orderBy: { sellingPrice: "desc" },
    take: 20
  });

  if (!items.length) {
    return NextResponse.json({ data: "No inventory data available yet." });
  }

  try {
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a retail demand analyst. Provide a concise demand insight paragraph."
        },
        {
          role: "user",
          content: `Inventory snapshot:\n${items
            .map(
              (item) =>
                `- ${item.name}: qty=${item.quantity} ${item.unit}, price=${item.sellingPrice}`
            )
            .join("\n")}\n\nGenerate a short demand insight paragraph.`
        }
      ]
    });

    const insight = response.choices[0]?.message?.content ?? "No insight generated.";
    return NextResponse.json({ data: insight });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "AI request failed" }, { status: 500 });
  }
}
