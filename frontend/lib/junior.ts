import { api } from "./api";

export interface JuniorProfile {
  id: string;
  parent_id: string;
  first_name: string;
  age_range: "6-8" | "8-10" | "10-12";
  avatar: string;
  created_at: string;
  last_daily_claim: string | null;
  login_streak: number;
  last_login: string | null;
}

export interface JuniorMineral {
  mineral_id: string;
  name: string;
  family: string;
  rarity: "common" | "uncommon" | "rare" | "legendary";
  mohs_hardness: number;
  key_property: string;
  ontario_locality: string;
  flavour_text: string;
  fun_fact: string;
  age_easy_description: string;
  age_standard_description: string;
  detective_clues: string[];
  dig_site_associations: string[];
  province_associations: string[];
  card_emoji: string;
  card_colour: string;
}

export interface CollectionEntry {
  mineral: JuniorMineral;
  owned: boolean;
  unlocked_at: string | null;
  source: string | null;
}

export interface BadgeInfo {
  badge_id: string;
  name: string;
  category: "field" | "knowledge" | "engagement";
  description: string;
  icon: string;
  requirement: string;
  card_reward: string | null;
  earned: boolean;
  earned_at: string | null;
}

export interface DetectiveCaseInfo {
  case_id: string;
  title: string;
  region: string;
  difficulty: "easy" | "medium" | "hard";
  scene: string;
  clues: string[];
  options: string[];
  card_reward_rare: string;
  card_reward_uncommon: string;
  card_reward_common: string;
  unlocked: boolean;
  solved: boolean;
  attempts: number;
}

export interface DailyCardResult {
  mineral: JuniorMineral;
  is_new: boolean;
  streak: number;
  new_badges: string[];
}

export interface DetectiveSubmitResult {
  correct: boolean;
  explanation: string | null;
  correct_mineral: string | null;
  card_reward: string | null;
  attempts: number;
  new_badges: string[];
}

export interface ParentSummaryEntry {
  id: string;
  first_name: string;
  avatar: string;
  age_range: string;
  login_streak: number;
  cards_collected: number;
  badges_earned: number;
  cases_solved: number;
}

export const RARITY_COLORS: Record<string, string> = {
  common: "#94a3b8",
  uncommon: "#22c55e",
  rare: "#3b82f6",
  legendary: "#f59e0b",
};

export const RARITY_LABELS: Record<string, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  legendary: "Legendary ✨",
};

export const DIFF_COLORS: Record<string, string> = {
  easy: "bg-green-100 text-green-700",
  medium: "bg-amber-100 text-amber-700",
  hard: "bg-red-100 text-red-700",
};

export const juniorApi = {
  createProfile: (data: { first_name: string; age_range: string; avatar: string }) =>
    api.post<JuniorProfile>("/api/junior/profiles", data, { auth: true }),

  listProfiles: () =>
    api.get<JuniorProfile[]>("/api/junior/profiles", { auth: true }),

  updateProfile: (id: string, data: Partial<{ first_name: string; age_range: string; avatar: string }>) =>
    api.patch<JuniorProfile>(`/api/junior/profiles/${id}`, data, { auth: true }),

  deleteProfile: (id: string) =>
    api.del(`/api/junior/profiles/${id}`, { auth: true }),

  listMinerals: () =>
    api.get<JuniorMineral[]>("/api/junior/minerals"),

  getCollection: (juniorId: string) =>
    api.get<CollectionEntry[]>(`/api/junior/${juniorId}/collection`, { auth: true }),

  claimDailyCard: (juniorId: string) =>
    api.post<DailyCardResult>(`/api/junior/${juniorId}/daily-card`, {}, { auth: true }),

  getBadges: (juniorId: string) =>
    api.get<BadgeInfo[]>(`/api/junior/${juniorId}/badges`, { auth: true }),

  getDetectiveCases: (juniorId: string) =>
    api.get<DetectiveCaseInfo[]>(`/api/junior/${juniorId}/detective/cases`, { auth: true }),

  submitDetective: (juniorId: string, caseId: string, answerId: string) =>
    api.post<DetectiveSubmitResult>(
      `/api/junior/${juniorId}/detective/${caseId}/submit`,
      { answer_id: answerId },
      { auth: true }
    ),

  getParentSummary: () =>
    api.get<ParentSummaryEntry[]>("/api/junior/parent-summary", { auth: true }),
};

export function hasClaimedToday(profile: JuniorProfile): boolean {
  if (!profile.last_daily_claim) return false;
  const claimed = new Date(profile.last_daily_claim);
  const now = new Date();
  return (
    claimed.getFullYear() === now.getFullYear() &&
    claimed.getMonth() === now.getMonth() &&
    claimed.getDate() === now.getDate()
  );
}
