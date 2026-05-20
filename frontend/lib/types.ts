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
  date: string;
  party_size: number;
  total_amount: number;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  created_at: string;
  is_group_booking?: boolean;
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
