// src/types/steam.ts
export interface SteamReviewAuthor {
  steamid: string;
  num_games_owned: number;
  num_reviews: number;
  playtime_forever: number;
  playtime_last_two_weeks: number;
  playtime_at_review: number;
  // Додаткові поля з PlayerSummary
  personaname?: string;
  profileurl?: string;
  avatar?: string;
  avatarmedium?: string;
  avatarfull?: string;
}

export interface SteamReview {
  recommendationid: string;
  author: SteamReviewAuthor;
  language: string;
  review: string;
  timestamp_created: number;
  timestamp_updated: number;
  voted_up: boolean;
  votes_up: number;
  votes_funny: number;
  weighted_vote_score: number;
  comment_count: number;
  steam_purchase: boolean;
  received_for_free: boolean;
  written_during_early_access: boolean;
}

export interface QuerySummary {
  num_reviews: number;
  review_score: number;
  review_score_desc: string;
  total_positive: number;
  total_negative: number;
  total_reviews: number;
}

export interface SteamReviewResponse {
  success: number;
  query_summary: QuerySummary;
  reviews: SteamReview[];
  cursor: string;
}

export interface ReviewOptions {
  filter?: string;
  language?: string;
  day_range?: number;
  cursor?: string;
  review_type?: "all" | "positive" | "negative";
  purchase_type?: "all" | "steam" | "non_steam_purchase";
  num_per_page?: number;
  pages?: number;
  fetchAll?: boolean;
}

export type ReviewResponse = SteamReviewResponse;

export interface PlayerSummary {
  steamid: string;
  communityvisibilitystate: number;
  profilestate: number;
  personaname: string;
  profileurl: string;
  avatar: string;
  avatarmedium: string;
  avatarfull: string;
  avatarhash: string;
  lastlogoff?: number;
  personastate: number;
  realname?: string;
  primaryclanid?: string;
  timecreated?: number;
  personastateflags?: number;
  gameextrainfo?: string;
  gameid?: string;
  loccountrycode?: string;
  locstatecode?: string;
  loccityid?: number;
}

export interface PlayerSummariesResponse {
  response: {
    players: PlayerSummary[];
  };
}

export interface ReviewsAnalysisData {
  reviewers: Record<
    string,
    {
      profile: {
        steamId: string;
        personaname?: string;
        profileurl?: string;
        avatar?: string;
        num_games_owned?: number;
        num_reviews?: number;
      };
      reviews: Record<
        string,
        {
          gameId: string;
          gameName?: string;
          gameCapsuleImage?: string;
          recommendation: "positive" | "negative";
          reviewText: string;
          reviewDate?: string;
          reviewUrl?: string;
          playtime?: number;
          playtimeAtReview?: number;
          reviewTimestamp: number;
        }
      >;
      totalPages?: number;
      error?: string;
    }
  >;
}
