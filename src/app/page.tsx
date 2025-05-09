"use client";

import { useState, useCallback } from "react";
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

/**
 * Constants for pagination and analysis configuration
 */
const ITEMS_PER_PAGE = 20;
const MAX_CONCURRENT_REQUESTS = 5;
const PAGES_TO_FETCH = 2;

/**
 * Main component for Steam Review Explorer application
 * Manages review fetching, pagination, user selection, and reviewer analysis
 */
export default function Home() {
  // App state
  const [appId, setAppId] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [selectedUserProfile, setSelectedUserProfile] = useState<string | null>(
    null,
  );

  // Analysis state
  const [analysisData, setAnalysisData] = useState<ReviewsAnalysisData | null>(
    null,
  );
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState<number>(0);
  const [, setTotalReviewersToAnalyze] = useState<number>(0);

  // Fetches Steam reviews and related data
  const { reviews, summary, loading, error } = useSteamReviews(appId, {
    pages: PAGES_TO_FETCH,
  });

  /**
   * Resets state when fetching reviews for a new Steam app
   */
  const handleFetchReviews = useCallback((id: string): void => {
    setAppId(id);
    setPage(1);
    setSelectedUserProfile(null);
    setAnalysisData(null);
    setIsAnalyzing(false);
    setAnalysisError(null);
    setAnalysisProgress(0);
  }, []);

  /**
   * Sets the selected user profile to view their reviews
   */
  const handleViewUserReviews = useCallback((profileUrl: string): void => {
    setSelectedUserProfile(profileUrl);
  }, []);

  /**
   * Progress callback for reviewer analysis
   */
  const updateAnalysisProgress = useCallback(
    (processed: number, total: number): void => {
      setAnalysisProgress(Math.round((processed / total) * 100));
    },
    [],
  );

  /**
   * Initiates and manages the process of analyzing reviewers
   */
  const handleAnalyzeReviewers = useCallback(async (): Promise<void> => {
    if (!reviews || reviews.length === 0 || !appId) return;

    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisData(null);
    setAnalysisProgress(0);

    // Count unique reviewers
    const uniqueAuthorCount = new Set(reviews.map((r) => r.author.steamid))
      .size;
    setTotalReviewersToAnalyze(uniqueAuthorCount);

    try {
      const data = await aggregateReviewerData(
        reviews,
        MAX_CONCURRENT_REQUESTS,
        updateAnalysisProgress,
        appId,
      );
      setAnalysisData(data);
    } catch (err) {
      console.error("Analysis failed:", err);
      setAnalysisError(
        err instanceof Error ? err.message : "Unknown analysis error",
      );
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress(100); // Ensure progress completes
    }
  }, [reviews, appId, updateAnalysisProgress]);

  // Pagination calculations
  const totalReviews = reviews.length;
  const totalPages = Math.max(1, Math.ceil(totalReviews / ITEMS_PER_PAGE));
  const paginatedReviews = reviews.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
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
                    ? `Analysis... (${analysisProgress}%)`
                    : "Analyze all reviewers"}
                </Button>
                {isAnalyzing && (
                  <Progress
                    value={analysisProgress}
                    className="mt-2 h-2"
                    aria-label={`Analysis progress: ${analysisProgress}%`}
                  />
                )}
                {analysisError && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertDescription>
                      Analysis error: {analysisError}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Display analysis results */}
              {analysisData && !isAnalyzing && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle>
                      Results of positive reviewers&apos; analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>
                      Analyzed {Object.keys(analysisData.reviewers).length}{" "}
                      users, who gave positive reviews to this game.
                    </p>
                    <div className="mt-2">
                      <h3 className="mb-2 text-sm font-medium">
                        Analysis of positive reviews:
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
                <TabsList className="w-full">
                  <TabsTrigger value="gameReviews" className="flex-1">
                    Reviews for the game
                  </TabsTrigger>
                  {selectedUserProfile && (
                    <TabsTrigger value="userReviews" className="flex-1">
                      User reviews
                    </TabsTrigger>
                  )}
                </TabsList>

                {/* Tab content for game reviews with pagination */}
                <TabsContent value="gameReviews">
                  <div className="space-y-4 pt-4">
                    <h2 className="text-xl font-semibold">
                      Reviews{" "}
                      <span className="text-muted-foreground text-sm font-normal">
                        (Page {page} of {totalPages})
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
