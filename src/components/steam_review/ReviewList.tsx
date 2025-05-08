// src/components/ReviewList.tsx
import { Alert, AlertDescription } from "~/components/ui/alert";
import { ReviewSummary } from "~/components/steam_review/ReviewSummary";
import { ReviewCard } from "~/components/steam_review/ReviewCard";
import { Skeleton } from "~/components/ui/skeleton";
import type { SteamReview, QuerySummary } from "~/types/steam";

interface ReviewListProps {
  reviews: SteamReview[];
  summary: QuerySummary | null;
  loading: boolean;
  error: Error | null;
  appId: string | null;
  limit?: number;
}

export const ReviewList = ({
  reviews,
  summary,
  loading,
  error,
  appId,
  limit = 5,
}: ReviewListProps) => {
  if (loading) {
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

  if (!summary || !appId) return null;

  return (
    <div className="space-y-6">
      <ReviewSummary summary={summary} appId={appId} />

      <h2 className="mt-8 mb-4 text-2xl font-semibold">
        Останні рецензії (показано {Math.min(limit, reviews.length)} з{" "}
        {summary.num_reviews})
      </h2>

      {reviews.length > 0 ? (
        <div className="grid gap-4">
          {reviews.slice(0, limit).map((review) => (
            <ReviewCard key={review.recommendationid} review={review} />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">Рецензій не знайдено</p>
      )}
    </div>
  );
};
