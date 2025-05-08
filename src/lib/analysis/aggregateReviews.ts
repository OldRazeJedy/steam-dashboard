import { type SteamReview, type ReviewsAnalysisData } from "~/types/steam";
import { parseUserReviews } from "~/lib/steam/reviewParser";

// Function to parse a date string into a Unix timestamp (milliseconds)
function parseReviewDate(dateString: string): number | undefined {
  if (!dateString) return undefined;

  try {
    const date = new Date(dateString); // Attempt to create a Date object
    return isNaN(date.getTime()) ? undefined : date.getTime();
  } catch (error) {
    console.warn(`Помилка конвертації дати: ${dateString}`, error);
    return undefined;
  }
}

// Main function to aggregate reviewer data from initial Steam reviews
export async function aggregateReviewerData(
  initialReviews: SteamReview[], // Array of initial Steam reviews for a game
  maxPagesPerUser = 10, // Maximum number of review pages to fetch per user
  onProgress?: (processed: number, total: number) => void, // Optional callback for progress updates
  targetAppId?: string, // Optional App ID of the game being analyzed (to exclude from user's own reviews if needed)
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
  let processedCount = 0; // Counter for tracking processed authors

  // Process each unique author concurrently using Promise.allSettled
  await Promise.allSettled(
    authorList.map(async (author) => {
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
        reviews: {}, // To store individual game reviews by this author
        error: undefined, // To store any error encountered while processing this author
        totalPages: 0, // Total pages of reviews found for this user
      };

      // If profile URL is not available, mark an error and skip further processing for this author
      if (!profileUrl || profileUrl === "#") {
        analysisData.reviewers[steamId].error = "Profile URL not available";
        processedCount++;
        onProgress?.(processedCount, authorList.length); // Update progress
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
        userReviews.forEach((parsedReview) => {
          // Store the review if it's for a valid game and is a positive recommendation
          if (
            parsedReview.gameId &&
            parsedReview.recommendationType === "positive"
          ) {
            analysisData.reviewers[steamId]!.reviews[parsedReview.gameId] = {
              gameId: parsedReview.gameId,
              gameCapsuleImage: parsedReview.gameCapsuleImage,
              recommendation: parsedReview.recommendationType,
              reviewText: parsedReview.reviewText,
              reviewDate: parsedReview.reviewDate,
              reviewTimestamp: parseReviewDate(parsedReview.reviewDate), // Convert date string to timestamp
              reviewUrl: parsedReview.reviewUrl,
              playtime: parsedReview.hoursTotal,
              playtimeAtReview: parsedReview.hoursAtReview,
            };
          }
        });
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
    }),
  );

  // Return the aggregated analysis data
  return analysisData;
}
