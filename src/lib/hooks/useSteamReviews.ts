import { useEffect, useState, useCallback, useMemo } from "react";
import { steamClient } from "~/lib/steam/client";
import type { SteamReview, QuerySummary } from "~/types/steam";

/**
 * Options for fetching Steam reviews
 */
interface UseSteamReviewsOptions {
  limit?: number;
  filter?: string;
  language?: string;
  pages?: number;
  review_type?: "all" | "positive" | "negative";
  fetchAll?: boolean;
}

/**
 * Return type for the useSteamReviews hook
 */
interface UseSteamReviewsResult {
  reviews: SteamReview[];
  summary: QuerySummary | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and manage Steam reviews for a specific app
 * @param appId - The Steam app ID to fetch reviews for
 * @param options - Options to configure the review fetching
 * @returns Object containing reviews data, loading state, and refetch function
 */
export function useSteamReviews(
  appId: string | null,
  options: UseSteamReviewsOptions = { pages: 1 },
): UseSteamReviewsResult {
  const [reviews, setReviews] = useState<SteamReview[]>([]);
  const [summary, setSummary] = useState<QuerySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Stabilize options with useMemo to prevent unnecessary re-renders
  const stableOptions = useMemo(
    () => ({
      filter: options.filter,
      language: options.language,
      limit: options.limit,
      pages: options.pages ?? 1,
      review_type: options.review_type,
      fetchAll: options.fetchAll,
    }),
    [
      options.filter,
      options.language,
      options.limit,
      options.pages,
      options.review_type,
      options.fetchAll,
    ],
  );

  /**
   * Fetches reviews from the Steam API
   * Handles pagination and applies specified options
   */
  const fetchReviews = useCallback(async () => {
    if (!appId) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch the first page of reviews
      const firstPage = await steamClient.getReviewsWithPlayerData(appId, {
        ...stableOptions,
        num_per_page: 20,
      });

      let allReviews = [...firstPage.reviews];
      let cursor = firstPage.cursor;
      setSummary(firstPage.query_summary);

      const pagesToFetch = stableOptions.pages ?? 1;

      // Handle "fetch all" mode - fetch as many reviews as possible up to the limit
      if (stableOptions.fetchAll) {
        while (cursor && allReviews.length < (stableOptions.limit ?? 500)) {
          const nextPage = await steamClient.getReviewsWithPlayerData(appId, {
            ...stableOptions,
            num_per_page: 20,
            cursor,
          });

          // Stop if we've reached the end of available reviews
          if (nextPage.reviews.length === 0) break;

          // Append new reviews to our collection
          allReviews = [...allReviews, ...nextPage.reviews];
          cursor = nextPage.cursor;

          // Hard limit to prevent excessive API calls
          if (allReviews.length >= 100) break;
        }
      } else {
        // Fetch a specific number of pages based on the options
        for (let i = 1; i < pagesToFetch && cursor; i++) {
          const nextPage = await steamClient.getReviewsWithPlayerData(appId, {
            ...stableOptions,
            num_per_page: 20,
            cursor,
          });

          // Stop if we've reached the end of available reviews
          if (nextPage.reviews.length === 0) break;

          // Append new reviews to our collection
          allReviews = [...allReviews, ...nextPage.reviews];
          cursor = nextPage.cursor;
        }
      }

      // Update state with all collected reviews
      setReviews(allReviews);
    } catch (err) {
      // Log and handle errors
      console.error("Error fetching reviews:", err);
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setLoading(false);
    }
  }, [appId, stableOptions]);

  /**
   * Effect to fetch reviews when appId changes or to reset state when appId becomes null
   */
  useEffect(() => {
    if (appId) {
      void fetchReviews();
    } else {
      setReviews([]);
      setSummary(null);
      setError(null);
    }
  }, [appId, fetchReviews]);

  return { reviews, summary, loading, error, refetch: fetchReviews };
}
