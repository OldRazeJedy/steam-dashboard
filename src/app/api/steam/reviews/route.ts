import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { SteamReviewResponse } from "~/types/steam";

// Constants for API requests
const STEAM_API_TIMEOUT_MS = 5000;
const USER_AGENT = "Steam Review Explorer";

// Cache configuration
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const reviewCache = new Map<
  string,
  { data: SteamReviewResponse; timestamp: number }
>();

/**
 * Schema for validating review query parameters
 */
const reviewQuerySchema = z.object({
  appId: z.string().min(1, "App ID is required"),
  filter: z.string().optional(),
  language: z.string().optional(),
  day_range: z.coerce.number().optional(),
  cursor: z.string().optional(),
  review_type: z.enum(["all", "positive", "negative"]).optional(),
  purchase_type: z.enum(["all", "steam", "non_steam_purchase"]).optional(),
  num_per_page: z.coerce.number().min(1).max(100).optional(),
  page: z.coerce.number().optional(),
});

/**
 * Type for validated query parameters
 */
type ReviewQueryParams = z.infer<typeof reviewQuerySchema>;

/**
 * Generates a cache key based on request parameters
 */
function getCacheKey(params: ReviewQueryParams): string {
  return `${params.appId}-${params.filter}-${params.language}-${params.day_range}-${params.cursor}-${params.review_type}-${params.purchase_type}-${params.num_per_page}`;
}

/**
 * Fetches game reviews from Steam API
 * @param request - The incoming request with query parameters
 * @returns JSON response with review data or error information
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);

    const validatedParams = reviewQuerySchema.safeParse(
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

    const { appId, cursor, ...options } = validatedParams.data;

    // Check cache first
    const cacheKey = getCacheKey(validatedParams.data);
    if (reviewCache.has(cacheKey)) {
      const cachedData = reviewCache.get(cacheKey)!;
      if (Date.now() - cachedData.timestamp < CACHE_TTL_MS) {
        return NextResponse.json(cachedData.data);
      }
      // Cache expired, remove it
      reviewCache.delete(cacheKey);
    }

    const steamUrl = new URL(
      "https://store.steampowered.com/appreviews/" + appId,
    );
    steamUrl.searchParams.append("json", "1");

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

    // Create an AbortController to handle request timeout
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

      const data = (await response.json()) as SteamReviewResponse;

      // Cache the successful response
      reviewCache.set(cacheKey, { data, timestamp: Date.now() });

      return NextResponse.json(data);
    } catch (fetchError) {
      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        return NextResponse.json(
          { error: "Steam API request timed out" },
          { status: 504 },
        );
      }
      throw fetchError; // Re-throw to be caught by outer try/catch
    }
  } catch (error) {
    console.error("Steam API error:", error);
    return NextResponse.json(
      {
        error: "Failed to retrieve data from Steam API",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * Handle OPTIONS requests for CORS preflight
 */
export async function OPTIONS(): Promise<NextResponse> {
  return NextResponse.json(
    {},
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    },
  );
}
