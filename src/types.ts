/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BingoCell {
  c: number; // Column index (0 to 4)
  r: number; // Row index (0 to 4)
  n: number | "★"; // Number or "★" for free space
}

export type BingoCard = BingoCell[]; // 25 elements

export interface GameState {
  gameId: string | null;
  called: Set<number>;
  current: number | null;
  recentBalls: number[];
  callCount: number;
  totalPlayers: number;
  cards: BingoCard[];
  cardNums: number[]; // Numbers chosen from grid (1-400)
  marked: Set<number>[]; // Index sets of marked cells
  wonLines: Set<number>[][]; // Sets of indexes that formed won lines
  winAmount: number;
  betDeducted: boolean;
}

export interface WinnerDeclaration {
  name: string;
  cardNum: number;
  cardIndex: number;
  userId: number;
  card: BingoCard | null;
  marked: Set<number>;
  wonLines: Set<number>[];
}

export interface PlayerStats {
  gamesPlayed: number;
  gamesWon: number;
  totalWonAmount: number;
  invitedUsers: number;
  isVip: boolean;
}

export interface MatchHistory {
  game_id: string;
  entry: number;
  status: "Completed" | "Cancelled" | "In Progress";
  result: string;
}

export interface LeaderboardUser {
  name: string;
  value: number;
  rank?: number;
}

export interface Transaction {
  type: "deposit" | "withdraw" | "bingo_win" | "buy_card";
  amount: number;
  status: "Done" | "Pending";
  time: string;
}

export type AppTab = "home" | "profile" | "winners" | "wallet" | "admin";
export type LeaderboardPeriod = "week" | "month";
export type LeaderboardCategory = "deposit" | "invite" | "games";
