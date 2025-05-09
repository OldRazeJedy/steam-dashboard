// src/app/api/steam/players/route.ts
import { type NextRequest, NextResponse } from "next/server";
import type { PlayerSummary } from "~/types/steam";
import { z } from "zod";

// Constants
const MAX_STEAM_IDS = 100;
const STEAM_API_TIMEOUT_MS = 5000;
const STEAM_API_BASE_URL =
  "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/";
const USER_AGENT = "Steam Review Explorer";

interface GetPlayerSummariesResponse {
  response: {
    players: PlayerSummary[];
  };
}

// Simple in-memory cache with 10-minute expiration
const playerCache = new Map<
  string,
  { data: GetPlayerSummariesResponse; timestamp: number }
>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Regex for validating Steam ID format (17-digit numeric string)
const steamIdRegex = /^\d{17}$/;

const playerQuerySchema = z.object({
  steamids: z
    .string()
    .min(1)
    .refine(
      (ids) => {
        const idArray = ids.split(",");
        return idArray.every((id) => steamIdRegex.test(id.trim()));
      },
      { message: "Invalid Steam ID format. Each ID must be a 17-digit number" },
    ),
});

/**
 * Fetches player summaries from the Steam API
 */

function buildSteamUrl(steamids: string, apiKey: string): string {
  return `${STEAM_API_BASE_URL}?key=${apiKey}&steamids=${encodeURIComponent(steamids)}`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const validatedParams = playerQuerySchema.safeParse(
      Object.fromEntries(searchParams.entries()),
    );

    if (!validatedParams.success) {
      return NextResponse.json(
        {
          error: "Incorrect query parameters",
          details: validatedParams.error.format(),
        },
        { status: 400 },
      );
    }

    const { steamids } = validatedParams.data;

    const idArray = steamids.split(",");
    if (idArray.length > MAX_STEAM_IDS) {
      return NextResponse.json(
        {
          error: `You can request a maximum of ${MAX_STEAM_IDS} Steam IDs at a time`,
        },
        { status: 400 },
      );
    }

    // Check cache first
    if (playerCache.has(steamids)) {
      const cachedData = playerCache.get(steamids)!;
      if (Date.now() - cachedData.timestamp < CACHE_TTL_MS) {
        return NextResponse.json(cachedData.data);
      }
      // Cache expired, remove it
      playerCache.delete(steamids);
    }

    const apiKey = process.env.STEAM_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key is not configured on the server" },
        { status: 500 },
      );
    }

    // replace the multiple append calls with a single helper call
    const steamUrl = buildSteamUrl(steamids, apiKey);

    // Create an AbortController to manage request timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      STEAM_API_TIMEOUT_MS,
    );

    try {
      const response = await fetch(steamUrl.toString(), {
        headers: {
          "User-Agent": USER_AGENT,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Steam API responded with status: ${response.status}`);
      }

      const data = (await response.json()) as GetPlayerSummariesResponse;

      // Cache the successful response
      playerCache.set(steamids, { data, timestamp: Date.now() });

      return NextResponse.json(data);
    } catch (fetchError) {
      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        return NextResponse.json(
          { error: "Steam API request has exceeded the waiting time" },
          { status: 504 },
        );
      }
      throw fetchError; // Re-throw to be caught by outer try/catch
    }
  } catch (error) {
    console.error("Steam API error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve player data from Steam API" },
      { status: 500 },
    );
  }
}

/**
 * Handle OPTIONS requests for CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
