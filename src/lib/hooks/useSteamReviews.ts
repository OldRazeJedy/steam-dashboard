// src/lib/hooks/useSteamReviews.ts
import { useEffect, useState } from "react";
import { steamClient } from "~/lib/steam/client";
import type { SteamReview, QuerySummary } from "~/types/steam";

interface UseSteamReviewsOptions {
  limit?: number;
  filter?: string;
  language?: string;
  pages?: number;
  review_type?: "all" | "positive" | "negative";
  fetchAll?: boolean;
}

interface UseSteamReviewsResult {
  reviews: SteamReview[];
  summary: QuerySummary | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useSteamReviews(
  appId: string | null,
  options: UseSteamReviewsOptions = { pages: 1 },
): UseSteamReviewsResult {
  const [reviews, setReviews] = useState<SteamReview[]>([]);
  const [summary, setSummary] = useState<QuerySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchReviews = async () => {
    if (!appId) return;

    setLoading(true);
    setError(null);

    try {
      const firstPage = await steamClient.getReviewsWithPlayerData(appId, {
        ...options,
        num_per_page: 20,
      });

      let allReviews = [...firstPage.reviews];
      let cursor = firstPage.cursor;
      setSummary(firstPage.query_summary);

      const pagesToFetch = options.pages ?? 1;

      if (options.fetchAll) {
        while (cursor && allReviews.length < (options.limit ?? 500)) {
          const nextPage = await steamClient.getReviewsWithPlayerData(appId, {
            ...options,
            num_per_page: 20,
            cursor,
          });

          if (nextPage.reviews.length === 0) break;

          allReviews = [...allReviews, ...nextPage.reviews];
          cursor = nextPage.cursor;

          if (allReviews.length >= 100) break;
        }
      } else {
        for (let i = 1; i < pagesToFetch && cursor; i++) {
          const nextPage = await steamClient.getReviewsWithPlayerData(appId, {
            ...options,
            num_per_page: 20,
            cursor,
          });

          if (nextPage.reviews.length === 0) break;

          allReviews = [...allReviews, ...nextPage.reviews];
          cursor = nextPage.cursor;
        }
      }

      setReviews(allReviews);
    } catch (err) {
      console.error("Error fetching reviews:", err);
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (appId) {
      fetchReviews();
    } else {
      setReviews([]);
      setSummary(null);
      setError(null);
    }
  }, [
    appId,
    options.filter,
    options.language,
    options.limit,
    options.pages,
    options.fetchAll,
  ]);

  return { reviews, summary, loading, error, refetch: fetchReviews };
}
