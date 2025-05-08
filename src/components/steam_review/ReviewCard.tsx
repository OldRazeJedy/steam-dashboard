// src/components/ui/ReviewCard.tsx
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "~/components/ui/card";
import { type SteamReview } from "~/types/steam";
import {
  ThumbsDown,
  ThumbsUp,
  Clock,
  User,
  Gamepad2,
  ExternalLink,
} from "lucide-react";
import Image from "next/image";

interface ReviewCardProps {
  review: SteamReview;
}

export function ReviewCard({ review }: ReviewCardProps) {
  const formatPlaytime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    return `${hours} год.`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("uk-UA", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
    });
  };

  // Перевіряємо чи доступна додаткова інформація про гравця
  const hasPlayerInfo = review.author.personaname && review.author.avatar;

  return (
    <Card className="gap-0 pt-0 pb-0">
      <CardHeader className="px-4 py-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {review.voted_up ? (
              <ThumbsUp className="h-4 w-4 text-green-500" />
            ) : (
              <ThumbsDown className="h-4 w-4 text-red-500" />
            )}
            <span className="text-sm font-medium">
              {review.voted_up ? "Рекомендую" : "Не рекомендую"}
            </span>
          </div>
          <div className="text-muted-foreground flex items-center gap-1 text-xs">
            <Clock className="h-3 w-3" />
            <span>{formatDate(review.timestamp_created)}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 py-1">
        <p className="max-h-24 overflow-y-auto text-xs whitespace-pre-line">
          {review.review}
        </p>
      </CardContent>
      <CardFooter className="flex flex-wrap px-4 py-1">
        {/* Інформація про автора з аватаркою */}
        <div className="mb-1 flex w-full items-center gap-2">
          {hasPlayerInfo && review.author.avatar ? (
            <div className="h-6 w-6 overflow-hidden rounded-full">
              <Image
                src={review.author.avatar}
                alt={`${review.author.personaname ?? "User"} avatar`}
                className="h-full w-full object-cover"
                width={24}
                height={24}
              />
            </div>
          ) : (
            <User className="text-muted-foreground h-4 w-4" />
          )}

          <div className="flex items-center gap-1">
            <span className="text-xs font-medium">
              {review.author.personaname ?? "Невідомий користувач"}
            </span>

            {review.author.profileurl && (
              <a
                href={review.author.profileurl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-700"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>

        {/* Інша інформація про рецензію */}
        <div className="text-muted-foreground flex w-full flex-wrap gap-x-2 gap-y-0 text-xs">
          <div className="flex items-center gap-1">
            <Gamepad2 className="h-3 w-3" />
            <span className="text-xs">
              Награно: {formatPlaytime(review.author.playtime_forever)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <ThumbsUp className="h-3 w-3" />
            <span className="text-xs">{review.votes_up} корисно</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
