export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string | null;
  region?: string | null;
  avatar?: string | null;
  createdAt: Date;
}

export interface Customer {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  address?: string | null;
  city?: string | null;
  status: string;
  value: number;
  repId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Deal {
  id: string;
  title: string;
  value: number;
  stage: string;
  probability: number;
  closeDate?: Date | null;
  notes?: string | null;
  repId: string;
  customerId?: string | null;
  customer?: Customer | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Activity {
  id: string;
  type: string;
  title: string;
  description?: string | null;
  date: Date;
  duration?: number | null;
  outcome?: string | null;
  repId: string;
  customerId?: string | null;
  customer?: Customer | null;
  createdAt: Date;
}

export interface Note {
  id: string;
  content: string;
  repId: string;
  customerId?: string | null;
  customer?: Customer | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Target {
  id: string;
  month: number;
  year: number;
  revenue: number;
  deals: number;
  calls: number;
  meetings: number;
  repId: string;
}

export interface DashboardStats {
  totalCustomers: number;
  totalDeals: number;
  totalRevenue: number;
  wonDeals: number;
  activeDeals: number;
  recentActivities: number;
  conversionRate: number;
}
