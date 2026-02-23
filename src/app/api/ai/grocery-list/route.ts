import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOpenAIClient } from "@/lib/openai";

const schema = z.object({
  recipeIds: z.array(z.string().cuid()).min(1)
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const recipes = await prisma.recipe.findMany({
    where: {
      id: { in: parsed.data.recipeIds },
      OR: [
        { createdById: session.user.id },
        { sharedWith: { some: { id: session.user.id } } }
      ]
    },
    include: { ingredients: { select: { name: true } } }
  });

  if (!recipes.length) {
    return NextResponse.json({ data: "No recipes found for grocery list." });
  }

  const ingredients = Array.from(
    new Set(
      recipes.flatMap((recipe) =>
        recipe.ingredients.map((item) => item.name.trim())
      )
    )
  ).filter(Boolean);

  try {
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a kitchen assistant. Turn ingredients into a clean grocery list grouped by category."
        },
        {
          role: "user",
          content: `Ingredients:\n${ingredients.join(
            ", "
          )}\n\nGenerate a grouped grocery list.`
        }
      ]
    });

    const text = response.choices[0]?.message?.content ?? "No grocery list generated.";
    return NextResponse.json({ data: text });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "AI request failed" }, { status: 500 });
  }
}
