export interface TierPrice {
  minCalls: number;
  maxCalls: number;
  unitPrice: number;
}

export interface DataProduct {
  id: string;
  name: string;
  code: string;
  description: string;
  billingType: 'per_call' | 'monthly' | 'tiered';
  unitPrice: number;
  tierPrices?: TierPrice[];
  monthlyFee?: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface AuthorizedProduct {
  id: string;
  productId: string;
  productName: string;
  startDate: string;
  endDate: string;
  maxCallsPerMonth?: number;
  pricingType: 'standard' | 'discount' | 'free_trial';
  discountRate?: number;
}

export interface Customer {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  authorizedProducts: AuthorizedProduct[];
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface CallRecord {
  id: string;
  customerId: string;
  customerName: string;
  productId: string;
  productName: string;
  callTime: string;
  callCount: number;
  isDuplicate?: boolean;
  isOverAuthorized?: boolean;
}

export interface RefundRecord {
  id: string;
  customerId: string;
  customerName: string;
  productId: string;
  productName: string;
  amount: number;
  reason: string;
  refundDate: string;
  status: 'approved' | 'pending';
}

export interface AdjustmentRecord {
  id: string;
  customerId: string;
  customerName: string;
  amount: number;
  type: 'addition' | 'deduction';
  reason: string;
  operator: string;
  createdAt: string;
}

export type DiscrepancyType = 'duplicate_call' | 'over_authorized' | 'free_trial' | 'period_adjustment' | 'other';

export interface DiscrepancyItem {
  id: string;
  type: DiscrepancyType;
  description: string;
  amount: number;
  callRecordIds?: string[];
  status: 'pending' | 'resolved';
  resolution?: string;
  resolvedAt?: string;
}

export interface ReconciliationDetail {
  productId: string;
  productName: string;
  billingType: 'per_call' | 'monthly' | 'tiered';
  callCount: number;
  unitPrice: number;
  discountRate?: number;
  receivableAmount: number;
  isConfirmed: boolean;
}

export interface ReconciliationResult {
  id: string;
  customerId: string;
  customerName: string;
  period: string;
  totalCalls: number;
  receivableAmount: number;
  confirmedAmount: number;
  differenceAmount: number;
  refundAdjustment: number;
  manualAdjustment: number;
  status: 'completed' | 'partial' | 'pending';
  details: ReconciliationDetail[];
  discrepancies: DiscrepancyItem[];
  callSummary: Array<{
    productId: string;
    productName: string;
    totalCalls: number;
    billableCalls: number;
    unitPrice: number;
    subtotal: number;
  }>;
  createdAt: string;
}

export interface BillingConfig {
  id: string;
  name: string;
  type: 'per_call' | 'monthly' | 'tiered';
  description: string;
  config: {
    unitPrice?: number;
    monthlyFee?: number;
    tiers?: TierPrice[];
  };
  createdAt: string;
}

export interface ReconciliationCycle {
  id: string;
  name: string;
  cycleType: 'monthly' | 'weekly' | 'quarterly';
  startDay: number;
  endDay: number;
  excludeHolidays: boolean;
  holidays: string[];
  createdAt: string;
}

export interface FetchStatus {
  source: 'calls' | 'authorization' | 'refunds' | 'adjustments';
  status: 'idle' | 'fetching' | 'success' | 'error';
  count: number;
  message?: string;
  fetchedAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export type ExportType = 'customer_statement' | 'internal_summary' | 'follow_up_list';

export type CustomerProgressStatus = 'not_started' | 'fetched' | 'reconciled' | 'pending_resolution' | 'exported';

export interface ReconciliationBatch {
  id: string;
  period: string;
  name: string;
  status: 'draft' | 'in_progress' | 'completed' | 'closed';
  createdAt: string;
  createdBy: string;
  completedAt?: string;
  remark?: string;
}

export interface CustomerProgress {
  batchId: string;
  customerId: string;
  customerName: string;
  status: CustomerProgressStatus;
  callsFetched: boolean;
  refundsFetched: boolean;
  adjustmentsFetched: boolean;
  reconciled: boolean;
  discrepanciesResolved: boolean;
  exported: boolean;
  lastUpdated: string;
}

export interface UploadValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  totalRows: number;
  validRows: number;
}

export interface UploadPreviewData {
  type: 'calls' | 'refunds' | 'adjustments';
  headers: string[];
  rows: any[];
  validation: UploadValidationResult;
  mappedFields: Record<string, string>;
}

