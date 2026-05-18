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

export interface Booking {
  id: string;
  site_id: string;
  date: string;
  party_size: number;
  total_amount: number;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  created_at: string;
}

export interface User {
  id: string;
  name: string;
  role: "visitor" | "operator" | "admin";
}
