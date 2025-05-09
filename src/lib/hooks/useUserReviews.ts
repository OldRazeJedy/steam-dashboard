import { useState, useEffect, useCallback } from "react";
import {
  parseUserReviews,
  type ParsedUserReview,
} from "~/lib/steam/reviewParser";

/**
 * Result of the useUserReviews hook
 */
interface UseUserReviewsResult {
  reviews: ParsedUserReview[];
  loading: boolean;
  error: Error | null;
  totalPages: number;
  currentPage: number;
  fetchPage: (page: number) => Promise<void>;
}

/**
 * Hook for fetching and managing Steam user reviews
 *
 * @param profileUrl - The Steam profile URL to fetch reviews from
 * @param initialPage - Initial page to load (default: 1)
 * @param maxPages - Maximum number of pages to fetch (default: 3)
 * @returns Object containing reviews, loading state, error state, and pagination controls
 */
export function useUserReviews(
  profileUrl: string | null,
  initialPage = 1,
  maxPages = 3,
): UseUserReviewsResult {
  const [reviews, setReviews] = useState<ParsedUserReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(initialPage);

  /**
   * Fetches reviews from the Steam profile
   */
  const fetchUserReviews = useCallback(
    async (page = 1): Promise<void> => {
      if (!profileUrl) return;

      try {
        setLoading(true);
        setError(null);

        // The API only supports fetching from page 1, so we need to adjust maxPages
        // based on the requested page to ensure we get the data we need
        const pageToFetch = Math.min(page, maxPages);
        const effectiveMaxPages = Math.max(pageToFetch, maxPages);

        const { reviews: parsedReviews, totalPages: pages } =
          await parseUserReviews(profileUrl, effectiveMaxPages);

        setReviews(parsedReviews);
        setTotalPages(pages);
      } catch (err) {
        console.error("Error fetching user reviews:", err);
        setError(
          err instanceof Error
            ? err
            : new Error("Failed to fetch user reviews"),
        );
      } finally {
        setLoading(false);
      }
    },
    [profileUrl, maxPages],
  );

  /**
   * Fetches a specific page of reviews
   *
   * @param page - The page number to fetch
   */
  const fetchPage = async (page: number): Promise<void> => {
    if (!profileUrl || page < 1) return;

    try {
      setLoading(true);
      setError(null);
      setCurrentPage(page);

      await fetchUserReviews(page);
    } catch (err) {
      console.error(`Error fetching page ${page}:`, err);
      setError(
        err instanceof Error ? err : new Error(`Failed to fetch page ${page}`),
      );
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch when profileUrl changes
  useEffect(() => {
    if (profileUrl) {
      setCurrentPage(initialPage);
      fetchUserReviews(initialPage).catch((err) => {
        console.error("Failed to fetch initial reviews:", err);
      });
    } else {
      setReviews([]);
      setTotalPages(1);
      setCurrentPage(initialPage);
      setError(null);
    }
  }, [profileUrl, initialPage, fetchUserReviews]);

  return {
    reviews,
    loading,
    error,
    totalPages,
    currentPage,
    fetchPage,
  };
}
