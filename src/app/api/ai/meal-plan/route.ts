import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { getOpenAIClient } from "@/lib/openai";

const schema = z.object({
  preferences: z.string().optional()
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
            "You are a meal planner. Provide a 7-day plan with breakfast, lunch, and dinner."
        },
        {
          role: "user",
          content: `Preferences: ${parsed.data.preferences ?? "none"}\n\nGenerate a 7-day meal plan.`
        }
      ]
    });

    const text = response.choices[0]?.message?.content ?? "No meal plan generated.";
    return NextResponse.json({ data: text });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "AI request failed" }, { status: 500 });
  }
}
