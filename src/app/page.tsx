// src/app/page.tsx
"use client";

import { useState } from "react";
import { SteamReviewInput } from "~/components/SteamReviewInput";
import { useSteamReviews } from "~/lib/hooks/useSteamReviews";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { ReviewSummary } from "~/components/ReviewSummary";
import { Skeleton } from "~/components/ui/skeleton";
import { ReviewsPagination } from "~/components/ui/ReviewsPagination";

export default function Home() {
  const [appId, setAppId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const itemsPerPage = 4;
  const { reviews, summary, loading, error } = useSteamReviews(appId, {
    pages: 2,
  });

  const handleFetchReviews = (id: string) => {
    setAppId(id);
    setPage(1);
  };

  const totalReviews = reviews.length;
  const totalPages = Math.ceil(totalReviews / itemsPerPage);
  const paginatedReviews = reviews.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage,
  );

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Steam Paid Review Explorer</h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Column - Input */}
        <div>
          <SteamReviewInput onFetch={handleFetchReviews} isLoading={loading} />
        </div>

        {/* Right Column - Results */}
        <div className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <>
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-64 w-full" />
            </>
          ) : summary && appId ? (
            <>
              <ReviewSummary summary={summary} appId={appId} />

              <div className="space-y-4">
                <h2 className="text-xl font-semibold">
                  Рецензії{" "}
                  <span className="text-muted-foreground text-sm font-normal">
                    (Сторінка {page} з {totalPages || 1})
                  </span>
                </h2>

                <ReviewsPagination
                  reviews={paginatedReviews}
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </div>
            </>
          ) : null}
        </div>
      </div>
    </main>
  );
}
