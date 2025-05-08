import { type NextRequest, NextResponse } from "next/server";

// Constants for configuration
const FETCH_TIMEOUT_MS = 5000;
const CACHE_TTL_MS = 60 * 1000; // 1 minute cache
const USER_AGENT = "Steam Review Explorer";

// Simple in-memory cache
interface CacheEntry {
  content: string;
  timestamp: number;
}
const contentCache = new Map<string, CacheEntry>();

/**
 * Proxy handler for Steam Community requests
 * Fetches content from Steam Community and returns it to the client
 * Implements validation, caching and timeout handling
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get("url");

    // Validate URL parameter existence
    if (!targetUrl) {
      return NextResponse.json(
        { error: "URL parameter is required" },
        { status: 400 },
      );
    }

    // Validate that we're only proxying Steam URLs for security
    if (!targetUrl.startsWith("https://steamcommunity.com/")) {
      return NextResponse.json(
        { error: "Only Steam Community URLs are allowed" },
        { status: 403 },
      );
    }

    // Check if we have a valid cached response
    if (contentCache.has(targetUrl)) {
      const cachedEntry = contentCache.get(targetUrl)!;
      if (Date.now() - cachedEntry.timestamp < CACHE_TTL_MS) {
        // Return cached content if it's still fresh
        return new Response(cachedEntry.content, {
          headers: {
            "Content-Type": "text/html; charset=UTF-8",
            "X-Cache": "HIT",
          },
        });
      }
      // Expired cache, remove it
      contentCache.delete(targetUrl);
    }

    // Create an AbortController for timeout management
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      // Fetch the content from Steam
      const response = await fetch(targetUrl, {
        headers: {
          "User-Agent": USER_AGENT,
          "Accept-Language": "uk,uk-UA;q=0.9,en;q=0.8", // To get Ukrainian language content
        },
        signal: controller.signal,
      });

      // Clear the timeout since the request completed
      clearTimeout(timeoutId);

      if (!response.ok) {
        return NextResponse.json(
          {
            error: `Steam page responded with ${response.status}: ${response.statusText}`,
          },
          { status: response.status },
        );
      }

      const content = await response.text();

      // Store in cache
      contentCache.set(targetUrl, {
        content,
        timestamp: Date.now(),
      });

      return new Response(content, {
        headers: {
          "Content-Type": "text/html; charset=UTF-8",
          "X-Cache": "MISS",
        },
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);

      // Handle timeout specifically
      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        return NextResponse.json(
          { error: "Request to Steam timed out" },
          { status: 504 },
        );
      }

      // Re-throw to be caught by outer try/catch
      throw fetchError;
    }
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Proxy error:", error);
    return NextResponse.json(
      { error: `Failed to fetch content: ${errorMessage}` },
      { status: 500 },
    );
  }
}
