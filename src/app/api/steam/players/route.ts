// src/app/api/steam/players/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const playerQuerySchema = z.object({
  steamids: z.string().min(1),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const validatedParams = playerQuerySchema.safeParse(
      Object.fromEntries(searchParams.entries()),
    );

    if (!validatedParams.success) {
      return NextResponse.json(
        { error: "Неправильні параметри запиту" },
        { status: 400 },
      );
    }

    const { steamids } = validatedParams.data;

    const idArray = steamids.split(",");
    if (idArray.length > 100) {
      return NextResponse.json(
        { error: "Можна запросити максимум 100 Steam ID за раз" },
        { status: 400 },
      );
    }

    const apiKey = process.env.STEAM_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "API ключ не налаштовано на сервері" },
        { status: 500 },
      );
    }

    const steamUrl = new URL(
      "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/",
    );
    steamUrl.searchParams.append("key", apiKey);
    steamUrl.searchParams.append("steamids", steamids);
    steamUrl.searchParams.append("format", "json");

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
      { error: "Не вдалося отримати дані гравців з Steam API" },
      { status: 500 },
    );
  }
}
