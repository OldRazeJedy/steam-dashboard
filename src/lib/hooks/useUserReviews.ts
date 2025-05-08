import { useState, useEffect } from "react"; // React hooks for state and side effects
import {
  parseUserReviews,
  type ParsedUserReview,
} from "~/lib/steam/reviewParser";

interface UseUserReviewsResult {
  reviews: ParsedUserReview[];
  loading: boolean;
  error: Error | null;
  totalPages: number;
  currentPage: number;
  fetchPage: (page: number) => Promise<void>;
}

// Custom React hook to fetch and manage user reviews from Steam
export function useUserReviews(
  profileUrl: string | null, // URL of the user's Steam profile, or null if not set
  initialPage = 1, // The initial page number to fetch (defaults to 1)
  maxPages = 3, // Maximum number of review pages to fetch in a single call to parseUserReviews (defaults to 3)
): UseUserReviewsResult {
  const [reviews, setReviews] = useState<ParsedUserReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(initialPage);

  // Async function to fetch user reviews
  const fetchUserReviews = async () => {
    if (!profileUrl) return;

    try {
      setLoading(true);
      setError(null);

      // Call the parser to get reviews and total pages
      const { reviews: parsedReviews, totalPages: pages } =
        await parseUserReviews(profileUrl, maxPages);

      setReviews(parsedReviews); // Update reviews state
      setTotalPages(pages); // Update total pages state
    } catch (err) {
      console.error("Error fetching user reviews:", err); // Log the error
      // Set the error state
      setError(
        err instanceof Error ? err : new Error("Failed to fetch user reviews"),
      );
    } finally {
      setLoading(false); // Set loading state to false
    }
  };

  // Async function to fetch a specific page of reviews
  // Note: The current implementation of parseUserReviews fetches multiple pages up to `maxPages`
  // and doesn't support fetching a *specific* single page directly yet.
  // This fetchPage function re-triggers fetchUserReviews, which fetches from the beginning up to maxPages.
  // For true pagination of individual pages, parseUserReviews would need to support a page parameter.
  const fetchPage = async (page: number) => {
    if (!profileUrl || page < 1 || page > totalPages) return; // Validate page number

    try {
      setLoading(true);
      setError(null);
      setCurrentPage(page);

      // Re-fetch reviews. This will fetch from page 1 up to `maxPages` again.
      // To implement true single-page fetching, `parseUserReviews` would need modification.
      await fetchUserReviews();
    } catch (err) {
      console.error(`Error fetching page ${page}:`, err);
      setError(
        err instanceof Error ? err : new Error(`Failed to fetch page ${page}`),
      );
    } finally {
      setLoading(false);
    }
  };

  // useEffect hook to fetch reviews when the profileUrl changes or on initial load
  useEffect(() => {
    if (profileUrl) {
      fetchUserReviews(); // Fetch reviews if profileUrl is present
    } else {
      // Reset state if profileUrl is not present
      setReviews([]);
      setTotalPages(1);
      setCurrentPage(initialPage);
    }
  }, [profileUrl]); // Dependency array: re-run effect if profileUrl changes

  // Return the state and functions to be used by the component
  return {
    reviews,
    loading,
    error,
    totalPages,
    currentPage,
    fetchPage,
  };
}
