import type {
  ReviewOptions,
  ReviewResponse,
  PlayerSummary,
  PlayerSummariesResponse,
} from "~/types/steam";

interface ErrorResponse {
  error?: string;
}

/**
 * Client for interacting with Steam API
 */
export class SteamClient {
  private baseUrl: string;

  /**
   * Creates a new Steam client instance
   * @param apiKey - Steam API key for authentication
   */
  constructor() {
    this.baseUrl = "/api/steam";
  }

  /**
   * Generic method to make API requests with error handling
   * @param endpoint - API endpoint to call
   * @param params - URL parameters
   * @param errorMessage - Default error message
   */
  private async makeRequest<T>(
    endpoint: string,
    params: URLSearchParams,
    errorMessage: string,
  ): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}/${endpoint}?${params}`);

      if (!response.ok) {
        const errorData = (await response.json()) as ErrorResponse;
        throw new Error(errorData.error ?? errorMessage);
      }

      return (await response.json()) as T;
    } catch (error) {
      throw error instanceof Error ? error : new Error(errorMessage);
    }
  }

  /**
   * Split array into chunks of specified size
   * @param array - The array to split
   * @param size - Chunk size
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Get reviews for a specific game
   * @param appId - Steam application ID
   * @param options - Review filtering options
   */
  async getGameReviews(
    appId: string,
    options?: ReviewOptions,
  ): Promise<ReviewResponse> {
    const queryParams = new URLSearchParams({ appId });

    if (options) {
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }

    const data = await this.makeRequest<ReviewResponse>(
      "reviews",
      queryParams,
      "Failed to get a review",
    );

    if (data.success !== 1) {
      throw new Error("Steam API returned an error or incomplete data");
    }

    return data;
  }

  /**
   * Get player profile information
   * @param steamIds - Array of Steam user IDs
   */
  async getPlayerSummaries(steamIds: string[]): Promise<PlayerSummary[]> {
    if (!steamIds.length) return [];

    const chunks = this.chunkArray(steamIds, 100);
    const allResults: PlayerSummary[] = [];

    for (const chunk of chunks) {
      const queryParams = new URLSearchParams({
        steamids: chunk.join(","),
      });

      const data = await this.makeRequest<PlayerSummariesResponse>(
        "players",
        queryParams,
        "Failed to retrieve player data",
      );

      if (!data.response?.players) {
        throw new Error("Steam API returned incorrect player data");
      }

      allResults.push(...data.response.players);
    }

    return allResults;
  }

  /**
   * Get reviews with enriched player data
   * @param appId - Steam application ID
   * @param options - Review filtering options
   */
  async getReviewsWithPlayerData(appId: string, options?: ReviewOptions) {
    const reviewsData = await this.getGameReviews(appId, options);

    // Extract unique Steam IDs from reviews
    const steamIds = [
      ...new Set(reviewsData.reviews.map((review) => review.author.steamid)),
    ];

    // Get player data for all reviewers
    const playerSummaries = await this.getPlayerSummaries(steamIds);

    // Create lookup map for efficient access
    const playerMap = new Map<string, PlayerSummary>();
    playerSummaries.forEach((player) => {
      playerMap.set(player.steamid, player);
    });

    // Enrich review data with player information
    const enrichedReviews = reviewsData.reviews.map((review) => {
      const playerData = playerMap.get(review.author.steamid);
      return {
        ...review,
        author: {
          ...review.author,
          personaname: playerData?.personaname ?? "Unknown",
          profileurl: playerData?.profileurl ?? "#",
          avatar: playerData?.avatar ?? "",
          avatarmedium: playerData?.avatarmedium ?? "",
          avatarfull: playerData?.avatarfull ?? "",
        },
      };
    });

    return {
      ...reviewsData,
      reviews: enrichedReviews,
    };
  }
}

export const steamClient = new SteamClient();
