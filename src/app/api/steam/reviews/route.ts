// src/app/api/steam/reviews/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const reviewQuerySchema = z.object({
  appId: z.string().min(1),
  filter: z.string().optional(),
  language: z.string().optional(),
  day_range: z.coerce.number().optional(),
  cursor: z.string().optional(),
  review_type: z.enum(["all", "positive", "negative"]).optional(),
  purchase_type: z.enum(["all", "steam", "non_steam_purchase"]).optional(),
  num_per_page: z.coerce.number().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const validatedParams = reviewQuerySchema.safeParse(
      Object.fromEntries(searchParams.entries()),
    );

    if (!validatedParams.success) {
      return NextResponse.json(
        { error: "Неправильні параметри запиту" },
        { status: 400 },
      );
    }

    const { appId, cursor, ...options } = validatedParams.data;

    // Побудова URL для запиту до Steam API
    const steamUrl = new URL(
      "https://store.steampowered.com/appreviews/" + appId,
    );
    steamUrl.searchParams.append("json", "1");

    // Додавання параметрів за замовчуванням, якщо не вказано інше
    steamUrl.searchParams.append("filter", options.filter ?? "recent");
    steamUrl.searchParams.append("language", options.language ?? "all");
    steamUrl.searchParams.append("day_range", String(options.day_range ?? 0));
    steamUrl.searchParams.append("review_type", options.review_type ?? "all");
    steamUrl.searchParams.append(
      "purchase_type",
      options.purchase_type ?? "all",
    );
    steamUrl.searchParams.append(
      "num_per_page",
      String(options.num_per_page ?? 20),
    );

    if (cursor) {
      steamUrl.searchParams.append("cursor", cursor);
    }

    const response = await fetch(steamUrl.toString(), {
      headers: {
        "User-Agent": "Steam Review Explorer",
      },
    });

    if (!response.ok) {
      throw new Error(`Steam API responded with status: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Steam API error:", error);
    return NextResponse.json(
      { error: "Не вдалося отримати дані з Steam API" },
      { status: 500 },
    );
  }
}
