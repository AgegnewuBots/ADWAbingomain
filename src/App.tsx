/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import {
  Home,
  User,
  Trophy,
  Wallet,
  Coins,
  Clock,
  Volume2,
  VolumeX,
  Sparkles,
  ArrowLeft,
  ChevronRight,
  UserPlus,
  Play,
  RotateCcw,
  Check,
  Award,
  CircleDot,
  Flame,
  HelpCircle,
  TrendingUp,
  CreditCard,
  PlusCircle,
  ArrowDownCircle,
  TrendingDown,
  RefreshCw,
  Zap,
  Shield,
  Settings,
  Sun,
  Moon,
  Lock,
  Unlock,
  AlertTriangle,
  UserCheck,
  UserX,
  Users,
  Pause,
  Square,
  Activity,
  Download
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { BingoCard, AppTab, GameState, WinnerDeclaration, PlayerStats, MatchHistory, LeaderboardUser, Transaction, LeaderboardPeriod, LeaderboardCategory } from "./types";
import { announceBall, SoundEffects, AM_NUMBERS, getLetterForNumber } from "./utils/audio";
import {
  supabase,
  checkAndRegisterUser,
  getUserProfile,
  updateUserProfile,
  getActiveGames,
  createGameInDb,
  updateGameStatusInDb,
  saveCalledBallsInDb,
  purchaseBingoCardInDb,
  declareWinnerInDb,
  getUserTransactions,
  recordDepositInDb,
  recordWithdrawalInDb,
  recordBonusInDb,
  getLeaderboardStandings,
  getDeterministicBingoCard
} from "./supabase";

const API_BASE = "https://bi-bo-py.onrender.com";
const COLS = ["B", "I", "N", "G", "O"];
const COL_COLORS = { B: "#4a9eff", I: "#9b59b6", N: "#e91e8c", G: "#00c875", O: "#ff6b35" };

const translations = {
  en: {
    welcome: "Select a stake to join a match",
    chooseStake: "Choose Game Stake",
    playX: "Play {amount} Birr",
    watchingOnly: "Watching Only",
    gameStartedWait: "This round of game has started. Please wait here until the next round starts.",
    leave: "Leave",
    refresh: "Refresh",
    automatic: "Automatic",
    leaderboard: "LEADERBOARDS",
    profile: "PROFILE",
    wallet: "WALLET",
    home: "HOME",
    mainBal: "MAIN",
    playBal: "PLAY",
    gameId: "GAME ID",
    stake: "STAKE",
    reward: "REWARD",
    time: "TIME",
    called: "Called",
    sound: "Sound Cues",
    language: "Language",
    theme: "Theme Mode",
    selectedCards: "Selected Cards",
    selectCardsLimit: "Select up to 2 cards to play",
    insufficientBalance: "Insufficient balance! Top up or choose a lower stake.",
    adminTitle: "ADWA admin console",
    passwordPrompt: "Enter Admin Password",
    wrongPassword: "Wrong Password!",
    cancelGame: "Cancel Game",
    pauseGame: "Pause Game",
    resumeGame: "Resume Game",
    bannedUsers: "Ban / Unban Simulators",
    addBalance: "Add Balance",
    unban: "Unban",
    ban: "Ban",
    approve: "Approve",
    reject: "Reject",
    withdrawals: "Withdrawal Requests",
    deposits: "Recent Mock Deposits",
    adminTriggerInfo: "",
    thisWeek: "This Week",
    thisMonth: "This Month",
    mostDeposit: "Most Deposit",
    invitation: "Invitation",
    mostGames: "Most Games",
    currentRank: "Your Current Rank",
    totalMetric: "Total Metric Value",
    winnerFoundTitle: "BINGO!",
    playersWon: "player won!",
    winningCartela: "Winning Cartela",
    autostartNext: "Auto-starting next game in",
    manualLabel: "Balls Called",
    waitingBall: "Waiting ball...",
    recentBallsLabel: "Recent Balls",
    backToStake: "Change Stake",
    soundOn: "On",
    soundOff: "Off"
  },
  am: {
    welcome: "ለመጫወት እባክዎ መደብ ይምረጡ",
    chooseStake: "የጨዋታ መደብ ይምረጡ",
    playX: "በ {amount} ብር ይጫወቱ",
    watchingOnly: "ተመልካች ብቻ",
    gameStartedWait: "የዚህ ዙር ጨዋታ ተጀምሯል። አዲስ ዙር እስኪጀምር እዚህ ይጠብቁ።",
    leave: "ውጣ",
    refresh: "አድስ",
    automatic: "አውቶማቲክ",
    leaderboard: "LEADERBOARDS",
    profile: "PROFILE",
    wallet: "WALLET",
    home: "HOME",
    mainBal: "ዋና ቅሪት",
    playBal: "ለመጫወቻ",
    gameId: "የጨዋታ ቁጥር",
    stake: "መደብ",
    reward: "ደራሽ",
    time: "ቀሪ ሰከንድ",
    called: "የተጠሩ",
    sound: "የድምፅ ቅንብር",
    language: "ቋንቋ / Language",
    theme: "ገጽታ / Theme",
    selectedCards: "የተመረጡ ካርቴላዎች",
    selectCardsLimit: "እስከ 2 ካርቴላዎች መምረጥ ይችላሉ",
    insufficientBalance: "በቂ ሂሳብ የለም! እባክዎ ሂሳብ ይሙሉ ወይም መደብ ይቀይሩ።",
    adminTitle: "አድዋ የአድሚን መቆጣጠሪያ",
    passwordPrompt: "የአድሚን የይለፍ ቃል ያስገቡ",
    wrongPassword: "የተሳሳተ የይለፍ ቃል!",
    cancelGame: "ጨዋታ ሰርዝ",
    pauseGame: "ጨዋታ አቁም",
    resumeGame: "ጨዋታ አስቀጥል",
    bannedUsers: "ተጠቃሚዎችን እገድ / ፍታ",
    addBalance: "ሂሳብ ጨምር",
    unban: "ፍታ",
    ban: "እገድ",
    approve: "ፍቀድ",
    reject: "ሰርዝ",
    withdrawals: "የወጪ ንግድ ጥያቄዎች",
    deposits: "የገቢ ማረጋገጫዎች",
    adminTriggerInfo: "",
    thisWeek: "የዚህ ሳምንት",
    thisMonth: "የዚህ ወር",
    mostDeposit: "ከፍተኛ ተቀማጭ",
    invitation: "ግብዣዎች",
    mostGames: "ብዙ ጨዋታዎች",
    currentRank: "የእርስዎ ደረጃ",
    totalMetric: "ጠቅላላ ነጥብ",
    winnerFoundTitle: "ቢንጎ!",
    playersWon: "ተጫዋች አሸንፏል!",
    winningCartela: "አሸናፊ ካርቴላ",
    autostartNext: "ቀጣይ ጨዋታ የሚጀምርበት ሰከንድ",
    manualLabel: "የተጠሩ ቁጥሮች",
    waitingBall: "ኳስ በመጠባበቅ ላይ...",
    recentBallsLabel: "ያለፉ ኳሶች",
    backToStake: "መደብ ቀይር",
    soundOn: "በርቷል",
    soundOff: "ጠፍቷል"
  }
};

export default function App() {
  // Navigation & Screen Control
  const [activeTab, setActiveTab] = useState<AppTab>("home");
  const [activeScreen, setActiveScreen] = useState<"screen-stake" | "screen-home" | "screen-game" | "screen-winner">("screen-stake");

  // Settings & Localization & Themes
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [bingoSoundsEnabled, setBingoSoundsEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("bingo_sounds_enabled");
      return saved !== null ? saved === "true" : true;
    } catch {
      return true;
    }
  });
  const [clicksEnabled, setClicksEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("clicks_enabled");
      return saved !== null ? saved === "true" : true;
    } catch {
      return true;
    }
  });
  const [language, setLanguage] = useState<"en" | "am">("en"); // default English requested
  const [themeMode, setThemeMode] = useState<"dark" | "light">("dark"); // default dark requested

  // Help translate strings
  const t = translations[language];

  // User details directly from Bot Info (no badge, clean profile id/name)
  const [tgUserId, setTgUserId] = useState<number>(0);
  const [tgUsername, setTgUsername] = useState<string>("");
  const [photoUrl, setPhotoUrl] = useState<string>("https://i.ibb.co/yBc3V8YS/x.jpg");
  const [mainBalance, setMainBalance] = useState<number>(50); // Premium start balance matching 50 Birr bonus request
  const [playBalance, setPlayBalance] = useState<number>(0);
  const [apiAvailable, setApiAvailable] = useState<boolean>(false);
  
  const [userStats, setUserStats] = useState<PlayerStats>({
    gamesPlayed: 18,
    gamesWon: 4,
    totalWonAmount: 240,
    invitedUsers: 5,
    isVip: false, // Badge removed from profile matching request
  });

  // Game configuration
  const [currentStake, setCurrentStake] = useState<number>(10);
  const [currentRoom, setCurrentRoom] = useState<string>("10");
  const [gameIndex, setGameIndex] = useState<number>(() => {
    return Math.floor(Math.random() * 80) + 12; // starts at random like 24 or 63 as requested
  });
  const [currentGameId, setCurrentGameId] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number>(60); // Settle countdown timer selection to exactly 60s
  const [selCards, setSelCards] = useState<Set<number>>(new Set());
  const [cardDeductMap, setCardDeductMap] = useState<Record<number, { fromPlay: number; fromMain: number }>>({});
  
  // Game states
  const [gamePaused, setGamePaused] = useState<boolean>(false);
  const [gameCancelled, setGameCancelled] = useState<boolean>(false);
  const [totalPlayers, setTotalPlayers] = useState<number>(56); // default aesthetic setup from screenshot
  const [winnersThisRound, setWinnersThisRound] = useState<WinnerDeclaration[]>([]);
  const [winnerCountdown, setWinnerCountdown] = useState<number>(10);
  
  // Active Cards gameplay state
  const [game, setGame] = useState<GameState>({
    gameId: null,
    called: new Set<number>(),
    current: null,
    recentBalls: [],
    callCount: 0,
    totalPlayers: 0,
    cards: [],
    cardNums: [],
    marked: [],
    wonLines: [],
    winAmount: 0,
    betDeducted: false,
  });

  const gameRef = useRef<GameState>(game);
  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  // Spectator draw queue ("Watching Only")
  const [waitGame, setWaitGame] = useState<{
    called: Set<number>;
    current: number | null;
    recentBalls: number[];
    callCount: number;
  }>({
    called: new Set<number>(),
    current: null,
    recentBalls: [],
    callCount: 0,
  });

  // Automatic Game state
  const [isAutomaticMarker, setIsAutomaticMarker] = useState<boolean>(true);

  // Leaderboard lists
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<LeaderboardPeriod>("week");
  const [leaderboardCategory, setLeaderboardCategory] = useState<LeaderboardCategory>("deposit");
  const [leaderboardUsers, setLeaderboardUsers] = useState<LeaderboardUser[]>([]);
  const [userRank, setUserRank] = useState<{ rank: number | string; value: number | string }>({ rank: "4", value: "850" });

  // History & wallets (Adwa brand strictly limits to deposit and withdraw transactions)
  const [transactions, setTransactions] = useState<Transaction[]>([
    { type: "deposit", amount: 500, status: "Done", time: "2026-05-26T14:22:00Z" },
    { type: "withdraw", amount: 150, status: "Done", time: "2026-05-26T15:05:00Z" },
    { type: "deposit", amount: 250, status: "Done", time: "2026-05-27T01:15:00Z" },
  ]);
  const [matchHistory, setMatchHistory] = useState<MatchHistory[]>([
    { game_id: "BBG8D", entry: 10, status: "Completed", result: "+80" },
    { game_id: "ADW5W", entry: 20, status: "Completed", result: "+160" },
  ]);

  // Administration panel states
  const [adminClicks, setAdminClicks] = useState<number>(0);
  const [showAdminPasswordModal, setShowAdminPasswordModal] = useState<boolean>(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState<string>("");
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(false);
  const [lastBannedIdList, setLastBannedIdList] = useState<string[]>([]);
  const [depositAmountToCredit, setDepositAmountToCredit] = useState<number>(100);

  // Super Admin Extended States
  const [adminTab, setAdminTab] = useState<"dashboard" | "users" | "deposits" | "withdrawals" | "gameplay" | "logs">("dashboard");
  const [adminSearchId, setAdminSearchId] = useState<string>("7348631392");
  const [adminAmountInput, setAdminAmountInput] = useState<number>(100);
  const [auditLogs, setAuditLogs] = useState<string[]>([
    "ADWA Admin Console successfully booted.",
    "Telegram user gateway verified.",
    "Live simulator socket running.",
  ]);
  const [simulatedUsers, setSimulatedUsers] = useState<Record<string, { id: string; username: string; balance: number; status: "Active" | "Banned"; logs: string[] }>>({
    "7348631392": { id: "7348631392", username: "Yonas_Kassa", balance: 350, status: "Active", logs: ["User signed up.", "Selected table stake 10."] },
    "10192837": { id: "10192837", username: "Henok_Tade", balance: 1200, status: "Active", logs: ["Deposited 500 Birr.", "Room table joined."] },
    "48291038": { id: "48291038", username: "Ascal_Girmay", balance: 420, status: "Active", logs: ["Joined Table Stake 20.", "Won Line bingo in AD18WA."] },
    "92837410": { id: "92837410", username: "Marcos_W", balance: 90, status: "Active", logs: ["Balance checked."] },
  });

  // MOCK withdrawal/deposits for Admins
  const [adminWithdrawals, setAdminWithdrawals] = useState<Array<{ id: number; name: string; amount: number; status: "Pending" | "Approved" | "Rejected"; time: string }>>([
    { id: 101, name: "Henok Tadese", amount: 250, status: "Pending", time: "10 mins ago" },
    { id: 102, name: "Sintayehu Abera", amount: 600, status: "Pending", time: "30 mins ago" },
    { id: 103, name: "Roman G.", amount: 120, status: "Approved", time: "2 hours ago" },
  ]);
  const [adminDeposits, setAdminDeposits] = useState<Array<{ id: number; name: string; amount: number; time: string }>>([
    { id: 201, name: "Aster K.", amount: 500, time: "5 mins ago" },
    { id: 202, name: "Biniyam L.", amount: 200, time: "1 hour ago" },
  ]);

  // Timer Ref bindings
  const socketRef = useRef<Socket | null>(null);
  const serverDrivingBalls = useRef<boolean>(false);
  const serverDrivingTimer = useRef<NodeJS.Timeout | null>(null);
  const selectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const localAutoRef = useRef<NodeJS.Timeout | null>(null);
  const waitAutoRef = useRef<NodeJS.Timeout | null>(null);
  const animateWinnerRef = useRef<NodeJS.Timeout | null>(null);

  // Custom non-blocking Toast Notifications
  const [activeToast, setActiveToast] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // -------------------------------------------------------------
  // Initial Telegram Web App bot parsing & user details extraction
  // -------------------------------------------------------------
  useEffect(() => {
    const initAndRegisterObj = async () => {
      try {
        const wa = (window as any).Telegram?.WebApp;
        let finalId = 7348631392;
        let finalUsername = "Yonas_Kassa";
        let finalFullName = "ዮናስ ካሳ";
        let finalPhotoUrl = "https://i.ibb.co/yBc3V8YS/x.jpg";

        if (wa) {
          wa.ready();
          wa.expand();
          if (wa.initDataUnsafe?.user) {
            const u = wa.initDataUnsafe.user;
            finalId = u.id;
            finalUsername = u.username || `${u.first_name || ""}_${u.last_name || ""}`.trim();
            finalFullName = `${u.first_name || ""} ${u.last_name || ""}`.trim() || "አድዋ ተጫዋች";
            if (u.photo_url) {
              finalPhotoUrl = u.photo_url;
            }
          } else {
            const randomSuffix = Math.floor(10 + Math.random() * 90);
            const randomId = Math.floor(10000000 + Math.random() * 90000000);
            finalId = randomId;
            finalUsername = `test1_${randomSuffix}`;
            finalFullName = `Test User ${randomSuffix}`;
          }
        } else {
          const randomSuffix = Math.floor(10 + Math.random() * 90);
          const randomId = Math.floor(10000000 + Math.random() * 90000000);
          finalId = randomId;
          finalUsername = `test1_${randomSuffix}`;
          finalFullName = `Test User ${randomSuffix}`;
        }

        console.log(`[Supabase Init] Selected User details: ID=${finalId}, User=${finalUsername}, Name=${finalFullName}`);

        // Register/retrieve user in Supabase first BEFORE updating state to avoid syncAllUserData race conditions
        const dbProfile = await checkAndRegisterUser(finalId, finalUsername, finalFullName, finalPhotoUrl);
        if (dbProfile) {
          setMainBalance(Number(dbProfile.main_balance) || 50.00);
          setPlayBalance(Number(dbProfile.play_balance) || 0.00);
          setApiAvailable(true);
        } else {
          setApiAvailable(false);
        }

        setTgUserId(finalId);
        setTgUsername(finalUsername);
        setPhotoUrl(finalPhotoUrl);

        if (finalId === 7348631392) {
          setIsAdminUnlocked(true);
        }
      } catch (e) {
        console.warn("[Supabase Init] Verification/Registration failure:", e);
        const fallbackId = Math.floor(10000000 + Math.random() * 90000000);
        setMainBalance(50.00);
        setPlayBalance(0.00);
        setApiAvailable(false);
        setTgUserId(fallbackId);
        setTgUsername("test1_fallback");
        setPhotoUrl("https://i.ibb.co/yBc3V8YS/x.jpg");
      }
    };

    initAndRegisterObj();
  }, []);

  // -------------------------------------------------------------
  // Refresh & Sync Action Preservation logic
  // -------------------------------------------------------------
  const syncAllUserData = async () => {
    if (!tgUserId || !apiAvailable) return;
    SoundEffects.playClick(clicksEnabled);
    
    // Fetch profile and balances from Supabase
    try {
      const dbProfile = await getUserProfile(tgUserId);
      if (dbProfile) {
        setMainBalance(Number(dbProfile.main_balance) || 0);
        setPlayBalance(Number(dbProfile.play_balance) || 0);
        setApiAvailable(true);
        
        // Load bets and match histories
        const { data: bets, error: betsError } = await supabase
          .from("bets")
          .select("*, games(*)")
          .eq("user_id", tgUserId)
          .order("created_at", { ascending: false })
          .limit(10);
          
        if (!betsError && bets) {
          const loadedHistory: MatchHistory[] = bets.map((b: any) => ({
            game_id: b.game_id || "Round",
            entry: Number(b.stake) || 10,
            status: b.won ? "Completed" : (b.games?.status === "playing" ? "In Progress" : "Cancelled"),
            result: b.won ? `Won ${b.payout} Birr` : "No Win",
          }));
          setMatchHistory(loadedHistory);

          const gamesPlayedCount = bets.length;
          const gamesWonCount = bets.filter(b => b.won).length;
          const totalWonSum = bets.filter(b => b.won).reduce((sum, b) => sum + Number(b.payout), 0);

          setUserStats({
            gamesPlayed: gamesPlayedCount || 0,
            gamesWon: gamesWonCount || 0,
            totalWonAmount: totalWonSum || 0,
            invitedUsers: dbProfile.invited_by ? 1 : 0,
            isVip: dbProfile.vip_status || false,
          });
        }
      }
    } catch (err) {
      console.error("[Supabase Sync] Profile query failure:", err);
      setApiAvailable(false);
    }
    
    // Fetch complete ledger transactions
    try {
      const txs = await getUserTransactions(tgUserId);
      const mappedTxs: Transaction[] = txs.map((tx: any) => ({
        id: tx.id,
        amount: Number(tx.amount),
        type: tx.type,
        status: tx.status,
        time: new Date(tx.created_at).toLocaleTimeString() + " " + new Date(tx.created_at).toLocaleDateString(),
        reference: tx.reference || "Ledger entry updated",
      }));
      setTransactions(mappedTxs);
    } catch (err) {
      console.error("[Supabase Sync] Ledger query failure:", err);
    }
  };

  useEffect(() => {
    if (tgUserId && apiAvailable) {
      syncAllUserData();
    }
  }, [tgUserId, apiAvailable]);

  // Load Leaderboard static items
  const loadLeaderboardDataList = async () => {
    try {
      const standings = await getLeaderboardStandings();
      const mappedWinners: LeaderboardUser[] = standings.map((s: any) => ({
        name: s.name,
        value: s.value || s.winnings,
      }));
      setLeaderboardUsers(mappedWinners);
    } catch (err) {
      console.error("[Supabase Leaderboard] Standing pull failure:", err);
      setLeaderboardUsers(generateFallbackLeaderboard());
    }
  };

  const generateFallbackLeaderboard = () => {
    return [
      { name: "Biniyam #37", value: 1850 },
      { name: "akliluye", value: 1200 },
      { name: "Selam_T", value: 950 },
      { name: "Dawit_Z", value: 850 },
      { name: "Eskinder_A", value: 720 },
      { name: "Hana_G", value: 540 },
    ];
  };

  useEffect(() => {
    loadLeaderboardDataList();
  }, [leaderboardPeriod, leaderboardCategory, tgUserId]);

  // -------------------------------------------------------------
  // WebSockets Setup
  // -------------------------------------------------------------
  useEffect(() => {
    const socket = io(API_BASE, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setApiAvailable(true);
    });

    socket.on("disconnect", () => {
      setApiAvailable(false);
    });

    socket.on("game_starting", (data: any) => {
      if (data.room !== currentRoom) return;
      setGameCancelled(false);
      setGamePaused(false);

      if (game.cards.length > 0 && data.game_id === game.gameId) {
        if (data.total_players) setTotalPlayers(data.total_players);
        return;
      }

      setCurrentGameId(data.game_id || generateCustomGameId());
      if (data.total_players) setTotalPlayers(data.total_players);

      setGame(prev => ({
        ...prev,
        called: new Set<number>(),
        current: null,
        recentBalls: [],
        callCount: 0,
      }));
      setWaitGame({
        called: new Set<number>(),
        current: null,
        recentBalls: [],
        callCount: 0,
      });

      setWinnersThisRound([]);

      if (game.cards.length > 0) {
        setActiveScreen("screen-game");
        startLocalAutoGame();
      } else {
        setActiveScreen("screen-home");
        startWaitDraw();
      }
    });

    socket.on("ball_called", (data: any) => {
      if (data.room !== currentRoom) return;
      const num = data.number;
      if (!num) return;
      
      serverDrivingBalls.current = true;
      if (serverDrivingTimer.current) clearTimeout(serverDrivingTimer.current);
      serverDrivingTimer.current = setTimeout(() => {
        serverDrivingBalls.current = false;
        if (game.cards.length > 0 && !gamePaused) startLocalAutoGame();
      }, 3500);

      processCalledBall(num);
    });

    socket.on("winner_found", (data: any) => {
      if (data.room !== currentRoom) return;
      if (game.cards.length === 0) {
        handleSpecWinner(data);
      }
    });

    socket.on("game_ended", (data: any) => {
      if (data.room !== currentRoom) return;
      stopLocalAutoGame();
      stopWaitDraw();
      if (game.cards.length === 0) {
        handleSpecWinner(data);
      }
    });

    return () => {
      socket.disconnect();
      stopLocalAutoGame();
      stopWaitDraw();
    };
  }, [currentRoom, game.cards.length]);

  // Selection Countdown timer set strictly to 60 seconds
  useEffect(() => {
    if (activeScreen === "screen-home" && game.cards.length === 0) {
      if (selectTimerRef.current) clearInterval(selectTimerRef.current);
      selectTimerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(selectTimerRef.current!);
            triggerActiveGameStart();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (selectTimerRef.current) clearInterval(selectTimerRef.current);
    };
  }, [activeScreen, selCards, game.cards.length, currentStake]);

  // -------------------------------------------------------------
  // Gameplay Mechanics & Win Checking
  // -------------------------------------------------------------
  const selectStake = (stake: number) => {
    if (game.cards.length > 0) {
      showLocalNotification(language === "en" ? "Redirecting you back to your active game!" : "ወደ ንቁ ጨዋታዎ እየተመለሱ ነው!");
      setActiveScreen("screen-game");
      return;
    }

    SoundEffects.playCoin(clicksEnabled);
    setCurrentStake(stake);
    const room = String(stake);
    setCurrentRoom(room);

    if (socketRef.current?.connected) {
      const otherRoom = stake === 10 ? "20" : "10";
      socketRef.current.emit("leave_room", { room: otherRoom });
      socketRef.current.emit("join_room", { room: room });
    }

    const sampleId = generateCustomGameId();
    setCurrentGameId(sampleId);

    setSelCards(new Set());
    setCardDeductMap({});
    setTimeLeft(60); // Set countdown to 60s
    setActiveScreen("screen-home");
    syncAllUserData();
  };

  const generateCustomGameId = (): string => {
    // Sequential game ID generation based on AD{count}WA format as specified
    const nextIdx = gameIndex + 1;
    setGameIndex(nextIdx);
    return `AD${nextIdx}WA`;
  };

  const handleCardCellToggle = (num: number) => {
    SoundEffects.playClick(clicksEnabled);
    const newSel = new Set(selCards);
    const userTotal = playBalance + mainBalance;

    if (newSel.has(num)) {
      newSel.delete(num);
      const item = cardDeductMap[num];
      if (item) {
        setPlayBalance(p => p + item.fromPlay);
        setMainBalance(m => m + item.fromMain);
        const nextMap = { ...cardDeductMap };
        delete nextMap[num];
        setCardDeductMap(nextMap);
      }
      setSelCards(newSel);
    } else {
      if (newSel.size >= 2) return; // limit selection max 2 from prompt
      if (userTotal < currentStake) {
        showLocalNotification(t.insufficientBalance);
        return;
      }
      newSel.add(num);
      
      let fromPlay = 0;
      let fromMain = 0;
      if (playBalance >= currentStake) {
        fromPlay = currentStake;
        setPlayBalance(p => p - currentStake);
      } else {
        fromPlay = playBalance;
        fromMain = currentStake - playBalance;
        setPlayBalance(0);
        setMainBalance(m => m - fromMain);
      }

      setCardDeductMap(prev => ({
        ...prev,
        [num]: { fromPlay, fromMain }
      }));
      setSelCards(newSel);
    }
  };

  const showLocalNotification = (msg: string) => {
    setActiveToast(msg);
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => {
      setActiveToast(null);
    }, 4000);
  };

  const handleBackToStake = () => {
    SoundEffects.playClick(clicksEnabled);
    // Refund chosen cartelas
    let refundedMain = 0;
    let refundedPlay = 0;
    Object.values(cardDeductMap).forEach((item: any) => {
      refundedPlay += item.fromPlay;
      refundedMain += item.fromMain;
    });
    setPlayBalance(p => p + refundedPlay);
    setMainBalance(m => m + refundedMain);
    setSelCards(new Set());
    setCardDeductMap({});
    setActiveScreen("screen-stake");
  };

  const buildRandomBingoCard = (): BingoCard => {
    const card: BingoCard = new Array(25);
    for (let c = 0; c < 5; c++) {
      const min = c * 15 + 1;
      const max = c * 15 + 15;
      const pool: number[] = [];
      for (let i = min; i <= max; i++) pool.push(i);
      
      // Shuffle column digits list
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
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
  };

  const triggerActiveGameStart = async () => {
    const cardNumbers = Array.from(selCards) as number[];
    if (cardNumbers.length === 0) {
      // Watching Only mode! They did not select cards. Just show wait drawers
      setActiveScreen("screen-game");
      startWaitDraw();
      return;
    }

    const betRequired = cardNumbers.length * currentStake;
    let purchaseSuccessful = true;
    let purchaseErrorMessage = "";

    // Load deterministic cards matching preview exactly
    const activeCards = cardNumbers.map(num => getDeterministicBingoCard(num));

    if (tgUserId) {
      try {
        // Step A: Register or create the game record in Supabase games table
        try {
          await createGameInDb(currentGameId, currentRoom, currentStake);
        } catch (gameErr) {
          console.warn("[Supabase] CreateGameInDb warning (perhaps exists):", gameErr);
        }

        // Step B: Atomically purchase and record every card bet individually in Supabase
        for (let i = 0; i < cardNumbers.length; i++) {
          const cardNum = cardNumbers[i];
          const flatMatrixArray = activeCards[i].map(cell => (typeof cell.n === "number" ? cell.n : 0));
          await purchaseBingoCardInDb(
            tgUserId,
            currentStake,
            currentGameId,
            i,
            cardNum,
            flatMatrixArray
          );
        }
        
        // Step C: Sync latest balances to display
        await syncAllUserData();
        purchaseSuccessful = true;
      } catch (err: any) {
        purchaseSuccessful = false;
        purchaseErrorMessage = err?.message || "Deduct Error";
      }
    }

    if (!purchaseSuccessful) {
      showLocalNotification(purchaseErrorMessage || "Deduct/Bet Error");
      return;
    }

    SoundEffects.playCoin(clicksEnabled);

    const initialMarked = activeCards.map(() => new Set<number>([12]));
    const initialWon = activeCards.map(() => new Set<number>());

    setGame({
      gameId: currentGameId,
      called: new Set<number>(),
      current: null,
      recentBalls: [],
      callCount: 0,
      totalPlayers: 24, 
      cards: activeCards,
      cardNums: cardNumbers,
      marked: initialMarked,
      wonLines: initialWon,
      winAmount: Math.round(betRequired * 1.8),
      betDeducted: true,
    });

    setWinnersThisRound([]);

    if (socketRef.current?.connected) {
      socketRef.current.emit("request_countdown", { game_id: currentGameId, room: currentRoom });
      socketRef.current.emit("player_ready", {
        user_id: tgUserId,
        name: tgUsername || "ተጫዋች",
        cards: cardNumbers,
        game_id: currentGameId,
        room: currentRoom,
      });
    }

    setActiveScreen("screen-game");
    startLocalAutoGame();
  };

  const processCalledBall = (num: number) => {
    if (gamePaused) return;

    SoundEffects.playBallSwoop(bingoSoundsEnabled);

    // Sync called balls directly to Supabase
    const updatedCalled = new Set(game.called).add(num);
    saveCalledBallsInDb(currentGameId, Array.from(updatedCalled) as number[]).catch(err => {
      console.warn("[Supabase App] Sync called balls to database failure:", err);
    });

    setGame(prev => {
      if (prev.called.has(num)) return prev;
      const nextCalled = new Set(prev.called).add(num);
      const nextRecent = [...prev.recentBalls, num].slice(-6);

      const nextMarked = prev.marked.map((set, ci) => {
        const updated = new Set(set);
        if (isAutomaticMarker) {
          prev.cards[ci].forEach((cell, idx) => {
            if (cell.n === num) updated.add(idx);
          });
        }
        return updated;
      });

      const nextWonLines = prev.wonLines.map((wonSet, ci) => {
        const linesDef = [
          [0, 1, 2, 3, 4], [5, 6, 7, 8, 9], [10, 11, 12, 13, 14], [15, 16, 17, 18, 19], [20, 21, 22, 23, 24],
          [0, 5, 10, 15, 20], [1, 6, 11, 16, 21], [2, 7, 12, 17, 22], [3, 8, 13, 18, 23], [4, 9, 14, 19, 24],
          [0, 6, 12, 18, 24], [4, 8, 12, 16, 20],
          [0, 4, 20, 24]
        ];

        const newlyWon = new Set<any>();
        linesDef.forEach(line => {
          if (line.every(cellIdx => nextMarked[ci].has(cellIdx))) {
            newlyWon.add(line);
          }
        });
        return newlyWon;
      });

      announceBall(num, bingoSoundsEnabled);

      return {
        ...prev,
        called: nextCalled,
        current: num,
        recentBalls: nextRecent,
        callCount: prev.callCount + 1,
        marked: nextMarked,
        wonLines: nextWonLines,
      };
    });

    setWaitGame(prev => {
      if (prev.called.has(num)) return prev;
      return {
        called: new Set(prev.called).add(num),
        current: num,
        recentBalls: [...prev.recentBalls, num].slice(-4),
        callCount: prev.callCount + 1,
      };
    });
  };

  // Limit win state strictly to ONLY ONE WINNER (Stopping checks on first matched crown)
  useEffect(() => {
    if (activeScreen === "screen-game" && game.cards.length > 0) {
      for (let ci = 0; ci < game.wonLines.length; ci++) {
        const wonSet = game.wonLines[ci];
        if (wonSet.size > 0) {
          const alreadyWon = winnersThisRound.length > 0;
          if (!alreadyWon) {
            const labelName = tgUsername || "አድዋ";
            const numLabel = game.cardNums[ci];
            const winningDec: WinnerDeclaration = {
              name: labelName,
              cardNum: numLabel,
              cardIndex: ci,
              userId: tgUserId,
              card: game.cards[ci],
              marked: game.marked[ci],
              wonLines: Array.from(wonSet) as any,
            };

            setWinnersThisRound([winningDec]); // ONLY ONE WINNER

            if (socketRef.current?.connected) {
              socketRef.current.emit("declare_winner", {
                user_id: tgUserId,
                name: labelName,
                card_num: numLabel,
                card_index: ci,
                game_id: game.gameId,
                room: currentRoom,
              });
            }

            SoundEffects.playVictory(bingoSoundsEnabled);
            SoundEffects.playBingoWin(bingoSoundsEnabled);
            stopLocalAutoGame();
            triggerWinCelebrationScreen([winningDec]);
            break; 
          }
        }
      }
    }
  }, [game.wonLines, activeScreen]);

  const handleGridCellManualTap = (cardIndex: number, cellIndex: number) => {
    if (cellIndex === 12) return;
    if (isAutomaticMarker) return; // Prevent manual modification only if automarker is active
    
    // User can only select a cell if the number has already been called
    const cellNum = game.cards[cardIndex]?.[cellIndex]?.n;
    if (typeof cellNum === "number" && !game.called.has(cellNum)) {
      showLocalNotification(language === "en" ? "This number has not been called yet!" : "ይህ ቁጥር ገና አልተጠራም!");
      return;
    }

    SoundEffects.playClick(clicksEnabled);
    setGame(prev => {
      const updatedMarked = [...prev.marked];
      const matchSet = new Set(updatedMarked[cardIndex]);
      if (matchSet.has(cellIndex)) {
        matchSet.delete(cellIndex);
      } else {
        matchSet.add(cellIndex);
      }
      updatedMarked[cardIndex] = matchSet;
      return {
        ...prev,
        marked: updatedMarked,
      };
    });
  };

  const startLocalAutoGame = () => {
    stopLocalAutoGame();
    localAutoRef.current = setInterval(() => {
      if (serverDrivingBalls.current || gamePaused || activeScreen !== "screen-game") return;
      
      const currentGame = gameRef.current;
      if (currentGame.called.size >= 75) {
        stopLocalAutoGame();
        triggerWinCelebrationScreen([]);
        return;
      }

      const remainPool: number[] = [];
      for (let i = 1; i <= 75; i++) {
        if (!currentGame.called.has(i)) {
          remainPool.push(i);
        }
      }

      if (remainPool.length > 0) {
        const fetchRandomNum = remainPool[Math.floor(Math.random() * remainPool.length)];
        processCalledBall(fetchRandomNum);
      }
    }, 3200);
  };

  const stopLocalAutoGame = () => {
    if (localAutoRef.current) {
      clearInterval(localAutoRef.current);
      localAutoRef.current = null;
    }
  };

  const startWaitDraw = () => {
    stopWaitDraw();
    setWaitGame({
      called: new Set<number>(),
      current: null,
      recentBalls: [],
      callCount: 0,
    });

    waitAutoRef.current = setInterval(() => {
      if (gamePaused) return;
      setWaitGame(prev => {
        if (prev.called.size >= 75) {
          stopWaitDraw();
          return prev;
        }
        const pool: number[] = [];
        for (let i = 1; i <= 75; i++) {
          if (!prev.called.has(i)) pool.push(i);
        }
        const n = pool[Math.floor(Math.random() * pool.length)];
        
        announceBall(n, bingoSoundsEnabled);
        SoundEffects.playBallSwoop(bingoSoundsEnabled);

        return {
          called: new Set(prev.called).add(n),
          current: n,
          recentBalls: [...prev.recentBalls, n].slice(-4),
          callCount: prev.callCount + 1,
        };
      });
    }, 3400);
  };

  const stopWaitDraw = () => {
    if (waitAutoRef.current) {
      clearInterval(waitAutoRef.current);
      waitAutoRef.current = null;
    }
  };

  const triggerWinCelebrationScreen = async (winnersList?: WinnerDeclaration[]) => {
    setActiveScreen("screen-winner");
    setWinnerCountdown(12);

    const winPotTotal = (totalPlayers || 4) * currentStake;
    const finalPrize = Math.round(winPotTotal * 1.8);

    if (winnersList && winnersList.length > 0 && winnersList[0].userId === tgUserId) {
      try {
        await declareWinnerInDb(tgUserId, finalPrize, game.gameId, winnersList[0].cardNum);
        console.log("[Supabase Win Registration] Credited winner successfully in database:", finalPrize);
        await syncAllUserData();
        showLocalNotification(`BINGO_WIN:Congratulations! You won ${finalPrize} Birr!`);
      } catch (err) {
        console.error("[Supabase Win Registration] Failed to write win record:", err);
        setMainBalance(prev => prev + finalPrize);
        showLocalNotification(`BINGO_WIN:Congratulations! You won ${finalPrize} Birr!`);
      }
    } else {
      // Round complete but this player did not win. Register status change in DB.
      try {
        await updateGameStatusInDb(game.gameId, "ended", null, null);
      } catch (err) {
        console.warn("[Supabase Win Registration] Failed to finalize status of non-winning game:", err);
      }
    }

    if (animateWinnerRef.current) clearInterval(animateWinnerRef.current);
    animateWinnerRef.current = setInterval(() => {
      setWinnerCountdown(prev => {
        if (prev <= 1) {
          clearInterval(animateWinnerRef.current!);
          resetFullRoundToSelect();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSpecWinner = (data: any) => {
    SoundEffects.playBingoWin(bingoSoundsEnabled);
    const wins = data.winners || [{ name: data.winner_name || "Biniyami", cardNum: data.winner_card || 37 }];
    const formatted: WinnerDeclaration[] = [wins[0]].map((w: any) => ({
      name: w.name || w.winner_name || "Biniyami",
      cardNum: Number(w.cardNum || w.winner_card || 37),
      cardIndex: 0,
      userId: 987,
      card: buildRandomBingoCard(),
      marked: new Set([0,4,12,20,24]),
      wonLines: [],
    }));

    setWinnersThisRound(formatted);
    setActiveScreen("screen-winner");
    setWinnerCountdown(10);

    if (animateWinnerRef.current) clearInterval(animateWinnerRef.current);
    animateWinnerRef.current = setInterval(() => {
      setWinnerCountdown(prev => {
        if (prev <= 1) {
          clearInterval(animateWinnerRef.current!);
          resetFullRoundToSelect();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const resetFullRoundToSelect = () => {
    stopLocalAutoGame();
    stopWaitDraw();
    setGamePaused(false);
    setGameCancelled(false);
    setSelCards(new Set());
    setCardDeductMap({});
    setWinnersThisRound([]);

    setGame({
      gameId: null,
      called: new Set<number>(),
      current: null,
      recentBalls: [],
      callCount: 0,
      totalPlayers: 0,
      cards: [],
      cardNums: [],
      marked: [],
      wonLines: [],
      winAmount: 0,
      betDeducted: false,
    });

    setWaitGame({
      called: new Set<number>(),
      current: null,
      recentBalls: [],
      callCount: 0,
    });

    setTimeLeft(60); 
    const nextGameId = generateCustomGameId();
    setCurrentGameId(nextGameId);
    setActiveScreen("screen-home");
    syncAllUserData();
  };

  const dismissCancelOverlay = () => {
    setGameCancelled(false);
    resetFullRoundToSelect();
  };

  // -------------------------------------------------------------
  // Admin Features Handler
  // -------------------------------------------------------------
  const handleLogoClickForAdmin = () => {
    SoundEffects.playClick(clicksEnabled);
    const nextClickCount = adminClicks + 1;
    setAdminClicks(nextClickCount);
    if (nextClickCount >= 5) {
      setAdminClicks(0);
      setShowAdminPasswordModal(true);
    }
  };

  const handleVerifyAdminPassword = () => {
    if (adminPasswordInput === "ADWA105") {
      setIsAdminUnlocked(true);
      setShowAdminPasswordModal(false);
      setAdminPasswordInput("");
      showLocalNotification("Admin Workspace Unlocked successfully!");
    } else {
      showLocalNotification(t.wrongPassword);
      setAdminPasswordInput("");
    }
  };

  // Extended Super Admin Handlers
  const logAdminAction = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setAuditLogs(prev => [`[${timestamp}] ${msg}`, ...prev]);
  };

  const handleAdminAddBalanceForId = (id: string, amount: number) => {
    SoundEffects.playCoin(clicksEnabled);
    const amt = Number(amount) || 100;

    // Core logged-in user balance sync
    if (id === "7348631392" || id === String(tgUserId)) {
      setMainBalance(prev => prev + amt);
    }

    setSimulatedUsers(prev => {
      const existing = prev[id] || { id, username: `Sim_User_${id.slice(-4)}`, balance: 0, status: "Active" as const, logs: [] };
      const nextBalance = existing.balance + amt;
      const updatedLogs = [`Credited +${amt} Birr by Admin.`, ...existing.logs];
      return {
        ...prev,
        [id]: { ...existing, balance: nextBalance, logs: updatedLogs }
      };
    });

    logAdminAction(`Credited +${amt} Birr to user profile #${id}`);
    showLocalNotification(`Credited +${amt} Birr to User #${id}`);
  };

  const handleAdminReduceBalanceForId = (id: string, amount: number) => {
    SoundEffects.playClick(clicksEnabled);
    const amt = Number(amount) || 100;

    // Core logged-in user balance sync
    if (id === "7348631392" || id === String(tgUserId)) {
      setMainBalance(prev => Math.max(0, prev - amt));
    }

    setSimulatedUsers(prev => {
      const existing = prev[id] || { id, username: `Sim_User_${id.slice(-4)}`, balance: 0, status: "Active" as const, logs: [] };
      const nextBalance = Math.max(0, existing.balance - amt);
      const updatedLogs = [`Debited -${amt} Birr by Admin.`, ...existing.logs];
      return {
        ...prev,
        [id]: { ...existing, balance: nextBalance, logs: updatedLogs }
      };
    });

    logAdminAction(`Reduced balance by -${amt} Birr for user profile #${id}`);
    showLocalNotification(`Reduced balance by -${amt} Birr for User #${id}`);
  };

  const handleAdminToggleUserBanStatus = (id: string) => {
    SoundEffects.playClick(clicksEnabled);
    let newStatus = "Active" as string;

    setSimulatedUsers(prev => {
      const existing = prev[id] || { id, username: `Sim_User_${id.slice(-4)}`, balance: 150, status: "Active" as const, logs: [] };
      newStatus = existing.status === "Active" ? "Banned" : "Active";
      const updatedLogs = [`Status changed to ${newStatus} by Admin.`, ...existing.logs];
      return {
        ...prev,
        [id]: { ...existing, status: newStatus, logs: updatedLogs }
      };
    });

    if (newStatus === "Banned") {
      setLastBannedIdList(prev => [...prev, id]);
    } else {
      setLastBannedIdList(prev => prev.filter(x => x !== id));
    }

    logAdminAction(`Toggled ban state for user #${id} to ${newStatus.toUpperCase()}`);
    showLocalNotification(`User #${id} is now ${newStatus}`);
  };

  // CBE / Telebirr mock deposit addition
  const handleAdminSimulateNewDeposit = (name: string, amt: number) => {
    SoundEffects.playClick(clicksEnabled);
    const nextId = Math.floor(Math.random() * 900) + 301;
    const newRecord = { id: nextId, name, amount: amt, time: "Just now" };
    setAdminDeposits(prev => [newRecord, ...prev]);
    logAdminAction(`Simulated incoming CBE transaction check from ${name} for ${amt} Birr`);
    showLocalNotification(`Incoming dep check: ${name} (+${amt} Birr)`);
  };

  // CBE / Telebirr mock withdrawal simulator
  const handleAdminSimulateNewWithdrawal = (name: string, amt: number) => {
    SoundEffects.playClick(clicksEnabled);
    const nextId = Math.floor(Math.random() * 900) + 104;
    const newRecord = { id: nextId, name, amount: amt, status: "Pending" as const, time: "Just now" };
    setAdminWithdrawals(prev => [newRecord, ...prev]);
    logAdminAction(`Simulated cashout checkout request from ${name} of ${amt} Birr`);
    showLocalNotification(`Cashout queue: ${name} needs ${amt} Birr`);
  };

  const handleAdminForceCallBall = (num: number) => {
    if (num < 1 || num > 75) {
      showLocalNotification("Pick number between 1 and 75");
      return;
    }
    SoundEffects.playBallSwoop(bingoSoundsEnabled);
    processCalledBall(num);
    logAdminAction(`Administratively injected specific ball draw #${num}`);
    showLocalNotification(`Direct ball called: ${num}`);
  };

  const handleAdminForceInstantWinner = (winner: string) => {
    SoundEffects.playVictory(bingoSoundsEnabled);
    const formatPayload = {
      winners: [{ name: winner, cardNum: 37 }]
    };
    handleSpecWinner(formatPayload);
    logAdminAction(`Preempted winner matching - forced ${winner} to claim bingo!`);
    showLocalNotification(`Won! Forced round claim for winner name: ${winner}`);
  };

  const handleAdminTopUpUser = (amt: number) => {
    SoundEffects.playCoin(clicksEnabled);
    setMainBalance(p => p + amt);
    showLocalNotification(`Credited ${amt} Birr to your dashboard!`);
  };

  const handleAdminApproveWithdraw = (id: number, amt: number) => {
    SoundEffects.playClick(clicksEnabled);
    setAdminWithdrawals(prev => prev.map(w => w.id === id ? { ...w, status: "Approved" } : w));
    // Correctly apply standard user cashout debit
    setMainBalance(prev => Math.max(0, prev - amt));
    logAdminAction(`Approved Cashout Withdrawal Request #${id} for ${amt} Birr`);
    showLocalNotification(`Withdrawal request #${id} approved!`);
  };

  const handleAdminRejectWithdraw = (id: number) => {
    SoundEffects.playClick(clicksEnabled);
    setAdminWithdrawals(prev => prev.map(w => w.id === id ? { ...w, status: "Rejected" } : w));
    logAdminAction(`Rejected Cashout Withdrawal Request #${id}`);
    showLocalNotification(`Withdrawal request #${id} rejected.`);
  };

  const handleAdminToggleBan = (usernameStr: string) => {
    SoundEffects.playClick(clicksEnabled);
    if (lastBannedIdList.includes(usernameStr)) {
      setLastBannedIdList(prev => prev.filter(x => x !== usernameStr));
      showLocalNotification(`Player @${usernameStr} unbanned!`);
    } else {
      setLastBannedIdList(prev => [...prev, usernameStr]);
      showLocalNotification(`Player @${usernameStr} banned from active rooms.`);
    }
  };

  const handleAdminStopPauseResume = (action: "pause" | "resume" | "stop") => {
    SoundEffects.playClick(clicksEnabled);
    if (action === "pause") {
      setGamePaused(true);
      showLocalNotification("Gameplay Paused!");
    } else if (action === "resume") {
      setGamePaused(false);
      showLocalNotification("Gameplay Resumed!");
    } else {
      setGameCancelled(true);
      showLocalNotification("Gameplay Cancelled & Refunded!");
    }
  };

  // -------------------------------------------------------------
  // Left 75-Number Grid generation
  // -------------------------------------------------------------
  const renderLeftVerticalGridBINGO = () => {
    const isWaitMode = game.cards.length === 0;
    const currentCalledSet = isWaitMode ? waitGame.called : game.called;

    // Render columns arrangement: column B (1-15), I (16-30), N (31-45), G (46-60), O (61-75)
    return (
      <div className="w-[140px] flex flex-col bg-[#161630] border border-white/10 rounded-xl overflow-hidden shrink-0">
        {/* Horizontal Headers */}
        <div className="grid grid-cols-5 text-center text-[10px] font-black py-1.5 border-b border-white/10">
          <span style={{ color: COL_COLORS.B }}>B</span>
          <span style={{ color: COL_COLORS.I }}>I</span>
          <span style={{ color: COL_COLORS.N }}>N</span>
          <span style={{ color: COL_COLORS.G }}>G</span>
          <span style={{ color: COL_COLORS.O }}>O</span>
        </div>

        {/* 15 rows of circles */}
        <div className="flex-1 grid grid-cols-5 p-1 gap-1 overflow-y-auto">
          {Array.from({ length: 15 }).map((_, rIndex) => {
            return (
              <React.Fragment key={rIndex}>
                {COLS.map((col, cIndex) => {
                  const num = cIndex * 15 + rIndex + 1;
                  const isCalled = currentCalledSet.has(num);
                  const color = COL_COLORS[col];
                  
                  return (
                    <div
                      key={col + num}
                      className={`aspect-square rounded flex items-center justify-center text-[8px] font-black transition-all ${
                        isCalled
                          ? "text-black scale-105 shadow-inner"
                          : "bg-white/[0.04] text-zinc-500 border border-white/[0.02]"
                      }`}
                      style={{
                        backgroundColor: isCalled ? color : undefined,
                        boxShadow: isCalled ? `0 0 6px ${color}50` : undefined
                      }}
                    >
                      {num}
                    </div>
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  const handleTabClick = (tab: AppTab) => {
    SoundEffects.playClick(clicksEnabled);
    if (activeScreen === "screen-game") {
      showLocalNotification(language === "en" ? "You cannot leave during an active live game!" : "በንቁ ጨዋታ መሃል መውጣት አይችሉም!");
      return;
    }
    setActiveTab(tab);
  };

  // -------------------------------------------------------------
  // JSX RENDERING DETAILS
  // -------------------------------------------------------------
  return (
    <div className={`max-w-[420px] mx-auto min-h-screen relative flex flex-col pb-20 justify-between select-none border-x shadow-2xl transition-colors duration-300 ${
      themeMode === "light" 
        ? "bg-slate-50 text-[#09091e] border-slate-200" 
        : "bg-[#09091e] text-white border-white/5"
    }`}>
      
      {/* -------------------------------------------------------------
          Top Header Nav Area
         ------------------------------------------------------------- */}
      <header className={`p-3 border-b flex flex-col gap-2 shrink-0 ${
        themeMode === "light" ? "bg-white/95 border-slate-100" : "bg-gradient-to-b from-[#11112e] to-[#09091e] border-white/5"
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Clickable Circle brand logo (5 clicks to open admin password prompt gate) */}
            <div 
              onClick={handleLogoClickForAdmin}
              className="w-10 h-10 rounded-full overflow-hidden border border-orange-accent/20 cursor-pointer active:scale-95 transition-all shrink-0"
            >
              <img 
                src={photoUrl} 
                className="w-full h-full object-cover" 
                alt="Adwa Logo"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="flex flex-col">
              <span className="text-sm font-black tracking-widest bg-gradient-to-r from-orange-accent via-gold to-green-accent bg-clip-text text-transparent italic font-display">
                ADWA BINGO
              </span>
              <span className="text-[9px] text-zinc-500 font-bold font-mono tracking-wider">
                ADWA105 • {tgUsername ? `@${tgUsername}` : `ID: ${tgUserId}`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Setting Icon Shortcut */}
            <button
              onClick={() => {
                SoundEffects.playClick(clicksEnabled);
                setActiveTab("profile");
              }}
              className={`p-2 rounded-lg cursor-pointer ${
                themeMode === "light" ? "bg-slate-100/80 text-slate-800" : "bg-white/5 text-zinc-300"
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
            </button>

            {/* Quick sound switch (Toggles Bingo Announcer) */}
            <button
              onClick={() => {
                const nextVal = !bingoSoundsEnabled;
                setBingoSoundsEnabled(nextVal);
                try { localStorage.setItem("bingo_sounds_enabled", String(nextVal)); } catch {}
                SoundEffects.playClick(clicksEnabled);
              }}
              className={`p-2 rounded-lg cursor-pointer ${
                bingoSoundsEnabled
                  ? "bg-blue-accent/15 text-blue-accent"
                  : "bg-white/5 text-zinc-500"
              }`}
            >
              {bingoSoundsEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>

            {isAdminUnlocked && (
              <span className="bg-red-500 text-black text-[8px] font-black px-1.5 py-0.5 rounded uppercase flex items-center gap-0.5 animate-pulse">
                <Shield className="w-2 h-2" /> Admin
              </span>
            )}
          </div>
        </div>

        {/* Dynamic header widgets representation display: HIDE when on screen-stake (stake select viewport limit requested by user) or active admin tab */}
        {activeScreen !== "screen-stake" && activeTab !== "admin" && (
          <div className="grid grid-cols-5 gap-1 text-center mt-1">
            <div className={`border rounded-lg p-1 ${themeMode === "light" ? "bg-slate-100 border-slate-200" : "bg-[#12122a] border-white/5"}`}>
              <div className="text-[7.5px] text-zinc-500 font-black tracking-wider">{t.mainBal}</div>
              <div className="font-mono text-[10.5px] font-bold text-green-accent truncate">
                {(mainBalance + playBalance).toFixed(1)}
              </div>
            </div>
            
            <div className={`border rounded-lg p-1 ${themeMode === "light" ? "bg-slate-100 border-slate-200" : "bg-[#12122a] border-white/5"}`}>
              <div className="text-[7.5px] text-zinc-500 font-black tracking-wider">{t.gameId}</div>
              <div className="font-mono text-[10.5px] font-extrabold text-[#9b59b6] truncate">
                {currentGameId ? currentGameId : "—"}
              </div>
            </div>

            <div className={`border rounded-lg p-1 ${themeMode === "light" ? "bg-slate-100 border-slate-200" : "bg-[#12122a] border-white/5"}`}>
              <div className="text-[7.5px] text-zinc-500 font-black tracking-wider">{t.stake}</div>
              <div className="font-mono text-[10.5px] font-bold text-orange-accent text-center">
                {currentStake}
              </div>
            </div>

            <div className={`border rounded-lg p-1 ${themeMode === "light" ? "bg-slate-100 border-slate-200" : "bg-[#12122a] border-white/5"}`}>
              <div className="text-[7.5px] text-zinc-500 font-black tracking-wider">{t.reward}</div>
              <div className="font-mono text-[10.5px] font-bold text-[#ffd700] truncate">
                {activeScreen === "screen-game" ? game.winAmount : Math.max(18, Math.round(selCards.size * currentStake * 1.8))}
              </div>
            </div>

            <div className={`border rounded-lg p-1 ${themeMode === "light" ? "bg-slate-100 border-slate-200" : "bg-[#12122a] border-white/5"}`}>
              <div className="text-[7.5px] text-zinc-500 font-black tracking-wider">{t.time}</div>
              <div className={`font-mono text-[10.5px] font-black ${
                timeLeft <= 15 && activeScreen === "screen-home" ? "text-red-500 animate-pulse text-[11px]" : "text-yellow-400"
              }`}>
                {activeScreen === "screen-home" ? `${timeLeft}s` : "LIVE"}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* -------------------------------------------------------------
          TABS SWITCH PANEL CONTENTS
         ------------------------------------------------------------- */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        
        {/* TAB 1: HOME PANEL */}
        {activeTab === "home" && (
          <div className="flex-1 flex flex-col">
            
            {/* SCREEN 1: CHOOSE GAME STAKE */}
            {activeScreen === "screen-stake" && (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                
                <div className="relative mb-6">
                  {/* Circular hero illustration using user's miniapp logo as matching prompt */}
                  <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-dashed border-orange-accent/40 p-1 flex items-center justify-center animate-spin-slow">
                    <img 
                      src={photoUrl} 
                      className="w-full h-full rounded-full object-cover" 
                      alt="Banner Logo"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-gold text-black w-8 h-8 rounded-full flex items-center justify-center shadow font-black text-xs">
                    🍀
                  </div>
                </div>

                <h1 className="text-xl font-black tracking-wider mb-2 text-[#ffd700] font-display">
                  {language === "am" ? "አድዋ የቢንጎ ጨዋታ" : "WELCOME TO ADWA BINGO"}
                </h1>
                <p className="text-xs text-zinc-400 max-w-[280px] mb-8 leading-relaxed">
                  አድዋ ቢንጎ - ፈጣን እና አስተማማኝ！ {t.welcome}
                </p>

                <div className="w-full max-w-[290px] flex flex-col gap-3">
                  <div className="text-xs font-black text-orange-accent uppercase tracking-widest mb-1">
                    {t.chooseStake}
                  </div>
                  
                  {/* Stake 10 Button */}
                  <button
                    onClick={() => selectStake(10)}
                    className="w-full bg-gradient-to-r from-emerald-600 to-green-700 text-white font-black text-base py-3 px-5 rounded-xl shadow-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-between border border-emerald-500/20"
                  >
                    <span className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-yellow-300" />
                      <span>{t.playX.replace("{amount}", "10")}</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-white/80" />
                  </button>

                  {/* Stake 20 Button */}
                  <button
                    onClick={() => selectStake(20)}
                    className="w-full bg-gradient-to-r from-blue-750 to-indigo-850 text-white font-black text-base py-3 px-5 rounded-xl shadow-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-between border border-blue-500/20"
                  >
                    <span className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-yellow-300" />
                      <span>{t.playX.replace("{amount}", "20")}</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-white/80" />
                  </button>
                </div>
              </div>
            )}

            {/* SCREEN 2: BINGO SELECTION SEED LIST */}
            {activeScreen === "screen-home" && (
              <div className="flex-1 flex flex-col">
                <div className="p-3 bg-gradient-to-r from-blue-900/10 via-[#1a1a3e]/30 to-purple-900/10 text-center border-b border-light/5 flex justify-between items-center px-4">
                  <button 
                    onClick={handleBackToStake}
                    className="flex items-center gap-1 text-[11px] font-bold text-orange-accent bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded"
                  >
                    <ArrowLeft className="w-3" />
                    <span>{t.backToStake}</span>
                  </button>
                  <span className="text-[11px] text-zinc-300 font-black">
                    {t.selectCardsLimit}
                  </span>
                </div>

                {/* Grid selection list 1-400 */}
                <div className="flex-1 overflow-y-auto p-2">
                  <div className="grid grid-cols-8 gap-1">
                    {Array.from({ length: 120 }, (_, i) => i + 1).map(num => {
                      const isSelected = selCards.has(num);
                      const isDisabled = !isSelected && selCards.size >= 2;
                      return (
                        <button
                          key={num}
                          disabled={isDisabled}
                          onClick={() => handleCardCellToggle(num)}
                          className={`aspect-square rounded-lg flex items-center justify-center text-[10px] font-black border transition-all cursor-pointer ${
                            isSelected
                              ? "bg-gradient-to-br from-orange-accent to-amber-500 text-black border-yellow-300 font-bold scale-[1.05]"
                              : isDisabled
                              ? "bg-white/[0.01] border-transparent text-zinc-700 cursor-not-allowed"
                              : themeMode === "light"
                              ? "bg-slate-200/80 hover:bg-slate-300 border-slate-300/40 text-slate-800"
                              : "bg-[#18183c]/80 hover:bg-[#202050] border-white/10 text-zinc-300"
                          }`}
                        >
                          {num}
                        </button>
                      );
                    })}
                  </div>

                  {/* Dynamic Deterministic Cartela Previews: Show the numbers of chosen matrices as requested */}
                  {selCards.size > 0 && (
                    <div className="mt-4 border-t border-white/5 pt-3">
                      <h4 className="text-[10px] font-black text-orange-accent mb-2 uppercase tracking-wide flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-orange-accent animate-pulse" />
                        <span>SELECTED CARTELA LAYOUTS / የተመረጡ ማውጫዎች ቅድመ-እይታ</span>
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {Array.from(selCards).map((cardNum: any) => {
                          const matrix = getDeterministicBingoCard(Number(cardNum));
                          return (
                            <div key={cardNum} className="bg-black/30 border border-white/5 p-2 rounded-lg">
                              <div className="flex justify-between items-center mb-1 text-[9px] text-zinc-300 font-bold border-b border-white/5 pb-0.5">
                                <span>CARTELA #{cardNum}</span>
                                <span className="text-gold text-[7px] font-mono">REAL PREVIEW</span>
                              </div>
                              <div className="grid grid-cols-5 gap-[2px] text-center">
                                {['B','I','N','G','O'].map(letter => (
                                  <div key={letter} className="text-[7.5px] font-mono font-black text-yellow-400">{letter}</div>
                                ))}
                                {matrix.map((cell, idx) => (
                                  <div 
                                    key={idx} 
                                    className={`aspect-square flex items-center justify-center text-[8.5px] font-black rounded border ${
                                      cell.n === "★" 
                                        ? "bg-gold/20 text-gold border-gold/10" 
                                        : "bg-white/[0.03] border-white/5 text-zinc-100"
                                    }`}
                                  >
                                    {cell.n}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Symmetrical Countdown Footer with NO manual START GAME trigger button as requested */}
                <div className={`p-3 border-t flex items-center justify-between shrink-0 ${
                  themeMode === "light" ? "bg-slate-100 border-slate-200" : "bg-[#11112e] border-white/10"
                }`}>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-zinc-400">{t.selectedCards}</span>
                    <span className="text-sm font-black text-gold">
                      {selCards.size} / 2 Cartelas
                    </span>
                  </div>

                  <div className="px-3.5 py-1.5 bg-gradient-to-r from-[#17173b] to-[#1c1c4d] border border-white/10 rounded-xl font-black text-[10.5px] text-yellow-400 flex items-center gap-1.5 shadow-md">
                    <Clock className="w-3.5 h-3.5 animate-spin text-orange-accent" />
                    <span>AUTO START IN {timeLeft}S</span>
                  </div>
                </div>
              </div>
            )}

            {/* SCREEN 3: ACTIVE GAMESTREAM BOARD & SPECTATOR VIEWS */}
            {activeScreen === "screen-game" && (
              <div className="flex-1 flex flex-row p-2 gap-2 h-full overflow-hidden">
                
                {/* 1. LEFT COLUMN: Symmetrical 75-number called checker (Screenshots Matching layout) */}
                {renderLeftVerticalGridBINGO()}

                {/* 2. RIGHT COLUMN: Interactive stream & progress detail */}
                <div className="flex-1 flex flex-col gap-2 min-w-0">
                  
                  {/* Called Ball top Display Panel with recent balls tracking grid */}
                  <div className={`border p-2.5 rounded-xl flex flex-col justify-between ${
                    themeMode === "light" ? "bg-slate-100 border-slate-200" : "bg-[#131333] border-white/10"
                  }`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[8px] text-zinc-400 font-mono font-bold tracking-wider uppercase">
                        {t.recentBallsLabel}
                      </span>
                      {/* Past Queues icons status row */}
                      <span className="text-[8.5px] font-bold text-orange-accent">
                        No {game.cards.length === 0 ? waitGame.called.size : game.called.size}
                      </span>
                    </div>

                    {/* Past row balls circular representations */}
                    <div className="flex gap-1 overflow-x-auto py-0.5">
                      {(game.cards.length === 0 ? waitGame.recentBalls : game.recentBalls).slice(-4).map((n, idx) => {
                        const L = getLetterForNumber(n);
                        const colColor = COL_COLORS[L];
                        return (
                          <div
                            key={idx}
                            style={{ backgroundColor: colColor }}
                            className="w-7 h-7 rounded-full flex flex-col items-center justify-center text-[8.5px] font-black text-black ring-1 ring-white/10 shrink-0 scale-95"
                          >
                            <span className="text-[6.5px] leading-none opacity-85">{L}</span>
                            <span className="leading-none mt-0.5">{n}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Golden shining Orb announcer */}
                  <div className={`border p-4 rounded-xl flex flex-col items-center justify-center text-center relative overflow-hidden ${
                    themeMode === "light" ? "bg-slate-100 border-slate-200" : "bg-[#14143a] border-white/5"
                  }`}>
                    {/* Pulsing indicator */}
                    <div className="text-[9px] text-zinc-400 font-mono tracking-wide uppercase mb-2">
                      Get ready for the next number!
                    </div>

                    {/* Outer shining border */}
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#9b59b6] via-amber-500 to-orange-accent p-0.5 flex items-center justify-center shadow-lg shadow-orange-accent/10">
                      <div className="w-full h-full rounded-full bg-black/95 flex flex-col items-center justify-center text-white">
                        {(() => {
                          const currentVal = game.cards.length === 0 ? waitGame.current : game.current;
                          if (currentVal) {
                            return (
                              <>
                                <span className="text-[8px] tracking-wider uppercase opacity-75" style={{ color: COL_COLORS[getLetterForNumber(currentVal)] }}>
                                  {getLetterForNumber(currentVal)}
                                </span>
                                <span className="text-lg font-black -mt-1 leading-none text-gold">
                                  {currentVal}
                                </span>
                              </>
                            );
                          }
                          return <div className="text-[9px] text-zinc-500">Wait...</div>;
                        })()}
                      </div>
                    </div>

                    {/* Symmetrical timeline loader spacer */}
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mt-3">
                      <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-accent h-full animate-pulse" style={{ width: "70%" }}></div>
                    </div>
                  </div>

                  {/* Automatic Switch Trigger Row */}
                  <div className={`p-1.5 px-3 rounded-lg flex items-center justify-between border ${
                    themeMode === "light" ? "bg-slate-100 border-slate-200" : "bg-[#12122b]/80 border-white/5"
                  }`}>
                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                      Automatic Mark
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={isAutomaticMarker} 
                        onChange={() => {
                          SoundEffects.playClick(clicksEnabled);
                          setIsAutomaticMarker(!isAutomaticMarker);
                        }} 
                        className="sr-only peer" 
                      />
                      <div className="w-7 h-4 bg-zinc-600 rounded-full peer peer-checked:bg-green-accent after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-3"></div>
                    </label>
                  </div>

                  {/* 3. MIDDLE: Live Cartelas / SPECTATOR "Watching Only" mode container matching screenshots */}
                  <div className="flex-1 overflow-y-auto min-h-0 flex flex-col">
                    {game.cards.length === 0 ? (
                      /* SPECTATOR MODE VIEW CARD DETAILED */
                      <div className={`flex-1 border border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center ${
                        themeMode === "light" ? "bg-slate-100/50 border-slate-300" : "bg-[#11112d]/80 border-white/15"
                      }`}>
                        <div className="text-zinc-500 text-2xl mb-2 animate-bounce">📺</div>
                        
                        <h4 className="text-sm font-black tracking-widest uppercase text-orange-accent font-display">
                          {t.watchingOnly}
                        </h4>

                        {/* Core localized instructional details shown symmetrically */}
                        <p className="text-[11px] text-zinc-400 max-w-[190px] mt-2 leading-relaxed">
                          የዚህ ዙር ጨዋታ ተጀምሯል። አዲስ ዙር እስኪጀምር እዚህ ይጠብቁ።
                        </p>
                        
                        <p className="text-[10px] text-zinc-500 italic mt-3 leading-relaxed border-t border-white/5 pt-2.5 max-w-[160px]">
                          {t.gameStartedWait}
                        </p>
                      </div>
                    ) : (
                      /* ACTIVE BINGO CARTELAS GRID (Max 2 chosen) */
                      <div className="space-y-3">
                        {game.cards.slice(0, 2).map((card, ci) => (
                          <div 
                            key={ci} 
                            className={`border rounded-xl p-2 shadow-lg relative ${
                              themeMode === "light" ? "bg-slate-100 border-slate-200" : "bg-[#161633] border-white/10"
                            }`}
                          >
                            <div className="flex justify-between items-center mb-1 bg-white/[0.02] p-1 rounded">
                              <span className="text-[10px] font-black text-orange-accent uppercase tracking-wider">
                                Cartela #{game.cardNums[ci]}
                              </span>
                              <span className="text-[9px] font-mono font-bold text-zinc-500 italic">
                                Stake: {currentStake} Birr
                              </span>
                            </div>

                            {/* 5x5 Grid representation display */}
                            <div className="grid grid-cols-5 gap-1 text-center">
                              {/* headers */}
                              {COLS.map((col, idx) => (
                                <span key={idx} className="text-[9px] font-bold text-zinc-400 uppercase py-0.5">
                                  {col}
                                </span>
                              ))}

                              {/* cells layout */}
                              {card.map((cell, idx) => {
                                const isMarked = game.marked[ci]?.has(idx);
                                const isStar = cell.n === "★";
                                return (
                                  <button
                                    key={idx}
                                    onClick={() => handleGridCellManualTap(ci, idx)}
                                    className={`aspect-square rounded text-[10px] font-black flex flex-col items-center justify-center transition-all ${
                                      isStar
                                        ? "bg-gold text-black shadow-inner"
                                        : isMarked
                                        ? "bg-gradient-to-tr from-green-accent to-emerald-500 text-black scale-[1.02]"
                                        : themeMode === "light"
                                        ? "bg-slate-200 text-slate-800 hover:bg-slate-300"
                                        : "bg-[#1f1f45] text-zinc-300 hover:bg-[#252554] border border-white/5"
                                    }`}
                                  >
                                    {cell.n}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 4. ACTIONS ROW: Leave, Refresh, Automatic */}
                  <div className="grid grid-cols-[80px_1fr_90px] gap-1.5 shrink-0 mt-auto pb-1">
                    
                    {/* LEAVE BUTTON */}
                    <button
                      onClick={handleBackToStake}
                      className="bg-gradient-to-r from-red-600 to-orange-600 text-white font-black text-xs py-2 px-1 rounded-xl shadow active:scale-95 transition-all text-center uppercase"
                    >
                      {language === "am" ? "ውጣ" : "Leave"}
                    </button>

                    {/* REFRESH BUTTON (Preserving existing cartela selections) */}
                    <button
                      onClick={syncAllUserData}
                      className="bg-[#22223a] text-zinc-200 border border-white/10 hover:brightness-110 font-black text-xs py-2 px-1 rounded-xl shadow active:scale-95 transition-all flex items-center justify-center gap-1 text-center uppercase"
                    >
                      <RefreshCw className="w-3.5 h-3.5 animate-spin-slow text-orange-accent" />
                      <span>{language === "am" ? "አድስ" : "Refresh"}</span>
                    </button>

                    {/* AUTOMATIC STATUS BOX */}
                    <button
                      onClick={() => setIsAutomaticMarker(!isAutomaticMarker)}
                      className="bg-gradient-to-r from-yellow-700 to-orange-850 opacity-90 text-zinc-300 font-extrabold text-[10px] py-2 px-1 rounded-xl shadow text-center uppercase truncate"
                    >
                      {language === "am" ? "አውቶማቲክ" : "Automatic"}
                    </button>
                  </div>

                </div>
              </div>
            )}

            {/* SCREEN 4: WINNER DECLARATION PORTAL */}
            {activeScreen === "screen-winner" && (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-500 flex items-center justify-center text-2xl shadow-xl shadow-yellow-500/10 mb-4 animate-bounce">
                  <Trophy className="w-8 h-8 text-white" />
                </div>

                <h2 className="text-2xl font-black text-[#ffd700] mb-1 font-display tracking-widest animate-pulse">
                  {t.winnerFoundTitle}
                </h2>

                <p className="text-sm font-bold text-zinc-400 mb-6 flex items-center justify-center gap-1 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                  <Award className="w-4 h-4 text-orange-accent animate-pulse" />
                  <span>{winnersThisRound.length > 0 ? winnersThisRound[0].name : "Biniyami"} {t.playersWon}</span>
                </p>

                {/* Show Winning Cartela Preview */}
                <div className={`w-full max-w-[280px] border rounded-2xl p-4 mb-8 relative ${
                  themeMode === "light" ? "bg-slate-100 border-slate-300" : "bg-[#151535] border-white/10"
                }`}>
                  <span className="text-[10px] uppercase font-bold text-orange-accent flex items-center justify-center gap-1.5 mb-2 tracking-wider">
                    <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                    <span>{t.winningCartela} : {winnersThisRound.length > 0 ? winnersThisRound[0].cardNum : 37}</span>
                  </span>

                  {/* Symmetrical Mini Grid preview for celebration card */}
                  <div className="grid grid-cols-5 gap-1 text-center opacity-90 scale-95">
                    {(() => {
                      const displayCard = (winnersThisRound.length > 0 && winnersThisRound[0].card) 
                        ? winnersThisRound[0].card 
                        : buildRandomBingoCard();
                      
                      const markedSet = (winnersThisRound.length > 0 && winnersThisRound[0].marked)
                        ? winnersThisRound[0].marked
                        : new Set([0,4,12,20,24]);

                      return displayCard.map((cell, idx) => (
                        <div
                          key={idx}
                          className={`aspect-square rounded text-[8.5px] font-black flex items-center justify-center ${
                            cell.n === "★"
                              ? "bg-gold text-black font-extrabold"
                              : markedSet.has(idx)
                              ? "bg-orange-accent text-white font-bold"
                              : themeMode === "light"
                              ? "bg-slate-200 text-slate-800"
                              : "bg-[#25254a] text-zinc-500"
                          }`}
                        >
                          {cell.n}
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                {/* Countdown Loader */}
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-accent animate-ping"></span>
                  <span className="text-xs text-zinc-500 font-mono tracking-wider">
                    {t.autostartNext} {winnerCountdown}s
                  </span>
                </div>
              </div>
            )}

          </div>
        )}

        {/* TAB 2: PROFILE PAGE WITH SETTINGS SWITCHES */}
        {activeTab === "profile" && (
          <div className="p-4 flex-1 overflow-y-auto space-y-4">
            
            {/* User credentials Display Card (VIP BADGE REMOVED) */}
            <div className={`p-4 border rounded-2xl flex items-center gap-4 ${
              themeMode === "light" ? "bg-slate-100 border-slate-200" : "bg-[#12122d] border-white/10"
            }`}>
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-orange-accent/50 shrink-0">
                <img 
                  src={photoUrl} 
                  className="w-full h-full object-cover" 
                  alt="Profile Avatar"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="flex-1 min-w-0">
                <span className="text-base font-black truncate block">
                  {tgUsername ? `@${tgUsername}` : "አድዋ ተጫዋች"}
                </span>
                <span className="text-xs text-zinc-500 font-mono italic block">
                  ID: {tgUserId}
                </span>
              </div>
            </div>

            {/* Configurable settings menu requested */}
            <div className={`border rounded-xl p-4 space-y-4 ${
              themeMode === "light" ? "bg-slate-100 border-slate-200" : "bg-[#11112b] border-white/10"
            }`}>
              <h3 className="text-xs font-black uppercase text-orange-accent tracking-widest flex items-center gap-1.5 pb-2 border-b border-light/5">
                <Settings className="w-4 h-4" />
                <span>SETTINGS & PREFERENCES</span>
              </h3>

              {/* Toggle 1A: Bingo Announcement Voice / Sounds */}
              <div className="flex items-center justify-between py-1">
                <div className="flex flex-col">
                  <span className="text-xs font-bold">{language === "am" ? "የቢንጎ ድምፅ አድራጊ" : "Bingo Announcer Voice"}</span>
                  <span className="text-[10px] text-zinc-500">{language === "am" ? "የቁጥሮችን ድምጽ ያብሩ/ያጥፉ" : "Voice calls & announcer audio"}</span>
                </div>
                <button
                  onClick={() => {
                    const nextVal = !bingoSoundsEnabled;
                    setBingoSoundsEnabled(nextVal);
                    try { localStorage.setItem("bingo_sounds_enabled", String(nextVal)); } catch {}
                    SoundEffects.playClick(clicksEnabled);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                    bingoSoundsEnabled
                      ? "bg-green-accent/20 text-green-accent border border-green-accent/30"
                      : "bg-[#28283c] text-zinc-500"
                  }`}
                >
                  {bingoSoundsEnabled ? t.soundOn : t.soundOff}
                </button>
              </div>

              {/* Toggle 1B: Click & Interaction Sounds */}
              <div className="flex items-center justify-between py-1 border-t border-white/5 pt-3">
                <div className="flex flex-col">
                  <span className="text-xs font-bold">{language === "am" ? "የመጫኛ ድምፆች" : "Click & Interactive SFX"}</span>
                  <span className="text-[10px] text-zinc-500">{language === "am" ? "ሲጫኑ የመዳፊት ጠቅታ ድምጾች" : "Tactile mouse click sounds"}</span>
                </div>
                <button
                  onClick={() => {
                    const nextVal = !clicksEnabled;
                    setClicksEnabled(nextVal);
                    try { localStorage.setItem("clicks_enabled", String(nextVal)); } catch {}
                    SoundEffects.playClick(nextVal);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                    clicksEnabled
                      ? "bg-amber-500/20 text-amber-500 border border-amber-500/30"
                      : "bg-[#28283c] text-zinc-500"
                  }`}
                >
                  {clicksEnabled ? t.soundOn : t.soundOff}
                </button>
              </div>

              {/* Toggle 2: English / Amharic language selection switch */}
              <div className="flex items-center justify-between py-1 border-t border-white/5 pt-3">
                <div className="flex flex-col">
                  <span className="text-xs font-bold">{t.language}</span>
                  <span className="text-[10px] text-zinc-500 font-mono">EN / AM Language toggle</span>
                </div>
                <button
                  onClick={() => {
                    SoundEffects.playClick(clicksEnabled);
                    setLanguage(language === "en" ? "am" : "en");
                  }}
                  className="px-3 py-1 bg-gradient-to-r from-orange-accent to-yellow-500 text-black font-black text-xs rounded-lg active:scale-95 transition-all"
                >
                  {language === "en" ? "Amharic (🇪🇹)" : "English (🇺🇸)"}
                </button>
              </div>

              {/* Toggle 3: Dark Mode vs Light (Default Dark) Toggle switch */}
              <div className="flex items-center justify-between py-1 border-t border-white/5 pt-3">
                <div className="flex flex-col">
                  <span className="text-xs font-bold">{t.theme}</span>
                  <span className="text-[10px] text-zinc-500">Dark or Light defaults dark</span>
                </div>
                <button
                  onClick={() => {
                    SoundEffects.playClick(clicksEnabled);
                    setThemeMode(themeMode === "dark" ? "light" : "dark");
                  }}
                  className={`p-1 px-3 rounded-lg text-xs font-black transition-all flex items-center gap-1 ${
                    themeMode === "dark" 
                      ? "bg-[#181835] text-amber-400" 
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {themeMode === "dark" ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
                  <span>{themeMode.toUpperCase()}</span>
                </button>
              </div>
            </div>

            {/* Profile performance metrics */}
            <div className={`p-4 border rounded-xl space-y-2.5 ${
              themeMode === "light" ? "bg-slate-100 border-slate-200" : "bg-[#11112d] border-white/5"
            }`}>
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400">Total Games Played:</span>
                <span className="font-extrabold font-mono text-gold">{userStats.gamesPlayed}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400">Wins:</span>
                <span className="font-extrabold font-mono text-green-accent">{userStats.gamesWon}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400">Total Reward Amount:</span>
                <span className="font-extrabold font-mono text-[#ffd700]">{userStats.totalWonAmount} Birr</span>
              </div>
            </div>

            {/* Past game history matches list */}
            <div>
              <span className="text-xs font-bold text-orange-accent uppercase tracking-widest block mb-2 px-1">
                Recent Matches
              </span>
              <div className={`border rounded-xl overflow-hidden divide-y divide-white/5 ${
                themeMode === "light" ? "bg-slate-100 border-slate-200" : "bg-[#12122d] border-white/10"
              }`}>
                {matchHistory && matchHistory.length > 0 ? (
                  matchHistory.map((h, i) => (
                    <div key={i} className="p-3 flex items-center justify-between text-xs">
                      <div className="flex flex-col">
                        <span className="font-bold">Entry: {h.entry} Birr</span>
                        <span className="text-[9px] text-zinc-500">ID: {h.game_id}</span>
                      </div>
                      <span className={`font-black ${h.result.startsWith("+") ? "text-green-accent" : "text-zinc-400"}`}>
                        {h.result} Birr
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-center text-zinc-500 text-xs">No matches played yet.</div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: LEADERBOARD SCREEN standings renamed to represent STANDINGS */}
        {activeTab === "winners" && (
          <div className="p-4 flex-1 overflow-y-auto space-y-4">
            
            {/* Filter scope buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setLeaderboardPeriod("week")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-black ring-1 transition-all ${
                  leaderboardPeriod === "week"
                    ? "bg-gradient-to-r from-orange-accent to-yellow-500 text-black ring-gold font-bold"
                    : "bg-white/5 text-zinc-400 ring-white/10 hover:bg-white/10"
                }`}
              >
                {t.thisWeek}
              </button>
              <button
                onClick={() => setLeaderboardPeriod("month")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-black ring-1 transition-all ${
                  leaderboardPeriod === "month"
                    ? "bg-gradient-to-r from-orange-accent to-yellow-500 text-black ring-gold font-bold"
                    : "bg-white/5 text-zinc-400 ring-white/10 hover:bg-white/10"
                }`}
              >
                {t.thisMonth}
              </button>
            </div>

            {/* Filter stand categories tabs */}
            <div className="flex gap-1">
              <button
                onClick={() => setLeaderboardCategory("deposit")}
                className={`flex-1 py-1 px-1 rounded-lg text-[9.5px] font-black flex items-center justify-center gap-0.5 ring-1 transition-all ${
                  leaderboardCategory === "deposit"
                    ? "bg-blue-accent/15 text-blue-accent ring-blue-accent/30"
                    : "bg-white/5 text-zinc-500 ring-white/10 hover:bg-white/10"
                }`}
              >
                <PlusCircle className="w-3 h-3 text-blue-400" />
                <span>Most Deposit</span>
              </button>
              <button
                onClick={() => setLeaderboardCategory("invite")}
                className={`flex-1 py-1 px-1 rounded-lg text-[9.5px] font-black flex items-center justify-center gap-0.5 ring-1 transition-all ${
                  leaderboardCategory === "invite"
                    ? "bg-blue-accent/15 text-blue-accent ring-blue-accent/30"
                    : "bg-white/5 text-zinc-500 ring-white/10 hover:bg-white/10"
                }`}
              >
                <UserPlus className="w-3 h-3 text-purple-400" />
                <span>Invitation</span>
              </button>
              <button
                onClick={() => setLeaderboardCategory("games")}
                className={`flex-1 py-1 px-1 rounded-lg text-[9.5px] font-black flex items-center justify-center gap-0.5 ring-1 transition-all ${
                  leaderboardCategory === "games"
                    ? "bg-blue-accent/15 text-blue-accent ring-blue-accent/30"
                    : "bg-white/5 text-zinc-500 ring-white/10 hover:bg-white/10"
                }`}
              >
                <Award className="w-3 h-3 text-gold" />
                <span>Most Games</span>
              </button>
            </div>

            {/* Current user stand row */}
            <div className="bg-gradient-to-r from-orange-centric/15 to-yellow-900/10 border border-orange-accent/30 rounded-xl p-3 flex items-center justify-between shadow">
              <div>
                <span className="text-[9px] text-zinc-400 block tracking-wider uppercase">{t.currentRank}</span>
                <span className="text-xl font-black text-orange-accent">#{userRank.rank}</span>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-zinc-400 block tracking-wider uppercase">{t.totalMetric}</span>
                <span className="text-base font-black text-gold">{userRank.value} Birr</span>
              </div>
            </div>

            {/* Standing User grid */}
            <div className={`border rounded-xl overflow-hidden shadow-inner ${
              themeMode === "light" ? "bg-slate-100 border-slate-200" : "bg-[#11112d] border-white/10"
            }`}>
              <div className="grid grid-cols-[50px_1fr_90px] bg-white/[0.02] p-2.5 text-[8.5px] font-black text-zinc-400 tracking-wider">
                <span>RANK</span>
                <span>NAME</span>
                <span className="text-right">METRIC</span>
              </div>

              <div className="divide-y divide-white/5">
                {leaderboardUsers.slice(0, 15).map((user, idx) => {
                  const isTopThree = idx < 3;
                  const trophy = idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉";
                  return (
                    <div key={idx} className="grid grid-cols-[50px_1fr_90px] p-2.5 items-center text-xs font-semibold">
                      <span>
                        {isTopThree ? (
                          <span className="text-lg">{trophy}</span>
                        ) : (
                          <span className="text-zinc-500 pl-1">#{idx + 1}</span>
                        )}
                      </span>
                      <span className="truncate pr-1">{user.name}</span>
                      <span className="text-right text-green-accent font-black font-mono">
                        {user.value}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: WALLET PAGE */}
        {activeTab === "wallet" && (
          <div className="p-4 flex-1 overflow-y-auto space-y-4">
            
            {/* Wallet header */}
            <div className={`p-4 border rounded-2xl flex items-center gap-4 shadow ${
              themeMode === "light" ? "bg-slate-100 border-slate-200" : "bg-[#12122d] border-white/10"
            }`}>
              <div className="w-12 h-12 rounded-full overflow-hidden shrink-0">
                <img src={photoUrl} className="w-full h-full object-cover" alt="Profile" referrerPolicy="no-referrer" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-black truncate block">
                  {tgUsername ? `@${tgUsername}` : "አድዋ ተጫዋች"}
                </span>
                <span className="text-[10px] text-zinc-400 italic block">Available Wallets</span>
              </div>
            </div>

            {/* Glowing available balances */}
            <div className={`border rounded-2xl p-5 text-center relative overflow-hidden shadow-xl ${
              themeMode === "light" ? "bg-slate-100 border-slate-200" : "bg-[#151535] border-white/5"
            }`}>
              <div className="text-[9px] text-zinc-500 tracking-widest uppercase mb-1">
                AVAILABLE BALANCE
              </div>
              <div className="text-3xl font-black text-green-accent font-mono tracking-wide">
                {(mainBalance + playBalance).toFixed(2)} Birr
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/5 text-left">
                <div>
                  <span className="text-[8px] text-zinc-500 block">Withdrawable Balance</span>
                  <span className="text-sm font-black font-mono text-zinc-300">{mainBalance.toFixed(1)} Birr</span>
                </div>
                <div>
                  <span className="text-[8px] text-zinc-500 block">Play Bonus Balance</span>
                  <span className="text-sm font-black font-mono text-zinc-300">{playBalance.toFixed(1)} Birr</span>
                </div>
              </div>
            </div>

            {/* Payment history list */}
            <div>
              <div className="text-xs font-bold text-orange-accent uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4" />
                <span>Transaction Receipts</span>
              </div>

              <div className={`border rounded-xl overflow-hidden shadow ${
                themeMode === "light" ? "bg-slate-100 border-slate-200" : "bg-[#11112d] border-white/15"
              }`}>
                <div className="grid grid-cols-4 bg-white/[0.03] p-2 text-[8px] font-black text-zinc-400 tracking-wider">
                  <span>TYPE</span>
                  <span>AMOUNT</span>
                  <span>STATUS</span>
                  <span className="text-right">DATE</span>
                </div>

                <div className="divide-y divide-white/5">
                  {transactions
                    .filter(tx => tx.type === "deposit" || tx.type === "withdraw")
                    .map((tx, idx) => {
                      const isPositive = tx.type === "deposit";
                      return (
                        <div key={idx} className="grid grid-cols-4 p-2.5 items-center text-xs font-semibold">
                          <span className="capitalize truncate">{tx.type}</span>
                          <span className={isPositive ? "text-green-accent" : "text-red-400"}>
                            {isPositive ? "+" : "-"}
                            {tx.amount} Birr
                          </span>
                          <span className="text-green-accent capitalize">{tx.status}</span>
                          <span className="font-mono text-[9px] text-zinc-500 text-right">
                            {tx.time ? tx.time.split("T")[0] : "—"}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* -------------------------------------------------------------
          Bottom Navigation Navigation Bar (With tabs rebranded "Winners" -> "Leaderboard")
         ------------------------------------------------------------- */}
      <nav className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[420px] border-t grid z-40 pb-safe shadow-xl ${
        isAdminUnlocked ? "grid-cols-5" : "grid-cols-4"
      } ${
        themeMode === "light" ? "bg-white border-slate-200" : "bg-[#101026] border-white/10"
      }`}>
        <button
          onClick={() => handleTabClick("home")}
          className={`py-3 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
            activeTab === "home" ? "text-orange-accent font-bold" : "text-zinc-500 hover:text-white"
          }`}
        >
          <Home className="w-4 h-4" />
          <span className="text-[8px] tracking-wider uppercase">{t.home}</span>
        </button>

        <button
          onClick={() => handleTabClick("profile")}
          className={`py-3 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
            activeTab === "profile" ? "text-orange-accent font-bold" : "text-zinc-500 hover:text-white"
          }`}
        >
          <User className="w-4 h-4" />
          <span className="text-[8px] tracking-wider uppercase">{t.profile}</span>
        </button>

        {/* REBRANDED "Winners" to "Leaderboard" standing requested */}
        <button
          onClick={() => handleTabClick("winners")}
          className={`py-3 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
            activeTab === "winners" ? "text-orange-accent font-bold" : "text-zinc-500 hover:text-white"
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span className="text-[8px] tracking-wider uppercase">{t.leaderboard}</span>
        </button>

        <button
          onClick={() => handleTabClick("wallet")}
          className={`py-3 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
            activeTab === "wallet" ? "text-orange-accent font-bold" : "text-zinc-500 hover:text-white"
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span className="text-[8px] tracking-wider uppercase">{t.wallet}</span>
        </button>

        {isAdminUnlocked && (
          <button
            onClick={() => handleTabClick("admin")}
            className={`py-3 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
              activeTab === "admin" ? "text-red-500 font-bold" : "text-zinc-500 hover:text-white"
            }`}
          >
            <Shield className="w-4 h-4" />
            <span className="text-[8px] tracking-wider uppercase">{t.adminTitle || "Admin"}</span>
          </button>
        )}
      </nav>

      {/* -------------------------------------------------------------
          ADMIN CONSOLE DEDICATED TAB REPLACEMENT (Removed from main page overlay)
         ------------------------------------------------------------- */}
      {activeTab === "admin" && isAdminUnlocked && (
        <div className="absolute inset-x-0 top-14 bottom-14 bg-slate-950 p-4 text-white overflow-y-auto space-y-4 z-30 pb-20 select-none border-t border-white/5">
          {/* Admin Header Title */}
          <div className="flex items-center justify-between pb-1 border-b border-white/5">
            <h3 className="text-xs font-black tracking-widest text-[#ef4444] uppercase flex items-center gap-1.5 font-display">
              <Shield className="w-4 h-4 text-[#ef4444] animate-pulse" /> 
              <span>{t.adminTitle}</span>
            </h3>
            <button 
              onClick={() => {
                SoundEffects.playClick(clicksEnabled);
                setActiveTab("home");
              }} 
              className="text-zinc-400 bg-white/5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-white/15 cursor-pointer"
            >
              Exit Console
            </button>
          </div>

          {/* Scrolling horizontal tab layout menu bar */}
          <div className="flex gap-1 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-white/10">
            <button 
              onClick={() => setAdminTab("dashboard")} 
              className={`px-2.5 py-1.5 text-[9px] font-black uppercase rounded-lg shrink-0 transition-all flex items-center gap-1 ${
                adminTab === "dashboard" ? "bg-red-500 text-black shadow" : "bg-white/5 text-zinc-400 hover:bg-white/10"
              }`}
            >
              <Activity className="w-3 h-3" /> Status
            </button>
            <button 
              onClick={() => setAdminTab("users")} 
              className={`px-2.5 py-1.5 text-[9px] font-black uppercase rounded-lg shrink-0 transition-all flex items-center gap-1 ${
                adminTab === "users" ? "bg-red-500 text-black shadow" : "bg-white/5 text-zinc-400 hover:bg-white/10"
              }`}
            >
              <Users className="w-3 h-3" /> Search/Users
            </button>
            <button 
              onClick={() => setAdminTab("deposits")} 
              className={`px-2.5 py-1.5 text-[9px] font-black uppercase rounded-lg shrink-0 transition-all flex items-center gap-1 ${
                adminTab === "deposits" ? "bg-red-500 text-black shadow" : "bg-white/5 text-zinc-400 hover:bg-white/10"
              }`}
            >
              <ArrowDownCircle className="w-3 h-3" /> Deposits
            </button>
            <button 
              onClick={() => setAdminTab("withdrawals")} 
              className={`px-2.5 py-1.5 text-[9px] font-black uppercase rounded-lg shrink-0 transition-all flex items-center gap-1 ${
                adminTab === "withdrawals" ? "bg-red-500 text-black shadow" : "bg-white/5 text-zinc-400 hover:bg-white/10"
              }`}
            >
              <CreditCard className="w-3 h-3" /> Cashouts
            </button>
            <button 
              onClick={() => setAdminTab("gameplay")} 
              className={`px-2.5 py-1.5 text-[9px] font-black uppercase rounded-lg shrink-0 transition-all flex items-center gap-1 ${
                adminTab === "gameplay" ? "bg-red-500 text-black shadow" : "bg-white/5 text-zinc-400 hover:bg-white/10"
              }`}
            >
              <Settings className="w-3 h-3" /> Controls
            </button>
            <button 
              onClick={() => setAdminTab("logs")} 
              className={`px-2.5 py-1.5 text-[9px] font-black uppercase rounded-lg shrink-0 transition-all flex items-center gap-1 ${
                adminTab === "logs" ? "bg-red-500 text-black shadow" : "bg-white/5 text-zinc-400 hover:bg-white/10"
              }`}
            >
              <Clock className="w-3 h-3" /> Audit
            </button>
          </div>

          {/* TAB CONTENT RENDERING ROUTERS */}

          {/* Tab 1: Dashboard Status */}
          {adminTab === "dashboard" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/[0.02] p-2.5 border border-white/5 rounded-xl">
                  <span className="text-[8px] uppercase font-bold text-zinc-400 block mb-0.5">Live Game ID</span>
                  <span className="font-mono text-xs font-black text-yellow-400 tracking-widest block">{currentGameId || "AD12WA"}</span>
                </div>
                <div className="bg-white/[0.02] p-2.5 border border-white/5 rounded-xl">
                  <span className="text-[8px] uppercase font-bold text-zinc-400 block mb-0.5">Registered Pools</span>
                  <span className="font-mono text-xs font-black text-green-400 block">{game.cards.length ? game.cards.length : 2} / Max 2</span>
                </div>
                <div className="bg-white/[0.02] p-2.5 border border-white/5 rounded-xl">
                  <span className="text-[8px] uppercase font-bold text-zinc-400 block mb-0.5">Active Stakes</span>
                  <span className="font-mono text-xs font-black text-zinc-200 block">{currentStake} Birr Table</span>
                </div>
                <div className="bg-white/[0.02] p-2.5 border border-white/5 rounded-xl">
                  <span className="text-[8px] uppercase font-bold text-zinc-400 block mb-0.5">Simulated Nodes</span>
                  <span className="font-mono text-xs font-black text-blue-400 block">{totalPlayers} Active Users</span>
                </div>
              </div>

              {/* Server Engine Log indicator */}
              <div className="bg-black/40 p-3 rounded-xl border border-white/5 space-y-1.5">
                <span className="text-[9px] uppercase font-bold text-zinc-400 block">Simulated Server Engine Status</span>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-xs font-semibold text-zinc-200">ADWA SYSTEM ENGINE COMPLIANT</span>
                  </div>
                  <span className="font-mono text-[9px] text-zinc-500">PING: 8ms</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Users Search / Update (Matches requested parameters exactly) */}
          {adminTab === "users" && (
            <div className="space-y-3">
              <div className="bg-black/40 p-3 rounded-xl border border-white/5 space-y-2">
                <span className="text-[9px] uppercase font-bold text-zinc-400 block">Search Player profile by Telegram ID</span>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    placeholder="Enter Telegram User ID"
                    value={adminSearchId}
                    onChange={(e) => setAdminSearchId(e.target.value)}
                    className="bg-black/50 border border-white/10 rounded-lg p-2 px-3 flex-1 text-xs font-mono text-white outline-none focus:border-red-500"
                  />
                </div>

                {/* Quick Select Buttons */}
                <div className="flex flex-wrap gap-1 items-center pt-1">
                  <span className="text-[8px] text-zinc-500 uppercase font-bold mr-1">Trace shortcuts:</span>
                  {[
                    { id: "7348631392", label: "My Admin ID" },
                    { id: "10192837", label: "Henok T." },
                    { id: "48291038", label: "Ascal G." },
                    { id: "92837410", label: "Marcos W." }
                  ].map(profile => (
                    <button 
                      key={profile.id}
                      onClick={() => setAdminSearchId(profile.id)}
                      className="text-[9px] px-2 py-0.5 rounded bg-white/5 text-zinc-300 hover:bg-white/10"
                    >
                      {profile.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Searched User Info and logs */}
              {(() => {
                const foundUser = simulatedUsers[adminSearchId] || {
                  id: adminSearchId,
                  username: `Sim_User_${adminSearchId.slice(-4) || "None"}`,
                  balance: 100,
                  status: "Active" as const,
                  logs: ["Profile dynamically indexed - no historic failures."]
                };

                return (
                  <div className="bg-black/30 p-3 rounded-xl border border-white/5 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-zinc-400 block">Searched Account Context</span>
                        <span className="text-xs font-black text-white">@{foundUser.username}</span>
                        <span className="block font-mono text-[9px] text-zinc-500">Telegram ID: {foundUser.id}</span>
                      </div>
                      <span className={`text-[8.5px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        foundUser.status === "Active" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}>
                        {foundUser.status}
                      </span>
                    </div>

                    {/* Balance display box */}
                    <div className="bg-white/[0.02] p-2.5 rounded-lg border border-white/5 flex justify-between items-center">
                      <span className="text-[10px] text-zinc-400">Main Account Balance:</span>
                      <span className="text-xs font-black text-green-400 font-mono">
                        {foundUser.id === "7348631392" || foundUser.id === String(tgUserId) ? mainBalance : foundUser.balance} Birr
                      </span>
                    </div>

                    {/* Amount Input and Add/Reduce buttons */}
                    <div className="space-y-1.5">
                      <span className="text-[9px] uppercase font-bold text-zinc-400 block">Modify Simulated Balance (Real persistence)</span>
                      <div className="flex gap-2 items-center">
                        <input 
                          type="number"
                          placeholder="Sum"
                          value={adminAmountInput}
                          onChange={(e) => setAdminAmountInput(Math.max(1, Number(e.target.value)))}
                          className="bg-black/50 border border-white/10 rounded-lg p-1.5 w-20 text-xs font-mono text-center text-white"
                        />
                        <button 
                          onClick={() => handleAdminAddBalanceForId(foundUser.id, adminAmountInput)}
                          className="bg-green-700 hover:bg-green-600 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg flex-1"
                        >
                          + Add Balance
                        </button>
                        <button 
                          onClick={() => handleAdminReduceBalanceForId(foundUser.id, adminAmountInput)}
                          className="bg-red-700 hover:bg-red-600 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg flex-1"
                        >
                          - Reduce Balance
                        </button>
                      </div>
                    </div>

                    {/* Ban Toggle action button */}
                    <button 
                      onClick={() => handleAdminToggleUserBanStatus(foundUser.id)}
                      className={`w-full py-1.5 rounded-lg text-xs font-extrabold uppercase transition-colors ${
                        foundUser.status === "Active" ? "bg-red-950/40 text-red-400 border border-red-500/30 hover:bg-red-950/60" : "bg-green-950/40 text-green-400 border border-green-500/30 hover:bg-green-950/60"
                      }`}
                    >
                      {foundUser.status === "Active" ? "Ban user" : "Unban profile"}
                    </button>

                    {/* Activity logs section inside User card */}
                    <div className="space-y-1 pt-1 border-t border-white/5">
                      <span className="text-[9px] uppercase font-bold text-zinc-400 block">User Activity Trace Logs</span>
                      <div className="bg-black/60 p-2 rounded-lg max-h-[100px] overflow-y-auto divide-y divide-white/[0.03] space-y-1">
                        {foundUser.logs.map((logLine, idx) => (
                          <div key={idx} className="text-[10px] font-mono text-zinc-300 py-0.5">
                            • {logLine}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Tab 3: Deposits (Simulated verification with incoming CBE simulator) */}
          {adminTab === "deposits" && (
            <div className="space-y-3">
              <div className="bg-black/40 p-3 rounded-xl border border-white/5 space-y-2">
                <span className="text-[9px] uppercase font-bold text-zinc-400 block">Telemetry CBE Receipt Simulator</span>
                <span className="text-[8px] text-zinc-500 block mb-1">Simulate instant incoming customer deposit event</span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button 
                    onClick={() => handleAdminSimulateNewDeposit("Lulit Abera", 250)}
                    className="bg-zinc-900 border border-white/5 text-xs py-1.5 rounded-lg font-bold hover:bg-zinc-800"
                  >
                    Lulit (+250 CBE)
                  </button>
                  <button 
                    onClick={() => handleAdminSimulateNewDeposit("Tariku G.", 600)}
                    className="bg-zinc-900 border border-white/5 text-xs py-1.5 rounded-lg font-bold hover:bg-zinc-800"
                  >
                    Tariku (+600 CBE)
                  </button>
                </div>
              </div>

              {/* Deposit receipts listings */}
              <div className="bg-black/30 p-3 rounded-xl border border-white/5 space-y-2">
                <span className="text-[9px] uppercase font-bold text-zinc-400 block">Settled Deposit receipts history</span>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {adminDeposits.length === 0 ? (
                    <div className="text-center text-[10px] text-zinc-500 py-4">No deposits registered in current session.</div>
                  ) : (
                    adminDeposits.map(d => (
                      <div key={d.id} className="text-xs flex justify-between items-center bg-white/[0.02] p-2 rounded-lg border border-white/5">
                        <div>
                          <span className="font-bold text-zinc-100 block">{d.name}</span>
                          <span className="text-[8px] text-zinc-500">TXN check: #{d.id} • {d.time}</span>
                        </div>
                        <span className="text-green-accent font-black">+{d.amount} Birr</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Withdrawals queue & action list */}
          {adminTab === "withdrawals" && (
            <div className="space-y-3">
              <div className="bg-black/40 p-3 rounded-xl border border-white/5 space-y-2">
                <span className="text-[9px] uppercase font-bold text-zinc-400 block">Simulate incoming withdrawal cashout request</span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button 
                    onClick={() => handleAdminSimulateNewWithdrawal("Henok Tadese", 200)}
                    className="bg-zinc-900 border border-white/5 text-xs py-1.5 rounded-lg font-bold hover:bg-zinc-800"
                  >
                    Henok (200 CBE)
                  </button>
                  <button 
                    onClick={() => handleAdminSimulateNewWithdrawal("Selam K.", 350)}
                    className="bg-zinc-900 border border-white/5 text-xs py-1.5 rounded-lg font-bold hover:bg-zinc-800"
                  >
                    Selam (350 CBE)
                  </button>
                </div>
              </div>

              {/* Approve Withdraw list */}
              <div className="bg-black/30 p-3 rounded-xl border border-white/5 space-y-2">
                <span className="text-[9px] uppercase font-bold text-zinc-400 block">Actionable cashout clearance queue</span>
                <div className="space-y-2 divide-y divide-white/5">
                  {adminWithdrawals.length === 0 ? (
                    <div className="text-center text-[10px] text-zinc-500 py-4">Queue clearance empty.</div>
                  ) : (
                    adminWithdrawals.map(w => (
                      <div key={w.id} className="pt-2 flex justify-between items-center text-xs">
                        <div>
                          <span className="font-bold block text-zinc-100">{w.name}</span>
                          <span className="text-[8.5px] text-zinc-500">{w.amount} Birr • {w.time}</span>
                        </div>
                        <div className="flex gap-1.5">
                          {w.status === "Pending" ? (
                            <>
                              <button 
                                onClick={() => handleAdminApproveWithdraw(w.id, w.amount)} 
                                className="bg-green-700 hover:bg-green-600 text-white text-[9px] font-bold px-2.5 py-1 rounded-lg"
                              >
                                Approve
                              </button>
                              <button 
                                onClick={() => handleAdminRejectWithdraw(w.id)} 
                                className="bg-red-700 hover:bg-red-600 text-white text-[9px] font-bold px-2.5 py-1 rounded-lg"
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded ${
                              w.status === "Approved" ? "text-green-400 bg-green-500/15" : "text-red-400 bg-red-400/15"
                            }`}>
                              {w.status}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Gameplay match controls, overrides, and cancellations */}
          {adminTab === "gameplay" && (
            <div className="space-y-3">
              <div className="bg-black/40 p-3 rounded-xl border border-white/5 space-y-2">
                <span className="text-[9px] uppercase font-bold text-zinc-400 block">Matches Action console</span>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => handleAdminStopPauseResume("pause")} 
                    className="bg-yellow-600 hover:brightness-110 text-black text-xs py-1.5 font-bold rounded-lg flex items-center justify-center gap-1"
                  >
                    <Pause className="w-3 h-3" /> Pause Match
                  </button>
                  <button 
                    onClick={() => handleAdminStopPauseResume("resume")} 
                    className="bg-green-600 hover:brightness-110 text-white text-xs py-1.5 font-bold rounded-lg flex items-center justify-center gap-1"
                  >
                    <Play className="w-3 h-3" /> Resume Match
                  </button>
                  <button 
                    onClick={() => handleAdminStopPauseResume("stop")} 
                    className="bg-red-600 hover:brightness-110 text-white text-xs py-1.5 font-bold rounded-lg col-span-2 flex items-center justify-center gap-1"
                  >
                    <Square className="w-3 h-3" /> Stop & Refund Stakes
                  </button>
                </div>
              </div>

              {/* Custom Drawing override panels */}
              <div className="bg-black/40 p-3 rounded-xl border border-white/5 space-y-3">
                <div>
                  <span className="text-[9px] uppercase font-bold text-zinc-400 block">Inject Target Ball numbers</span>
                  <span className="text-[8px] text-zinc-500 block mb-1.5">Directly override drawing mechanics and call precise ball (1-75)</span>
                  <div className="flex gap-1.5">
                    <input 
                      type="number"
                      min="1"
                      max="75"
                      placeholder="No."
                      id="admin_custom_draw_input"
                      className="bg-black/50 border border-white/10 rounded-lg p-1.5 text-center text-xs font-mono font-black text-white w-16"
                    />
                    <button 
                      onClick={() => {
                        const el = document.getElementById("admin_custom_draw_input") as HTMLInputElement;
                        if (el) handleAdminForceCallBall(Number(el.value));
                      }}
                      className="flex-1 bg-[#d32f2f] hover:bg-[#f44336] text-white text-xs font-bold py-1.5 rounded-lg transition-colors"
                    >
                      Call Target Ball
                    </button>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-2">
                  <span className="text-[9px] uppercase font-bold text-zinc-400 block">Force Declare claim winner</span>
                  <span className="text-[8px] text-zinc-500 block mb-1.5">Declare a specific simulated player to win instantly</span>
                  <div className="flex gap-1.5">
                    <input 
                      type="text"
                      placeholder="Username (e.g. Yonas_Kassa)"
                      id="admin_force_winner_claim_input"
                      className="bg-black/50 border border-white/10 rounded-lg p-1.5 text-xs text-white px-2.5 flex-1"
                    />
                    <button 
                      onClick={() => {
                        const el = document.getElementById("admin_force_winner_claim_input") as HTMLInputElement;
                        if (el && el.value.trim()) handleAdminForceInstantWinner(el.value.trim());
                      }}
                      className="bg-green-700 hover:bg-green-600 text-white text-xs font-bold py-1.5 rounded-lg px-3.5 transition-colors"
                    >
                      Declare Winner
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 6: Audit trail Activity logs */}
          {adminTab === "logs" && (
            <div className="space-y-3">
              <div className="bg-black/40 p-3 rounded-xl border border-white/5 space-y-2">
                <div className="flex justify-between items-center text-[9px] uppercase font-bold text-zinc-400">
                  <span>Audit Session Activity logs</span>
                  <button 
                    onClick={() => setAuditLogs(["Logs flushed at " + new Date().toLocaleTimeString()])}
                    className="text-red-400 font-bold hover:underline bg-none border-none text-[8px]"
                  >
                    Flush session
                  </button>
                </div>
                <div className="bg-black/70 p-3 rounded-lg border border-white/5 max-h-[220px] overflow-y-auto divide-y divide-white/[0.03] space-y-1 text-[10px] font-mono text-zinc-300">
                  {auditLogs.map((logMsg, idx) => (
                    <div key={idx} className="py-1 leading-relaxed">
                      {logMsg}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ADMIN PASSWORD CONSOLE PROMPT GATEWAY */}
      {showAdminPasswordModal && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-[#181835] border border-orange-accent/30 rounded-2xl p-5 w-full max-w-[290px] space-y-4">
            <div className="w-10 h-10 rounded-full bg-orange-accent/20 text-orange-accent flex items-center justify-center mx-auto mb-2">
              <Lock className="w-5 h-5 animate-pulse" />
            </div>

            <h3 className="text-sm font-black uppercase text-white">
              {t.passwordPrompt}
            </h3>

            <input 
              type="password"
              placeholder="••••••••"
              value={adminPasswordInput}
              onChange={(e) => setAdminPasswordInput(e.target.value)}
              className="w-full bg-black/50 border border-white/20 p-2 text-center rounded-xl text-white font-mono text-base focus:border-orange-accent outline-none"
            />

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button 
                onClick={() => setShowAdminPasswordModal(false)}
                className="bg-white/5 hover:bg-white/10 text-zinc-400 py-2 text-xs rounded-xl font-bold"
              >
                Cancel
              </button>
              <button 
                onClick={handleVerifyAdminPassword}
                className="bg-orange-accent hover:brightness-110 text-black py-2 text-xs rounded-xl font-black uppercase"
              >
                Unlock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom game paused overlay */}
      {gamePaused && (
        <div className="fixed inset-0 bg-black/85 z-[99] flex flex-col items-center justify-center text-center p-4">
          <div className="w-12 h-12 rounded-full bg-yellow-500/20 text-yellow-550 flex items-center justify-center mb-3 border border-yellow-500/40">
            <Zap className="w-6 h-6 animate-pulse" />
          </div>
          <h3 className="text-base font-black text-yellow-400 mb-1">GAMEPLAY PAUSED BY ADMIN</h3>
          <p className="text-xs text-zinc-300">ጨዋታው በጊዜያዊነት ቆሟል። እባክዎ ይጠብቁ…</p>
        </div>
      )}

      {/* Custom cancelled games overlay */}
      {gameCancelled && (
        <div className="fixed inset-0 bg-[#0d0d2b]/95 z-[99] flex flex-col items-center justify-center text-center p-6">
          <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mb-3 border border-red-500/30 animate-pulse">
            <RotateCcw className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-black text-red-500 mb-1">Gameplay Aborted</h3>
          <p className="text-xs text-zinc-400 max-w-[240px] mb-6">
            ጨዋታው ተሰርዟል። ሂሳብዎ ተመላሽ ተደርጓል። (Game cancelled by admin & stake refunded)
          </p>
          <button
            onClick={dismissCancelOverlay}
            className="px-6 py-2.5 bg-orange-accent text-black font-black uppercase text-[10px] rounded-xl hover:brightness-110 active:scale-95 cursor-pointer shadow-lg"
          >
            OK — Back to Home
          </button>
        </div>
      )}

      {/* Dynamic Custom Non-blocking Notification Toast (Safe on all Telegram versions, iOS/Android/Web) */}
      <AnimatePresence>
        {activeToast && (() => {
          let cleaned = activeToast;
          let isWin = false;
          let iconType: "success" | "error" | "info" | "win" | "pause" | "resume" | "stop" | "money" = "info";

          if (cleaned.startsWith("BINGO_WIN:")) {
            cleaned = cleaned.replace("BINGO_WIN:", "");
            isWin = true;
            iconType = "win";
          } else if (cleaned.includes("✔️") || cleaned.includes("Unlocked") || cleaned.includes("approved")) {
            cleaned = cleaned.replace("✔️", "").trim();
            iconType = "success";
          } else if (cleaned.includes("❌") || cleaned.includes("rejected") || cleaned.includes("Error") || cleaned.includes("failed")) {
            cleaned = cleaned.replace("❌", "").trim();
            iconType = "error";
          } else if (cleaned.includes("🚫") || cleaned.includes("banned")) {
            cleaned = cleaned.replace("🚫", "").trim();
            iconType = "error";
          } else if (cleaned.includes("💰") || cleaned.includes("Credited")) {
            cleaned = cleaned.replace("💰", "").trim();
            iconType = "money";
          } else if (cleaned.includes("🔓")) {
            cleaned = cleaned.replace("🔓", "").trim();
            iconType = "success";
          } else if (cleaned.includes("⏸️") || cleaned.includes("Paused")) {
            cleaned = cleaned.replace("⏸️", "").trim();
            iconType = "pause";
          } else if (cleaned.includes("▶️") || cleaned.includes("Resumed")) {
            cleaned = cleaned.replace("▶️", "").trim();
            iconType = "resume";
          } else if (cleaned.includes("🛑") || cleaned.includes("Cancelled")) {
            cleaned = cleaned.replace("🛑", "").trim();
            iconType = "stop";
          }

          return (
            <motion.div
              initial={{ opacity: 0, y: -50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="fixed top-6 left-1/2 -translate-x-1/2 z-[250] w-[90%] max-w-[365px] pointer-events-none"
            >
              {isWin ? (
                // Exquisite golden animated celebration card for bingo victory!
                <div className="bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-700 text-black text-xs font-black border-2 border-yellow-300 rounded-2xl py-3.5 px-4 shadow-[0_16px_48px_rgba(251,191,36,0.35)] flex items-center gap-3 backdrop-blur-md relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center animate-bounce shrink-0 shadow-inner">
                    <Trophy className="w-5 h-5 text-black" />
                  </div>
                  <div className="flex-1 leading-snug">
                    <p className="text-[10px] uppercase tracking-wider text-black/70 font-black">Victory Claimed / አሸናፊ</p>
                    <p className="font-extrabold tracking-wide text-[12px]">{cleaned}</p>
                  </div>
                  <Sparkles className="w-5 h-5 text-yellow-101 animate-pulse shrink-0" />
                </div>
              ) : (
                // Elegant standard custom action toasts with standard lucide icons
                <div className={`text-white text-[11px] font-bold border rounded-2xl py-3 px-4 shadow-[0_12px_36px_rgba(0,0,0,0.5)] flex items-center gap-2.5 backdrop-blur-md ${
                  iconType === "success" 
                    ? "bg-emerald-950/95 border-emerald-500/30 text-emerald-100" 
                    : iconType === "error" 
                    ? "bg-red-950/95 border-red-500/30 text-red-100"
                    : iconType === "money"
                    ? "bg-yellow-950/95 border-yellow-500/30 text-yellow-100"
                    : iconType === "pause"
                    ? "bg-amber-950/95 border-amber-500/30 text-amber-100"
                    : iconType === "resume"
                    ? "bg-emerald-950/95 border-emerald-500/30 text-emerald-100"
                    : iconType === "stop"
                    ? "bg-rose-950/95 border-rose-500/30 text-rose-100"
                    : "bg-slate-900/95 border-orange-accent/30 text-zinc-100"
                }`}>
                  <div className="shrink-0 flex items-center justify-center">
                    {iconType === "success" && <Check className="w-4 h-4 text-emerald-400" />}
                    {iconType === "error" && <AlertTriangle className="w-4 h-4 text-red-400" />}
                    {iconType === "money" && <Coins className="w-4 h-4 text-yellow-400" />}
                    {iconType === "pause" && <Pause className="w-4 h-4 text-amber-400" />}
                    {iconType === "resume" && <Play className="w-4 h-4 text-emerald-400" />}
                    {iconType === "stop" && <Square className="w-4 h-4 text-rose-400" />}
                    {iconType === "info" && <span className="w-2 h-2 rounded-full bg-orange-accent animate-ping block" />}
                  </div>
                  <p className="flex-1 leading-snug tracking-wide">{cleaned}</p>
                </div>
              )}
            </motion.div>
          );
        })()}
      </AnimatePresence>

    </div>
  );
}
