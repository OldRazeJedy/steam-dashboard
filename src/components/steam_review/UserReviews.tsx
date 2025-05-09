import { useUserReviews } from "~/lib/hooks/useUserReviews";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Skeleton } from "~/components/ui/skeleton";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { useState, type JSX } from "react";
import Image from "next/image";
import { type ParsedUserReview } from "~/lib/steam/reviewParser";

interface UserReviewsProps {
  profileUrl: string | null;
}

/**
 * Component to display a user's Steam reviews with pagination
 */
export function UserReviews({
  profileUrl,
}: UserReviewsProps): JSX.Element | null {
  const ITEMS_PER_PAGE = 10;
  const MAX_STEAM_PAGES = 10; // Maximum number of pages to fetch from Steam API

  // Use the hook with proper pagination
  const { reviews, loading, error, totalPages } = useUserReviews(
    profileUrl,
    1,
    MAX_STEAM_PAGES,
  );

  // Client-side pagination state
  const [clientPage, setClientPage] = useState(1);

  if (!profileUrl) return null;

  if (loading && reviews.length === 0) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }

  if (reviews.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No reviews found</p>
        </CardContent>
      </Card>
    );
  }

  // Client-side pagination for local display
  const startIndex = (clientPage - 1) * ITEMS_PER_PAGE;
  const paginatedReviews = reviews.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );
  const displayedTotalPages = Math.ceil(reviews.length / ITEMS_PER_PAGE);

  const handleNextPage = (): void => {
    if (clientPage < displayedTotalPages) {
      setClientPage(clientPage + 1);
    }
  };

  const handlePrevPage = (): void => {
    if (clientPage > 1) {
      setClientPage(clientPage - 1);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>User reviews</span>
            <span className="text-muted-foreground text-sm font-normal">
              {reviews.length} reviews
              {totalPages > MAX_STEAM_PAGES
                ? ` (showing first ${MAX_STEAM_PAGES} pages)`
                : ""}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {paginatedReviews.map((review, index) => (
              <UserReviewCard
                key={`${review.gameId}-${index}`}
                review={review}
              />
            ))}
          </div>

          {loading && (
            <div className="py-4 text-center">
              <Skeleton className="mx-auto h-8 w-32" />
            </div>
          )}

          <div className="mt-6 flex justify-between">
            <Button
              variant="outline"
              disabled={clientPage <= 1}
              onClick={handlePrevPage}
            >
              Back
            </Button>
            <span className="py-2">
              Page {clientPage} of {displayedTotalPages}
              {totalPages > MAX_STEAM_PAGES && ` (of ${totalPages})`}
            </span>
            <Button
              variant="outline"
              disabled={clientPage >= displayedTotalPages}
              onClick={handleNextPage}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Card component to display a single user review
 */
function UserReviewCard({ review }: { review: ParsedUserReview }): JSX.Element {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="flex-shrink-0">
            <a
              href={`https://store.steampowered.com/app/${review.gameId}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="relative h-24 w-44">
                <Image
                  src={review.gameCapsuleImage}
                  alt={review.gameTitle ?? "Game image"}
                  fill
                  className="rounded object-contain"
                  unoptimized
                />
              </div>
            </a>
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <Badge
                variant={
                  review.recommendationType === "positive"
                    ? "default"
                    : "destructive"
                }
                className="px-2 py-1"
              >
                {review.recommendationType === "positive"
                  ? "Recommended"
                  : "Not recommended"}
              </Badge>

              <a
                href={review.reviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-500 hover:underline"
              >
                View on Steam
              </a>
            </div>

            <div className="text-muted-foreground text-sm">
              {review.hoursTotal !== undefined && (
                <span>Hours played: {review.hoursTotal} total</span>
              )}
              {review.hoursAtReview !== undefined && (
                <span> ({review.hoursAtReview} hours at review time)</span>
              )}
            </div>

            <div className="text-sm">{review.reviewDate}</div>

            <div className="mt-2 text-sm">
              {review.reviewText.length > 200
                ? `${review.reviewText.substring(0, 200)}...`
                : review.reviewText}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
