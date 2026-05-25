export interface Site {
  id: string;
  operator_id: string;
  name: string;
  description: string;
  location: { type: "Point"; coordinates: [number, number] };
  address: string;
  province: string;
  minerals: string[];
  price_per_person: number;
  max_group_size: number;
  duration_hours: number;
  site_type: "pay-to-dig" | "guided-tour" | "collecting-walk";
  images: string[];
  rules: string;
  is_active: boolean;
  opt_in_mystery: boolean;
  seasonal_windows: SeasonalWindow[];
  conservation_contribution: number;
  conservation_note: string;
  is_open_today: boolean;
  rating: number;
  review_count: number;
}

export interface GroupMember {
  name: string;
  email: string;
  amount_owed: number;
  paid: boolean;
}

export interface Booking {
  id: string;
  site_id: string;
  site_name?: string;
  date: string;
  party_size: number;
  total_amount: number;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  created_at: string;
  is_group_booking?: boolean;
  is_mystery?: boolean;
  mystery_province?: string;
  group_members?: GroupMember[];
  notes?: string;
}

export interface User {
  id: string;
  email?: string;
  name: string;
  role: "visitor" | "operator" | "guide" | "admin";
  stripe_account_id?: string | null;
  stripe_account_enabled?: boolean;
}

export interface Guide {
  id: string;
  name: string;
  bio: string;
  avatar_url: string | null;
  specialties: string[];
  years_experience: number;
  certifications: string[];
  rate_per_day: number | null;
  guide_location: string | null;
}

export interface YieldReport {
  id: string;
  site_id: string;
  session_date: string;
  minerals_found: string[];
  quantity_notes: string;
  notes: string;
  created_at: string;
}

export interface WeatherAlert {
  id: string;
  site_id: string;
  message: string;
  affected_dates: string[];
  is_active: boolean;
  created_at: string;
}

export interface HuntItem {
  id: string;
  label: string;
  hint: string;
  points: number;
}

export interface ScavengerHunt {
  id: string;
  site_id: string;
  operator_id: string;
  title: string;
  description: string;
  is_active: boolean;
  items: HuntItem[];
  created_at: string;
}

export interface HuntProgress {
  id: string;
  hunt_id: string;
  booking_id: string;
  found_item_ids: string[];
  completed_at: string | null;
  stamp_awarded: boolean;
}

export interface PassportStamp {
  id: string;
  site_id: string;
  site_name: string;
  minerals_found: string[];
  visited_at: string;
  booking_id: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  threshold: number;
}

export interface LeaderboardEntry {
  name: string;
  points: number;
  visits: number;
}

export interface DiaryEntry {
  id: string;
  visitor_name: string;
  booking_id: string;
  site_id: string;
  site_name: string;
  visit_date: string;
  title: string;
  body: string;
  minerals_found: string[];
  photo_urls: string[];
  is_public: boolean;
  points_awarded: number;
  created_at: string;
}

export interface SiteQuestion {
  id: string;
  site_id: string;
  visitor_name: string;
  question: string;
  answer: string;
  answered_at: string | null;
  created_at: string;
}

export interface FieldGuide {
  id: string;
  slug: string;
  title: string;
  mineral_tags: string[];
  difficulty: string;
  body: string;
  cover_image: string;
  is_published: boolean;
  created_at: string;
}

export interface WaitlistEntry {
  id: string;
  site_id: string;
  site_name: string;
  date: string;
  notified_at: string | null;
  created_at: string;
}

export interface SeasonalWindow {
  mineral: string;
  start_month: number;
  end_month: number;
  notes: string;
}

export interface AlertSubscription {
  id: string;
  email: string;
  minerals: string[];
  provinces: string[];
  is_active: boolean;
  created_at: string;
}

export interface Specimen {
  id: string;
  operator_id: string;
  site_id: string | null;
  title: string;
  description: string;
  minerals: string[];
  province: string;
  price: number;
  images: string[];
  quantity: number;
  available: number;
  is_active: boolean;
  created_at: string;
}

export interface MineralIdAlternative {
  mineral: string;
  reason: string;
  field_test: string;
}

export interface MineralIdResult {
  identified_mineral: string;
  confidence: "high" | "medium" | "low";
  confidence_reason: string;
  visual_clues: string[];
  formation_notes: string;
  ontario_context: {
    province: string;
    typical_formations: string[];
    typical_localities: string[];
  };
  physical_properties: {
    hardness: string;
    cleavage: string;
    fracture: string;
    lustre: string;
    streak: string;
    specific_gravity: string;
  };
  specimen_quality: string;
  uv_fluorescence: string;
  care_tips: string;
  rarity_notes: string;
  alternatives: MineralIdAlternative[];
}

export type VerificationStatus =
  | "unverified"
  | "ai_likely"
  | "community_verified"
  | "ogs_reviewed"
  | "disputed";

export interface Find {
  id: string;
  user_id: string;
  author_name: string;
  date: string;
  mineral_name: string;
  notes: string;
  photo_urls: string[];
  gps_lat: number | null;
  gps_lng: number | null;
  site_id: string | null;
  site_name: string | null;
  host_rock: string | null;
  geological_province: string | null;
  formation: string | null;
  specimen_quality: string | null;
  verification_status: VerificationStatus;
  citizen_science_opted_in: boolean;
  citizen_science_eligible: boolean;
  visibility: "private" | "public";
  save_count: number;
  is_featured: boolean;
  is_junior_submission: boolean;
  uv_fluorescence: string | null;
  is_haul: boolean;
  saved: boolean;
  created_at: string;
}

export interface FindFeedResponse {
  total: number;
  skip: number;
  limit: number;
  items: Find[];
}

export interface GuideReview {
  id: string;
  guide_id: string;
  visitor_id: string;
  guide_booking_id: string;
  rating: number;
  body: string;
  visitor_name: string;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  subcategory: string;
  description: string;
  price: number; // cents
  images: string[];
  stock: number;
  dropship: boolean;
  tags: string[];
  related_products: string[];
  site_recommendations: string[];
  related?: Product[];
}

export interface ShopOrderItem {
  product_id: string;
  product_name: string;
  qty: number;
  price: number; // cents
}

export interface ShopOrder {
  id: string;
  items: ShopOrderItem[];
  total: number; // cents
  status: "pending" | "confirmed" | "fulfilled" | "shipped" | "cancelled";
  shipping_address: Record<string, string>;
  tracking_number: string;
  created_at: string;
}

export interface DropPiece {
  id: string;
  mineral_name: string;
  formation: string | null;
  photo_url: string | null;
  price_cad: number;
  description: string | null;
  status: "available" | "reserved" | "sold";
  buyer_city: string | null;
}

export interface SpecimenDrop {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  opens_at: string;
  closes_at: string;
  status: "upcoming" | "active" | "closed";
  pieces: DropPiece[];
  total_pieces: number;
  available_count: number;
}

export interface Expert {
  id: string;
  name: string;
  bio: string;
  avatar_url: string | null;
  expert_tier: "verified_expert" | "community_reviewer" | "ogs_endorsed" | null;
  credential_type: string | null;
  expert_specialisations: string[];
  institutional_affiliation: string | null;
  publications_url: string | null;
  years_experience: number;
  guide_location: string | null;
  expert_review_count: number;
  expert_agreement_rate: number;
}

export interface Creator {
  id: string;
  name: string;
  bio: string;
  avatar_url: string | null;
  creator_tier: "explorer" | "field_geologist" | "resident_geologist" | null;
  specialties: string[];
  guide_location: string | null;
  social_instagram: string | null;
  social_tiktok: string | null;
  social_youtube: string | null;
  content_url: string | null;
}

export interface GuideBooking {
  id: string;
  guide_id: string;
  visitor_id: string;
  date: string;
  party_size: number;
  location_description: string;
  total_amount: number;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  notes: string;
  created_at: string;
}
