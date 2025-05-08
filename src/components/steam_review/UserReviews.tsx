import { useUserReviews } from "~/lib/hooks/useUserReviews";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Skeleton } from "~/components/ui/skeleton";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { useState } from "react";
import Image from "next/image";
import { type ParsedUserReview } from "~/lib/steam/reviewParser";

interface UserReviewsProps {
  profileUrl: string | null;
}

export function UserReviews({ profileUrl }: UserReviewsProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const { reviews, loading, error, totalPages } = useUserReviews(
    profileUrl,
    1,
    5,
  ); // Завантажуємо максимум 5 сторінок

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
          <CardTitle>Рецензії користувача</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Рецензій не знайдено</p>
        </CardContent>
      </Card>
    );
  }

  // Пагінація для локального відображення
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedReviews = reviews.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );
  const displayedTotalPages = Math.ceil(reviews.length / ITEMS_PER_PAGE);

  const handleNextPage = () => {
    if (currentPage < displayedTotalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Рецензії користувача</span>
            <span className="text-muted-foreground text-sm font-normal">
              {reviews.length} рецензій
              {totalPages > 5 ? " (показано перші 5 сторінок)" : ""}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {paginatedReviews.map((review, index) => (
              <UserReviewCard key={index} review={review} />
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
              disabled={currentPage <= 1}
              onClick={handlePrevPage}
            >
              Назад
            </Button>
            <span className="py-2">
              Сторінка {currentPage} з {displayedTotalPages}
              {totalPages > 5 && " (з доступних " + totalPages + ")"}
            </span>
            <Button
              variant="outline"
              disabled={currentPage >= displayedTotalPages}
              onClick={handleNextPage}
            >
              Вперед
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function UserReviewCard({ review }: { review: ParsedUserReview }) {
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
                  alt="Game capsule"
                  fill
                  className="rounded object-cover"
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
                  ? "Рекомендовано"
                  : "Не рекомендовано"}
              </Badge>

              <a
                href={review.reviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-500 hover:underline"
              >
                Переглянути на Steam
              </a>
            </div>

            <div className="text-muted-foreground text-sm">
              {review.hoursTotal !== undefined && (
                <span>Награно: {review.hoursTotal} год. загалом</span>
              )}
              {review.hoursAtReview !== undefined && (
                <span>
                  {" "}
                  ({review.hoursAtReview} год. на момент рецензування)
                </span>
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
