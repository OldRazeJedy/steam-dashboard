// src/lib/steam/client.ts
import type {
  ReviewOptions,
  ReviewResponse,
  PlayerSummary,
  PlayerSummariesResponse,
} from "~/types/steam";

export class SteamClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(apiKey: string) {
    this.baseUrl = "/api/steam";
    this.apiKey = apiKey;
  }

  async getGameReviews(
    appId: string,
    options?: ReviewOptions,
  ): Promise<ReviewResponse> {
    try {
      const queryParams = new URLSearchParams({ appId });

      if (options) {
        Object.entries(options).forEach(([key, value]) => {
          if (value !== undefined) {
            queryParams.append(key, String(value));
          }
        });
      }

      const response = await fetch(`${this.baseUrl}/reviews?${queryParams}`);

      if (!response.ok) {
        interface ErrorResponse {
          error?: string;
        }
        const errorData = (await response.json()) as ErrorResponse;
        throw new Error(errorData.error ?? "Не вдалося отримати рецензії");
      }

      const data = (await response.json()) as ReviewResponse;

      if (data.success !== 1) {
        throw new Error("Steam API повернув помилку або неповні дані");
      }

      return data;
    } catch (error) {
      throw error instanceof Error
        ? error
        : new Error("Сталася помилка при отриманні рецензій");
    }
  }

  async getPlayerSummaries(steamIds: string[]): Promise<PlayerSummary[]> {
    try {
      if (!steamIds.length) return [];

      const chunks = [];
      for (let i = 0; i < steamIds.length; i += 100) {
        chunks.push(steamIds.slice(i, i + 100));
      }

      const allResults: PlayerSummary[] = [];

      for (const chunk of chunks) {
        const queryParams = new URLSearchParams({
          steamids: chunk.join(","),
        });

        const response = await fetch(`${this.baseUrl}/players?${queryParams}`);

        if (!response.ok) {
          interface ErrorResponse {
            error?: string;
          }
          const errorData = (await response.json()) as ErrorResponse;
          throw new Error(
            errorData.error ?? "Не вдалося отримати дані гравців",
          );
        }

        const data = (await response.json()) as PlayerSummariesResponse;

        if (!data.response?.players) {
          throw new Error("Steam API повернув некоректні дані гравців");
        }

        allResults.push(...data.response.players);
      }

      return allResults;
    } catch (error) {
      throw error instanceof Error
        ? error
        : new Error("Сталася помилка при отриманні даних гравців");
    }
  }

  async getReviewsWithPlayerData(appId: string, options?: ReviewOptions) {
    const reviewsData = await this.getGameReviews(appId, options);

    const steamIds = [
      ...new Set(reviewsData.reviews.map((review) => review.author.steamid)),
    ];

    const playerSummaries = await this.getPlayerSummaries(steamIds);

    const playerMap = new Map<string, PlayerSummary>();
    playerSummaries.forEach((player) => {
      playerMap.set(player.steamid, player);
    });

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

export const steamClient = new SteamClient(process.env.STEAM_API_KEY ?? "");
