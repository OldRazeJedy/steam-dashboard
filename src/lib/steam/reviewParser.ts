import { load } from "cheerio";

/**
 * Represents a parsed user review from a Steam profile
 */
export interface ParsedUserReview {
  gameId: string;
  gameTitle?: string;
  gameCapsuleImage: string;
  recommendationType: "positive" | "negative";
  hoursTotal?: number;
  hoursAtReview?: number;
  reviewText: string;
  reviewDate: string;
  reviewUrl: string;
  helpfulCount?: number;
  funnyCount?: number;
  awardCount?: number;
}

/**
 * Information about the pagination of reviews
 */
interface PaginationInfo {
  currentPage: number;
  totalPages: number;
}

/**
 * Parses a single page of Steam user reviews from HTML
 * @param html - The HTML content of the review page
 * @returns Object containing parsed reviews and pagination information
 */
function parseReviewPage(html: string): {
  reviews: ParsedUserReview[];
  pagination: PaginationInfo;
} {
  const $ = load(html);
  const reviews: ParsedUserReview[] = [];

  // Initialize pagination with default values
  const pagination: PaginationInfo = { currentPage: 1, totalPages: 1 };

  // Extract pagination information
  const paginationBlock = $(".workshopBrowsePagingControls");
  if (paginationBlock.length) {
    const currentPageText = paginationBlock.text().trim();
    const currentPageMatch = /^\s*<\s*(\d+)/.exec(currentPageText);
    if (currentPageMatch?.[1]) {
      pagination.currentPage = parseInt(currentPageMatch[1], 10);
    }

    // Find the last page number from pagination links
    const lastPageLink = paginationBlock.find("a.pagelink").last();
    if (lastPageLink.length) {
      const lastPageHref = lastPageLink.attr("href");
      const pageMatch = lastPageHref?.match(/\?p=(\d+)/);
      if (pageMatch?.[1]) {
        pagination.totalPages = parseInt(pageMatch[1], 10);
      }
    } else {
      pagination.totalPages = 1;
    }
  }

  // Process each review on the page
  $(".review_box").each((_, reviewElement) => {
    const $review = $(reviewElement);

    // Extract game image
    const gameCapsuleImage = $review.find(".game_capsule").attr("src") ?? "";

    // Extract game ID from URL
    const gameLink = $review.find(".leftcol a").attr("href") ?? "";
    const gameIdMatch = /\/app\/(\d+)/.exec(gameLink);
    const gameId = gameIdMatch ? gameIdMatch[1]! : "";

    // Extract game title (if available)
    const gameTitle = $review.find(".title").text().trim() || undefined;

    // Determine if review is positive or negative
    const isPositive =
      $review.find(".thumb img").attr("src")?.includes("thumbsUp") ?? false;
    const recommendationType = isPositive ? "positive" : "negative";

    // Extract playtime information
    const hoursText = $review.find(".hours").text().trim();
    const hoursMatch =
      /(\d+\.?\d*)\s+hrs\s+on\s+record\s+\((\d+\.?\d*)\s+hrs\s+at\s+review\s+time\)/.exec(
        hoursText,
      );

    const hoursTotal = hoursMatch ? parseFloat(hoursMatch[1]!) : undefined;
    const hoursAtReview = hoursMatch ? parseFloat(hoursMatch[2]!) : undefined;

    // Extract review content
    const reviewText = $review.find(".content").text().trim();

    // Extract review date
    const reviewDateText = $review.find(".posted").text().trim();

    // Extract review URL
    const reviewUrl = $review.find(".title a").attr("href") ?? "";

    // Extract helpful/funny counts if available
    const voteControls = $review.find(".vote_info");
    let helpfulCount: number | undefined;
    let funnyCount: number | undefined;

    const helpfulText = voteControls.find(".helpfulCount").text().trim();
    const helpfulMatch = /(\d+)/.exec(helpfulText);
    if (helpfulMatch) {
      helpfulCount = parseInt(helpfulMatch[1]!, 10);
    }

    const funnyText = voteControls.find(".funnyCount").text().trim();
    const funnyMatch = /(\d+)/.exec(funnyText);
    if (funnyMatch) {
      funnyCount = parseInt(funnyMatch[1]!, 10);
    }

    // Count awards if present
    const awardCount = $review.find(".review_award").length || undefined;

    reviews.push({
      gameId,
      gameTitle,
      gameCapsuleImage,
      recommendationType,
      hoursTotal,
      hoursAtReview,
      reviewText,
      reviewDate: reviewDateText,
      reviewUrl,
      helpfulCount,
      funnyCount,
      awardCount,
    });
  });

  return { reviews, pagination };
}

/**
 * Fetches and parses all user reviews from a Steam profile
 * @param steamProfileUrl - URL of the Steam profile
 * @param maxPages - Maximum number of pages to fetch (default: 10)
 * @returns Object containing all parsed reviews and the total number of pages
 * @throws Error if fetching or parsing fails
 */
export async function parseUserReviews(
  steamProfileUrl: string,
  maxPages = 100,
): Promise<{ reviews: ParsedUserReview[]; totalPages: number }> {
  try {
    // Ensure URL format is consistent
    const baseReviewsUrl = steamProfileUrl.endsWith("/")
      ? `${steamProfileUrl}recommended/`
      : `${steamProfileUrl}/recommended/`;

    // Fetch first page to determine total pages
    const firstPageResponse = await fetch(
      `/api/steam/proxy?url=${encodeURIComponent(baseReviewsUrl)}`,
    );
    if (!firstPageResponse.ok) {
      throw new Error(
        `Failed to fetch reviews: ${firstPageResponse.status} ${firstPageResponse.statusText}`,
      );
    }

    const firstPageHtml = await firstPageResponse.text();
    const firstPageResult = parseReviewPage(firstPageHtml);

    let allReviews = [...firstPageResult.reviews];
    const totalPages = firstPageResult.pagination.totalPages;

    // Determine how many additional pages to fetch
    const pagesToFetch = Math.min(totalPages, maxPages);

    // Fetch remaining pages in parallel
    if (pagesToFetch > 1) {
      const pagePromises: Promise<ParsedUserReview[]>[] = [];

      for (let page = 2; page <= pagesToFetch; page++) {
        const pageUrl = `${baseReviewsUrl}?p=${page}`;
        pagePromises.push(
          fetch(`/api/steam/proxy?url=${encodeURIComponent(pageUrl)}`)
            .then((response) => {
              if (!response.ok) {
                throw new Error(
                  `Failed to fetch page ${page}: ${response.status} ${response.statusText}`,
                );
              }
              return response.text();
            })
            .then((html) => {
              const { reviews } = parseReviewPage(html);
              return reviews;
            }),
        );
      }

      // Wait for all pages to be fetched and combine results
      const additionalReviews = await Promise.all(pagePromises);
      for (const reviews of additionalReviews) {
        allReviews = [...allReviews, ...reviews];
      }
    }

    return { reviews: allReviews, totalPages };
  } catch (error) {
    console.error("Error parsing user reviews:", error);
    throw error instanceof Error
      ? error
      : new Error("Unknown error parsing user reviews");
  }
}
