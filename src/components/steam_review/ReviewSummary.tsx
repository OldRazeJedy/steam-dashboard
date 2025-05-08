import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { type SteamReviewResponse } from "~/types/steam";

interface ReviewSummaryProps {
  summary: SteamReviewResponse["query_summary"];
  appId: string;
}

export function ReviewSummary({ summary, appId }: ReviewSummaryProps) {
  if (
    summary?.total_positive === undefined ||
    summary.total_negative === undefined
  ) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p>
            No valid review summary data available for only positive or negative
            (need to fix)
          </p>
        </CardContent>
      </Card>
    );
  }

  const getPositivePercentage = () => {
    const total = summary.total_positive + summary.total_negative;
    return total === 0 ? 0 : Math.round((summary.total_positive / total) * 100);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Огляд рецензій для гри #{appId}</span>
          <a
            href={`https://store.steampowered.com/app/${appId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-normal text-blue-500 hover:underline"
          >
            Перейти до сторінки гри
          </a>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Загальна оцінка:</span>
              <span className="font-semibold">{summary.review_score_desc}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Всього рецензій:</span>
              <span className="font-semibold">
                {summary.total_reviews.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Позитивні рецензії:</span>
              <span className="font-semibold text-green-600">
                {summary.total_positive.toLocaleString()} (
                {getPositivePercentage()}%)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Негативні рецензії:</span>
              <span className="font-semibold text-red-600">
                {summary.total_negative.toLocaleString()} (
                {100 - getPositivePercentage()}%)
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
