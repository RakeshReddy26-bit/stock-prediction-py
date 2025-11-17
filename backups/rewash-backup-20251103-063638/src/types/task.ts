export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'blocked' | 'review';
export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';
export type TaskType = 'feature' | 'bug' | 'documentation' | 'maintenance';
export type TaskLabel = 'frontend' | 'backend' | 'devops' | 'design' | 'testing' | 'security' | 'performance';
export type UrgencyLevel = 'same-day' | 'next-day' | 'three-days' | 'one-week';
export type ServiceType = 'regular' | 'dry-cleaning' | 'ironing' | 'stain-removal' | 'express';
export type PaymentMethod = 'cash' | 'card' | 'online';

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
}

export interface Comment {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Subtask {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  assignedTo: string;
  dueDate: string;
}

export interface TaskDependency {
  id: string;
  type: 'blocks' | 'blocked_by' | 'relates_to';
  taskId: string;
}

export interface TimeEntry {
  id: string;
  userId: string;
  duration: number;
  description: string;
  date: string;
  createdAt: string;
}

export interface TaskHistoryEntry {
  type: string;
  description: string;
  timestamp: string;
  userId: string;
}

export interface RecurringTask {
  frequency: 'daily' | 'weekly' | 'monthly';
  endDate?: string;
}

export interface ServicePricing {
  type: ServiceType;
  price: number;
  description: string;
}

export interface LoyaltyProgram {
  monthsEnrolled: number;
  discountPercentage: number;
  freePickup: boolean;
}

export interface PromoCode {
  code: string;
  discountPercentage: number;
  description?: string;
}

export interface Referral {
  referredBy?: string;
  discountPercentage?: number;
}

export interface CorporateDiscount {
  companyName: string;
  discountPercentage: number;
}

export interface TieredPrice {
  minKg: number;
  maxKg: number;
  pricePerKg: number;
}

export type LoyaltyTier = 'silver' | 'gold' | 'platinum';

export interface LoyaltyPointsHistoryEntry {
  date: string;
  action: 'earned' | 'redeemed';
  points: number;
  orderId?: string;
  description?: string;
}

export interface LoyaltyProfile {
  points: number;
  tier: LoyaltyTier;
  nextTierPoints: number;
  history?: LoyaltyPointsHistoryEntry[];
}

export interface LoyaltyRedemption {
  pointsToRedeem: number;
  discountValue: number;
  pointsToDollarRate: number;
}

export interface LoyaltySettings {
  pointsPerDollar: number; // e.g., 1 point per $1 spent
  pointsToDollarRate: number; // e.g., 100 points = $1 off
  tierEarningMultipliers: Record<LoyaltyTier, number>; // e.g., gold: 1.2x points
  promoEarningMultiplier: number; // e.g., 2x points during promo
}

export interface Pricing {
  basePrice: number;
  currency: string;
  discounts: {
    type: string;
    value: number;
  }[];
  taxes: {
    type: string;
    rate: number;
  }[];
  urgencyMultiplier?: number;
  tieredPrice?: TieredPrice[];
  finalPrice?: number;
  loyaltyProfile?: {
    points: number;
    tier: LoyaltyTier;
    nextTierPoints: number;
  };
}

export interface TransportDetails {
  pickupAddress: string;
  dropoffAddress: string;
  pickupTime: string;
  dropoffTime: string;
  vehicleType: string;
  specialInstructions?: string;
  distance?: number;
  estimatedTime?: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType;
  labels: string[];
  dueDate: string;
  assignedTo: string;
  archived: boolean;
  sprintId?: string;
  epicId?: string;
  storyPoints?: number;
  acceptanceCriteria: string[];
  estimatedTime: number;
  actualTime: number;
  timeEntries: TimeEntry[];
  dependencies: TaskDependency[];
  environment: string;
  browsers: string[];
  devices: string[];
  operatingSystems: string[];
  tags: string[];
  subtasks: Subtask[];
  notes?: string;
  isRecurring: boolean;
  comments: Comment[];
  attachments: Attachment[];
  customFields: Record<string, any>;
  isTemplate: boolean;
  workflowRules: WorkflowRule[];
  createdAt: string;
  updatedAt: string;
  pricing?: Pricing;
  transportDetails?: TransportDetails;
}

export interface WorkflowRule {
  id: string;
  name: string;
  description: string;
  conditions: {
    field: string;
    operator: string;
    value: any;
  }[];
  actions: {
    type: string;
    params: any;
  }[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  displayName?: string;
  photoURL?: string;
  referralCode: string;
  points: number;
  loyaltyProfile: {
    tier: string;
    points: number;
    discount: number;
  };
  createdAt?: Date;
  updatedAt?: Date;
  role?: 'admin' | 'user' | 'staff';
} 