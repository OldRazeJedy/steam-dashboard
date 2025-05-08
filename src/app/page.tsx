// src/app/page.tsx
"use client";

import { useState } from "react";
import { SteamReviewInput } from "~/components/steam_review/SteamReviewInput";
import { useSteamReviews } from "~/lib/hooks/useSteamReviews";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { ReviewSummary } from "~/components/steam_review/ReviewSummary";
import { Skeleton } from "~/components/ui/skeleton";
import { ReviewsPagination } from "~/components/steam_review/ReviewsPagination";
import { UserReviews } from "~/components/steam_review/UserReviews";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Button } from "~/components/ui/button";
import { aggregateReviewerData } from "~/lib/analysis/aggregateReviews";
import { type ReviewsAnalysisData } from "~/types/steam";
import { Progress } from "~/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

// Main component for the home page
export default function Home() {
  // State variables for managing application data and UI
  const [appId, setAppId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [selectedUserProfile, setSelectedUserProfile] = useState<string | null>(
    null,
  );
  const itemsPerPage = 20;
  // Fetches Steam reviews and related data
  const { reviews, summary, loading, error, refetch } = useSteamReviews(appId, {
    pages: 2,
  });

  // State variables for reviewer analysis feature
  const [analysisData, setAnalysisData] = useState<ReviewsAnalysisData | null>(
    null,
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [totalReviewersToAnalyze, setTotalReviewersToAnalyze] = useState(0);

  // Resets state when a new App ID is provided to fetch reviews
  const handleFetchReviews = (id: string) => {
    setAppId(id);
    setPage(1);
    setSelectedUserProfile(null);
    setAnalysisData(null);
    setIsAnalyzing(false);
    setAnalysisError(null);
    setAnalysisProgress(0);
  };

  // Sets the selected user profile to view their reviews
  const handleViewUserReviews = (profileUrl: string) => {
    setSelectedUserProfile(profileUrl);
  };

  // Initiates and manages the process of analyzing reviewers
  const handleAnalyzeReviewers = async () => {
    if (!reviews || reviews.length === 0) return;

    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisData(null);
    setAnalysisProgress(0);

    const uniqueAuthorCount = new Set(reviews.map((r) => r.author.steamid))
      .size;
    setTotalReviewersToAnalyze(uniqueAuthorCount);

    try {
      const data = await aggregateReviewerData(
        reviews,
        5, // Max concurrent requests
        (processed, total) => {
          // Progress callback
          setAnalysisProgress(Math.round((processed / total) * 100));
        },
        appId, // Current App ID
      );
      setAnalysisData(data);
      console.log("Analysis Complete:", data);
    } catch (err) {
      console.error("Analysis failed:", err);
      setAnalysisError(
        err instanceof Error ? err.message : "Unknown analysis error",
      );
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress(100); // Ensure progress completes
    }
  };

  // Pagination logic for reviews
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
        {/* Input section for Steam App ID */}
        <div>
          <SteamReviewInput onFetch={handleFetchReviews} isLoading={loading} />
        </div>

        {/* Display area for reviews, summaries, and analysis */}
        <div className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          )}

          {/* Handles loading state for reviews */}
          {loading ? (
            <>
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-64 w-full" />
            </>
          ) : summary && appId ? ( // Renders content when reviews and summary are available
            <>
              <ReviewSummary summary={summary} appId={appId} />

              {/* Reviewer analysis section */}
              <div className="mt-4">
                <Button
                  onClick={handleAnalyzeReviewers}
                  disabled={isAnalyzing || reviews.length === 0}
                >
                  {isAnalyzing
                    ? `Аналіз... (${analysisProgress}%)`
                    : "Аналізувати всіх рецензентів"}
                </Button>
                {isAnalyzing && (
                  <Progress value={analysisProgress} className="mt-2 h-2" />
                )}
                {analysisError && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertDescription>
                      Помилка аналізу: {analysisError}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Displays results of reviewer analysis */}
              {analysisData && !isAnalyzing && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle>
                      Результати аналізу позитивних рецензентів
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>
                      Проаналізовано{" "}
                      {Object.keys(analysisData.reviewers).length} користувачів,
                      які дали позитивну рецензію цій грі.
                    </p>
                    <div className="mt-2">
                      <h3 className="mb-2 text-sm font-medium">
                        Аналіз позитивних рецензій:
                      </h3>
                      <pre className="bg-muted max-h-96 overflow-auto rounded p-2 text-xs">
                        {JSON.stringify(analysisData, null, 2)}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tabbed interface for game reviews and individual user reviews */}
              <Tabs defaultValue="gameReviews" className="mt-4">
                {" "}
                <TabsList className="w-full">
                  <TabsTrigger value="gameReviews" className="flex-1">
                    Рецензії на гру
                  </TabsTrigger>
                  {selectedUserProfile && (
                    <TabsTrigger value="userReviews" className="flex-1">
                      Рецензії користувача
                    </TabsTrigger>
                  )}
                </TabsList>
                {/* Tab content for game reviews with pagination */}
                <TabsContent value="gameReviews">
                  <div className="space-y-4 pt-4">
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
                      onViewUserReviews={handleViewUserReviews}
                    />
                  </div>
                </TabsContent>
                {/* Tab content for selected user's reviews */}
                {selectedUserProfile && (
                  <TabsContent value="userReviews">
                    <div className="pt-4">
                      <UserReviews profileUrl={selectedUserProfile} />
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            </>
          ) : null}
        </div>
      </div>
    </main>
  );
}
