import { load } from "cheerio";

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
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
}

function parseReviewPage(html: string): {
  reviews: ParsedUserReview[];
  pagination: PaginationInfo;
} {
  const $ = load(html);
  const reviews: ParsedUserReview[] = [];

  const pagination: PaginationInfo = { currentPage: 1, totalPages: 1 };

  const paginationBlock = $(".workshopBrowsePagingControls");
  if (paginationBlock.length) {
    const currentPageText = paginationBlock.text().trim();
    const currentPageMatch = /^\s*<\s*(\d+)/.exec(currentPageText);
    if (currentPageMatch) {
      pagination.currentPage = parseInt(currentPageMatch[1], 10);
    }

    const lastPageLink = paginationBlock.find("a.pagelink").last();
    if (lastPageLink.length) {
      const lastPageHref = lastPageLink.attr("href");
      const pageMatch = lastPageHref?.match(/\?p=(\d+)/);
      if (pageMatch) {
        pagination.totalPages = parseInt(pageMatch[1], 10);
      }
    } else {
      pagination.totalPages = 1;
    }
  }

  $(".review_box").each((_, reviewElement) => {
    const $review = $(reviewElement);

    const gameCapsuleImage = $review.find(".game_capsule").attr("src") ?? "";

    const gameLink = $review.find(".leftcol a").attr("href") ?? "";
    const gameIdMatch = /\/app\/(\d+)/.exec(gameLink);
    const gameId = gameIdMatch ? gameIdMatch[1] : "";

    const isPositive =
      $review.find(".thumb img").attr("src")?.includes("thumbsUp") ?? false;
    const recommendationType = isPositive ? "positive" : "negative";

    const hoursText = $review.find(".hours").text().trim();
    const hoursMatch =
      /(\d+\.?\d*)\s+год\.\s+загалом\s+\((\d+\.?\d*)\s+год\s+на\s+момент\s+рецензування\)/.exec(
        hoursText,
      );

    const hoursTotal = hoursMatch ? parseFloat(hoursMatch[1]) : undefined;
    const hoursAtReview = hoursMatch ? parseFloat(hoursMatch[2]) : undefined;

    const reviewText = $review.find(".content").text().trim();

    const reviewDateText = $review
      .find(".posted")
      .text()
      .trim()
      .replace("Додано", "")
      .trim();

    const reviewUrl = $review.find(".title a").attr("href") ?? "";

    reviews.push({
      gameId,
      gameCapsuleImage,
      recommendationType,
      hoursTotal,
      hoursAtReview,
      reviewText,
      reviewDate: reviewDateText,
      reviewUrl,
    });
  });

  return { reviews, pagination };
}

export async function parseUserReviews(
  steamProfileUrl: string,
  maxPages = 10,
): Promise<{ reviews: ParsedUserReview[]; totalPages: number }> {
  try {
    const baseReviewsUrl = steamProfileUrl.endsWith("/")
      ? `${steamProfileUrl}recommended/`
      : `${steamProfileUrl}/recommended/`;

    const firstPageResponse = await fetch(
      `/api/steam/proxy?url=${encodeURIComponent(baseReviewsUrl)}`,
    );
    if (!firstPageResponse.ok) {
      throw new Error(`Failed to fetch reviews: ${firstPageResponse.status}`);
    }

    const firstPageHtml = await firstPageResponse.text();
    const firstPageResult = parseReviewPage(firstPageHtml);

    let allReviews = [...firstPageResult.reviews];
    const totalPages = firstPageResult.pagination.totalPages;

    const pagesToFetch = Math.min(totalPages, maxPages);

    if (pagesToFetch > 1) {
      const pagePromises: Promise<ParsedUserReview[]>[] = [];

      for (let page = 2; page <= pagesToFetch; page++) {
        const pageUrl = `${baseReviewsUrl}?p=${page}`;
        pagePromises.push(
          fetch(`/api/steam/proxy?url=${encodeURIComponent(pageUrl)}`)
            .then((response) => {
              if (!response.ok) {
                throw new Error(
                  `Failed to fetch page ${page}: ${response.status}`,
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

      const additionalReviews = await Promise.all(pagePromises);
      additionalReviews.forEach((reviews) => {
        allReviews = [...allReviews, ...reviews];
      });
    }

    return { reviews: allReviews, totalPages };
  } catch (error) {
    console.error("Error parsing user reviews:", error);
    throw error instanceof Error
      ? error
      : new Error("Unknown error parsing user reviews");
  }
}
