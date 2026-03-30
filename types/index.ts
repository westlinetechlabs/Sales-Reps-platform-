export interface SalesRep {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  region?: string | null;
  role: "rep" | "admin";
  status: "active" | "inactive";
  created_at: string;
}

export interface Booking {
  id: string;
  rep_id: string;
  client_name: string;
  client_phone: string;
  client_email?: string | null;
  client_location?: string | null;
  service_type: string;
  service_details: Record<string, unknown>;
  project_value: number;
  commission_earned: number;
  notes?: string | null;
  status: "new" | "in_progress" | "completed" | "cancelled";
  created_at: string;
  updated_at: string;
  // joined
  sales_reps?: SalesRep;
}

export interface SalesTarget {
  id: string;
  rep_id: string;
  period: string;
  target_amount: number;
  achieved_amount: number;
}

export type BookingStatus = Booking["status"];
export type ServiceType =
  | "Logo & Branding"
  | "Signage"
  | "Web Development"
  | "Mobile App"
  | "Video Advertising"
  | "AI Music"
  | "Celebration Package"
  | "Other";

export const SERVICE_TYPES: ServiceType[] = [
  "Logo & Branding",
  "Signage",
  "Web Development",
  "Mobile App",
  "Video Advertising",
  "AI Music",
  "Celebration Package",
  "Other",
];

export interface WithdrawalRequest {
  id: string;
  rep_id: string;
  amount: number;
  status: "pending" | "approved" | "rejected" | "completed";
  rep_note?: string | null;
  admin_note?: string | null;
  requested_at: string;
  completed_at?: string | null;
  // joined
  sales_reps?: SalesRep;
}

export type WithdrawalStatus = WithdrawalRequest["status"];

export const STATUS_CONFIG: Record<
  BookingStatus,
  { label: string; color: string; bg: string; dot: string }
> = {
  new: {
    label: "New",
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
    dot: "bg-blue-400",
  },
  in_progress: {
    label: "In Progress",
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
    dot: "bg-amber-400",
  },
  completed: {
    label: "Completed",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    dot: "bg-emerald-400",
  },
  cancelled: {
    label: "Cancelled",
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/20",
    dot: "bg-red-400",
  },
};
