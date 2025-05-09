import { type SteamReview, type ReviewsAnalysisData } from "~/types/steam";
import { parseUserReviews } from "~/lib/steam/reviewParser";

/**
 * Parses a date string from a review and converts it to a Unix timestamp (milliseconds)
 *
 * @param dateString - The date string to parse
 * @returns The Unix timestamp in milliseconds, or undefined if parsing failed
 */
function parseReviewDate(dateString: string): number | undefined {
  if (!dateString) return undefined;

  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? undefined : date.getTime();
  } catch (error) {
    console.warn(`Date conversion error: ${dateString}`, error);
    return undefined;
  }
}

/**
 * Aggregates reviewer data from a collection of Steam reviews, optionally fetching
 * additional review data for each reviewer from their Steam profile pages
 *
 * @param initialReviews - Array of initial Steam reviews for a game
 * @param maxPagesPerUser - Maximum number of review pages to fetch per user (default: 20)
 * @param onProgress - Optional callback for reporting progress during aggregation
 * @param targetAppId - Optional ID of the game being analyzed (to exclude from results if needed)
 * @returns Promise resolving to aggregated reviewer data structure
 */
export async function aggregateReviewerData(
  initialReviews: SteamReview[],
  maxPagesPerUser = 20,
  onProgress?: (processed: number, total: number) => void,
  targetAppId?: string,
): Promise<ReviewsAnalysisData> {
  // Filter initial reviews to include only positive recommendations
  const filteredInitialReviews = initialReviews.filter(
    (review) => review.voted_up,
  );

  // Initialize the structure for storing analysis data
  const analysisData: ReviewsAnalysisData = { reviewers: {} };

  // Use a Map to store unique authors to avoid processing duplicates
  const uniqueAuthors = new Map<string, SteamReview["author"]>();

  // Populate the uniqueAuthors Map with authors from the filtered reviews
  filteredInitialReviews.forEach((review) => {
    if (!uniqueAuthors.has(review.author.steamid)) {
      uniqueAuthors.set(review.author.steamid, review.author);
    }
  });

  // Convert the Map of unique authors to an array
  const authorList = Array.from(uniqueAuthors.values());
  let processedCount = 0;

  // Process each unique author concurrently using Promise.allSettled
  const authorPromises = authorList.map(async (author) => {
    const steamId = author.steamid;
    const profileUrl = author.profileurl;

    // Initialize data structure for the current author
    analysisData.reviewers[steamId] = {
      profile: {
        steamId: author.steamid,
        personaname: author.personaname,
        profileurl: author.profileurl,
        avatar: author.avatar,
        num_games_owned: author.num_games_owned,
        num_reviews: author.num_reviews,
      },
      reviews: {},
      totalPages: 0,
    };

    // If profile URL is not available, mark an error and skip further processing for this author
    if (!profileUrl || profileUrl === "#") {
      analysisData.reviewers[steamId].error = "Profile URL not available";
      processedCount++;
      onProgress?.(processedCount, authorList.length);
      return;
    }

    try {
      // Fetch and parse reviews for the current author
      const { reviews: userReviews, totalPages } = await parseUserReviews(
        profileUrl,
        maxPagesPerUser,
      );

      // Store the total pages of reviews found for the user
      analysisData.reviewers[steamId].totalPages = totalPages;

      // Process each parsed review from the user
      for (const parsedReview of userReviews) {
        // Skip if this is the same game we're currently analyzing (optional)
        if (targetAppId && parsedReview.gameId === targetAppId) continue;

        // Store the review if it's for a valid game and is a positive recommendation
        if (
          parsedReview.gameId &&
          parsedReview.recommendationType === "positive"
        ) {
          analysisData.reviewers[steamId].reviews[parsedReview.gameId] = {
            gameId: parsedReview.gameId,
            gameName: parsedReview.gameTitle,
            gameCapsuleImage: parsedReview.gameCapsuleImage,
            recommendation: parsedReview.recommendationType,
            reviewText: parsedReview.reviewText,
            reviewDate: parsedReview.reviewDate,
            reviewUrl: parsedReview.reviewUrl,
            playtime: parsedReview.hoursTotal,
            playtimeAtReview: parsedReview.hoursAtReview,
            reviewTimestamp: parseReviewDate(parsedReview.reviewDate) ?? 0,
          };
        }
      }
    } catch (err) {
      // Handle errors during review parsing for the current author
      console.error(`Error parsing reviews for ${steamId}:`, err);
      analysisData.reviewers[steamId].error =
        err instanceof Error ? err.message : "Unknown parsing error";
    } finally {
      // Increment processed count and update progress regardless of success or failure
      processedCount++;
      onProgress?.(processedCount, authorList.length);
    }
  });

  // Wait for all author processing to complete
  await Promise.allSettled(authorPromises);

  // Return the aggregated analysis data
  return analysisData;
}
