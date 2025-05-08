import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { type SteamReview } from "~/types/steam";
import { formatDistanceToNow } from "date-fns";
import { uk } from "date-fns/locale";
import Image from "next/image";

interface ReviewsPaginationProps {
  reviews: SteamReview[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onViewUserReviews?: (profileUrl: string) => void;
}

export function ReviewsPagination({
  reviews,
  currentPage,
  totalPages,
  onPageChange,
  onViewUserReviews,
}: ReviewsPaginationProps) {
  // Helper function to convert minutes to hours
  const formatPlaytime = (minutes: number) => {
    const hours = minutes / 60;
    return hours.toFixed(1);
  };

  if (reviews.length === 0) {
    return <p className="text-muted-foreground">Рецензій не знайдено</p>;
  }

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <Card key={review.recommendationid} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Image
                  src={review.author.avatarmedium ?? "/fallback-avatar.png"}
                  alt="Avatar"
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full"
                />
                <div>
                  <div className="font-medium">{review.author.personaname}</div>
                  <div className="text-muted-foreground text-xs">
                    Ігор: {review.author.num_games_owned} · Рецензій:{" "}
                    {review.author.num_reviews}
                  </div>
                </div>
              </div>

              {onViewUserReviews && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    review.author.profileurl &&
                    onViewUserReviews(review.author.profileurl)
                  }
                >
                  Переглянути рецензії користувача
                </Button>
              )}
            </div>

            <div className="mb-2 flex items-center justify-between">
              <div
                className={`rounded px-2 py-1 text-sm font-medium ${
                  review.voted_up
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {review.voted_up ? "Рекомендую" : "Не рекомендую"}
              </div>
              <div className="text-muted-foreground text-sm">
                Час гри: {formatPlaytime(review.author.playtime_forever)} годин
                {review.author.playtime_at_review !==
                  review.author.playtime_forever && (
                  <span className="ml-1">
                    ({formatPlaytime(review.author.playtime_at_review)} годин на
                    момент рецензування)
                  </span>
                )}
              </div>
            </div>

            <div
              className="mb-1 text-sm"
              dangerouslySetInnerHTML={{ __html: review.review }}
            />

            <div className="text-muted-foreground text-right text-xs">
              {formatDistanceToNow(new Date(review.timestamp_created * 1000), {
                addSuffix: true,
                locale: uk,
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePreviousPage}
          disabled={currentPage <= 1}
        >
          Назад
        </Button>
        <span className="py-2">
          Сторінка {currentPage} з {totalPages}
        </span>
        <Button
          variant="outline"
          onClick={handleNextPage}
          disabled={currentPage >= totalPages}
        >
          Вперед
        </Button>
      </div>
    </div>
  );
}
