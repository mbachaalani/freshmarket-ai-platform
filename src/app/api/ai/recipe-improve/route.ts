import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { getOpenAIClient } from "@/lib/openai";

const schema = z.object({
  recipe: z.string().min(10)
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

  try {
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a culinary editor. Improve clarity, timing, and flavor suggestions."
        },
        {
          role: "user",
          content: `Improve this recipe:\n${parsed.data.recipe}\n\nReturn an improved version.`
        }
      ]
    });

    const text = response.choices[0]?.message?.content ?? "No improvements generated.";
    return NextResponse.json({ data: text });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "AI request failed" }, { status: 500 });
  }
}
