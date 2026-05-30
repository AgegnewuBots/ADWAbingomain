import { createClient } from "@supabase/supabase-js";

// Vite client env support with fallbacks to ensure instant operational state
const SUPABASE_URL = ((import.meta as any).env?.VITE_SUPABASE_URL as string) || "https://dmfvcimfkaldtlpvomrz.supabase.co";
const SUPABASE_ANON_KEY = ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string) || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtZnZjaW1ma2FsZHRscHZvbXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMDczMTYsImV4cCI6MjA5NTY4MzMxNn0.Hnq4kCDS25LKW6IZf_jEkDECI8UJnTkkw_EWJNekY_I";

console.log("[Supabase] Initializing client with Project URL:", SUPABASE_URL);

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

/**
 * Deterministic generator to guarantee that a specific Cartela #ID (1-120) 
 * always has the exact same layout across previews and active games.
 */
export interface BingoCardCell {
  c: number; // column index 0..4
  r: number; // row index 0..4
  n: number | "★";
}
export type BingoCard = BingoCardCell[];

export function getDeterministicBingoCard(cardId: number): BingoCard {
  const card: BingoCard = new Array(25);
  
  // Custom seeded random number generator
  let seed = cardId * 123456789;
  const random = () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  for (let c = 0; c < 5; c++) {
    const min = c * 15 + 1;
    const max = c * 15 + 15;
    const pool: number[] = [];
    for (let i = min; i <= max; i++) {
      pool.push(i);
    }
    
    // Deterministic Fisher-Yates shuffle
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      const temp = pool[i];
      pool[i] = pool[j];
      pool[j] = temp;
    }
    
    for (let r = 0; r < 5; r++) {
      const idx = r * 5 + c;
      card[idx] = { c, r, n: pool[r] };
    }
  }
  card[12] = { c: 2, r: 2, n: "★" };
  return card;
}

// ====================================================================
// PROFILE METHODS
// ====================================================================

export async function checkAndRegisterUser(
  tgId: number, 
  username: string, 
  fullName: string, 
  photoUrl: string
) {
  console.log(`[Supabase] checkAndRegisterUser started for TG ID: ${tgId}, user: ${username}`);
  try {
    const { data: profile, error: selectError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", tgId)
      .maybeSingle();

    if (selectError) {
      console.error("[Supabase] Search profile failure:", selectError);
      throw selectError;
    }

    if (profile) {
      console.log("[Supabase] Profile exists with main balance:", profile.main_balance);
      return profile;
    }

    console.log("[Supabase] Profile not found. Triggering handle_telegram_user_signup RPC...");
    const { data: newUser, error: rpcError } = await supabase.rpc(
      "handle_telegram_user_signup",
      {
        tg_id: tgId,
        tg_username: username || `tg_${tgId}`,
        tg_fullname: fullName || "አድዋ ተጫዋች",
        tg_url: photoUrl || "https://i.ibb.co/yBc3V8YS/x.jpg"
      }
    );

    if (rpcError) {
      console.error("[Supabase] RPC handle_telegram_user_signup error:", rpcError);
      throw rpcError;
    }

    console.log("[Supabase] Successfully registered user:", newUser);
    return newUser || { id: tgId, main_balance: 50.00, play_balance: 0.00 };

  } catch (err) {
    console.error("[Supabase] checkAndRegisterUser exception caught:", err);
    throw err;
  }
}

export async function getUserProfile(tgId: number) {
  console.log(`[Supabase] getUserProfile for TG ID: ${tgId}`);
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", tgId)
    .maybeSingle();

  if (error) {
    console.error("[Supabase] GetUserProfile DB error:", error);
    throw error;
  }
  if (!data) {
    throw new Error("User profile not found in Supabase database");
  }
  return data;
}

export async function updateUserProfile(tgId: number, fullName: string, username: string) {
  console.log(`[Supabase] updateUserProfile for TG ID: ${tgId}, fullName: ${fullName}, username: ${username}`);
  const { data, error } = await supabase
    .from("profiles")
    .update({ 
      full_name: fullName, 
      username: username 
    })
    .eq("id", tgId)
    .select()
    .single();

  if (error) {
    console.error("[Supabase] UpdateUserProfile DB error:", error);
    throw error;
  }
  return data;
}

// ====================================================================
// GAME METHODS
// ====================================================================

export async function createGameInDb(gameId: string, room: string, stake: number) {
  console.log(`[Supabase] createGameInDb started. ID: ${gameId}, room: ${room}, stake: ${stake}`);
  
  // Format check to ensure we don't insert invalid game formats
  if (!gameId) {
    throw new Error("Invalid game. Room reference is required.");
  }

  const { data, error } = await supabase
    .from("games")
    .insert({
      id: gameId,
      room: room,
      stake: stake,
      status: "playing",
      called_balls: [],
      winner_name: null,
      winner_card: null
    })
    .select()
    .single();

  if (error) {
    console.error("[Supabase] CreateGameInDb error:", error);
    throw error;
  }
  return data;
}

export async function getActiveGames() {
  console.log("[Supabase] Fetching active games...");
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .eq("status", "playing")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[Supabase] GetActiveGames DB error:", error);
    throw error;
  }
  return data;
}

export async function updateGameStatusInDb(
  gameId: string, 
  status: "waiting" | "playing" | "ended" | "cancelled",
  winnerName?: string | null,
  winnerCard?: number | null
) {
  console.log(`[Supabase] updateGameStatusInDb: ID=${gameId}, status=${status}, winner=${winnerName}, card=${winnerCard}`);
  const updateData: any = { status };
  if (winnerName !== undefined) updateData.winner_name = winnerName;
  if (winnerCard !== undefined) updateData.winner_card = winnerCard;

  const { data, error } = await supabase
    .from("games")
    .update(updateData)
    .eq("id", gameId)
    .select();

  if (error) {
    console.error("[Supabase] updateGameStatusInDb failure:", error);
    throw error;
  }
  return data;
}

export async function saveCalledBallsInDb(gameId: string, calledBalls: number[]) {
  console.log(`[Supabase] saveCalledBallsInDb: GameID=${gameId}, size=${calledBalls.length}`);
  const { data, error } = await supabase
    .from("games")
    .update({ called_balls: calledBalls })
    .eq("id", gameId)
    .select();

  if (error) {
    console.error("[Supabase] saveCalledBallsInDb failure:", error);
    throw error;
  }
  return data;
}

// ====================================================================
// BETTING METHODS
// ====================================================================

export async function purchaseBingoCardInDb(
  tgId: number,
  betRequired: number,
  gameId: string,
  cardIndex: number,
  cardNumber: number,
  cardMatrix: number[]
) {
  console.log(`[Supabase] purchaseBingoCardInDb: ID=${tgId}, amt=${betRequired}, gameId=${gameId}, colCardNum=${cardNumber}`);
  
  try {
    // 1. Double Betting prevention check
    const { data: existingBet, error: betError } = await supabase
      .from("bets")
      .select("*")
      .eq("user_id", tgId)
      .eq("game_id", gameId)
      .eq("card_number", cardNumber)
      .maybeSingle();

    if (betError) {
      console.error("[Supabase] Betting check DB error:", betError);
      throw betError;
    }

    if (existingBet) {
      console.warn(`[Supabase] Duplicate purchase blocked for User:${tgId}, Card:${cardNumber}`);
      throw new Error(`Duplicate bet: you have already purchased Cartela #${cardNumber} for this round!`);
    }

    // 2. Safely run balance check before calling the DB function
    const { data: profile } = await supabase
      .from("profiles")
      .select("main_balance")
      .eq("id", tgId)
      .single();

    if (!profile) {
      throw new Error("User not found in profile directories.");
    }

    if (Number(profile.main_balance) < betRequired) {
      throw new Error("Insufficient balance to purchase this cartela!");
    }

    // 3. Atomically deduct user balance using SQL function RPC
    const { data: success, error: rpcError } = await supabase.rpc(
      "place_bingo_bet",
      {
        tg_id: tgId,
        required_bet: betRequired
      }
    );

    if (rpcError || !success) {
      console.error("[Supabase] RPC place_bingo_bet failure:", rpcError);
      throw new Error(rpcError?.message || "Insufficient balance to purchase this cartela!");
    }

    // 4. Record the bet details in the bets table
    const { data: betRecord, error: insertError } = await supabase
      .from("bets")
      .insert({
        user_id: tgId,
        game_id: gameId,
        stake: betRequired,
        card_index: cardIndex,
        card_number: cardNumber,
        card_matrix: cardMatrix,
        won: false,
        payout: 0.00
      })
      .select()
      .single();

    if (insertError) {
      console.error("[Supabase] Insert bet details failure:", insertError);
      throw insertError;
    }

    console.log("[Supabase] Bet successfully purchased and recorded:", betRecord);
    return betRecord;

  } catch (err) {
    console.error("[Supabase] purchaseBingoCardInDb Catch exception:", err);
    throw err;
  }
}

// ====================================================================
// WINNER METHODS
// ====================================================================

export async function declareWinnerInDb(
  tgId: number,
  prizeAmount: number,
  gameId: string,
  cardNumber: number
) {
  console.log(`[Supabase] declareWinnerInDb started: UserId=${tgId}, prize=${prizeAmount}, gameId=${gameId}, cardNumber=${cardNumber}`);

  try {
    // 1. Call credit_bingo_winner SQL RPC
    const { data: success, error: rpcError } = await supabase.rpc(
      "credit_bingo_winner",
      {
        tg_id: tgId,
        prize_amount: prizeAmount,
        game_ref_id: gameId
      }
    );

    if (rpcError || !success) {
      console.error("[Supabase] Winner RPC credit_bingo_winner failure:", rpcError);
      throw rpcError || new Error("Failed to credit winner.");
    }

    // 2. Update the specific bet record to mark won=true and record the payout
    const { data: updatedBets, error: betUpdateError } = await supabase
      .from("bets")
      .update({
        won: true,
        payout: prizeAmount
      })
      .eq("user_id", tgId)
      .eq("game_id", gameId)
      .eq("card_number", cardNumber)
      .select();

    if (betUpdateError) {
      console.error("[Supabase] Failed to update bet record for winner:", betUpdateError);
    }

    // 3. Update the ended game with winner metadata
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", tgId)
      .single();

    await updateGameStatusInDb(gameId, "ended", profile?.full_name || "Winner", cardNumber);

    console.log("[Supabase] Winning payouts completed successfully!");
    return updatedBets;

  } catch (err) {
    console.error("[Supabase] declareWinnerInDb Exception:", err);
    throw err;
  }
}

// ====================================================================
// TRANSACTION METHODS
// ====================================================================

export async function getUserTransactions(tgId: number) {
  console.log(`[Supabase] getUserTransactions for User ID: ${tgId}`);
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", tgId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[Supabase] getUserTransactions DB error:", error);
    throw error;
  }
  return data || [];
}

export async function recordDepositInDb(tgId: number, amount: number, reference: string) {
  console.log(`[Supabase] recordDepositInDb for User: ${tgId}, amount: ${amount}, reference: ${reference}`);
  
  // Fetch user first, then add to top up profiles table balance safely
  const { data: profile, error: fetchErr } = await supabase
    .from("profiles")
    .select("main_balance")
    .eq("id", tgId)
    .single();

  if (fetchErr || !profile) {
    throw new Error("Unable to locate profile path.");
  }

  const nextBalance = Number(profile.main_balance || 0) + amount;
  const { error: updateErr } = await supabase
    .from("profiles")
    .update({ main_balance: nextBalance })
    .eq("id", tgId);

  if (updateErr) {
    console.error("[Supabase] Profile balance increment failure:", updateErr);
    throw updateErr;
  }

  // 2. Add transaction row
  const { data: tx, error: txError } = await supabase
    .from("transactions")
    .insert({
      user_id: tgId,
      amount: amount,
      type: "deposit",
      status: "completed",
      reference: reference
    })
    .select()
    .single();

  if (txError) {
    console.error("[Supabase] RecordDeposit transaction insertion error:", txError);
    throw txError;
  }

  return tx;
}

export async function recordWithdrawalInDb(tgId: number, amount: number, reference: string) {
  console.log(`[Supabase] recordWithdrawalInDb: User=${tgId}, amount=${amount}`);

  // Fetch profiles balance
  const { data: profile, error: fetchErr } = await supabase
    .from("profiles")
    .select("main_balance")
    .eq("id", tgId)
    .single();

  if (fetchErr || !profile) {
    throw new Error("User profile not found.");
  }

  const curBal = Number(profile.main_balance || 0);
  if (curBal < amount) {
    throw new Error("Insufficient balance to initiate cashout.");
  }

  // Deduct
  const nextBalance = curBal - amount;
  const { error: updateErr } = await supabase
    .from("profiles")
    .update({ main_balance: nextBalance })
    .eq("id", tgId);

  if (updateErr) {
    console.error("[Supabase] Profile balance deduction failure:", updateErr);
    throw updateErr;
  }

  // Add transaction row
  const { data: tx, error: txError } = await supabase
    .from("transactions")
    .insert({
      user_id: tgId,
      amount: -amount,
      type: "withdraw",
      status: "pending",
      reference: reference || "CBE Telebirr cashout request"
    })
    .select()
    .single();

  if (txError) {
    console.error("[Supabase] RecordWithdrawal transaction insertion error:", txError);
    throw txError;
  }

  return tx;
}

export async function recordBonusInDb(tgId: number, amount: number, reference: string) {
  console.log(`[Supabase] recordBonusInDb User: ${tgId}, amount: ${amount}`);

  const { data: profile, error: fetchErr } = await supabase
    .from("profiles")
    .select("main_balance")
    .eq("id", tgId)
    .single();

  if (fetchErr || !profile) {
    throw new Error("Profile not found");
  }

  const nextBalance = Number(profile.main_balance || 0) + amount;
  await supabase
    .from("profiles")
    .update({ main_balance: nextBalance })
    .eq("id", tgId);

  const { data: tx, error: txError } = await supabase
    .from("transactions")
    .insert({
      user_id: tgId,
      amount: amount,
      type: "bonus",
      status: "completed",
      reference: reference
    })
    .select()
    .single();

  if (txError) {
    console.error("[Supabase] RecordBonus transaction insertion error:", txError);
    throw txError;
  }

  return tx;
}

export async function getLeaderboardStandings() {
  console.log("[Supabase] Querying top winners standings for Leaderboard...");
  
  // We can query custom high roll winning users based on their main_balance or VIP status
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("main_balance", { ascending: false })
    .limit(20);

  if (error) {
    console.error("[Supabase] getLeaderboardStandings error:", error);
    throw error;
  }
  
  return data.map((item: any, index: number) => ({
    rank: index + 1,
    name: item.full_name || item.username || "አድዋ ተጫዋች",
    winnings: Math.floor(item.main_balance * 1.5) || 120, // Simulating relative high payout metrics as standings
    games: 15 + (index % 5),
    vipStatus: item.vip_status || false,
    photoUrl: item.photo_url || "https://i.ibb.co/yBc3V8YS/x.jpg"
  }));
}
