import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as XLSX from 'xlsx';
import {
  DataProduct,
  Customer,
  CallRecord,
  RefundRecord,
  AdjustmentRecord,
  ReconciliationResult,
  ReconciliationDetail,
  DiscrepancyItem,
  FetchStatus,
  ExportType,
  ReconciliationCycle,
  BillingConfig,
  ReconciliationBatch,
  CustomerProgress,
  CustomerProgressStatus,
  UploadPreviewData,
  UploadValidationResult,
} from '@/../shared/types';
import {
  mockProducts,
  mockCustomers,
  mockCallRecords,
  mockRefundRecords,
  mockAdjustmentRecords,
  mockReconciliationCycle,
  generateId,
  getCurrentPeriod,
} from '@/data/mockData';

interface ReconciliationStore {
  products: DataProduct[];
  customers: Customer[];
  callRecords: CallRecord[];
  refundRecords: RefundRecord[];
  adjustmentRecords: AdjustmentRecord[];
  reconciliationCycle: ReconciliationCycle;
  billingConfigs: BillingConfig[];
  results: ReconciliationResult[];
  reconciliationResults: ReconciliationResult[];
  batches: ReconciliationBatch[];
  currentBatchId: string | null;
  customerProgress: CustomerProgress[];
  currentPeriod: string;
  fetchStatuses: FetchStatus[];
  isFetching: boolean;
  isReconciling: boolean;
  uploadPreview: UploadPreviewData | null;

  setProducts: (products: DataProduct[]) => void;
  addProduct: (product: Omit<DataProduct, 'id' | 'createdAt'>) => void;
  updateProduct: (product: DataProduct) => void;
  deleteProduct: (id: string) => void;

  setCustomers: (customers: Customer[]) => void;
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => void;
  updateCustomer: (customer: Customer) => void;
  deleteCustomer: (id: string) => void;

  setBillingConfigs: (configs: BillingConfig[]) => void;
  addBillingConfig: (config: BillingConfig) => void;
  updateBillingConfig: (config: BillingConfig) => void;
  deleteBillingConfig: (id: string) => void;

  setReconciliationCycle: (cycle: ReconciliationCycle) => void;

  fetchAllData: () => Promise<void>;

  parseUploadFile: (file: File, type: 'calls' | 'refunds' | 'adjustments') => Promise<UploadPreviewData>;
  confirmUpload: () => void;
  cancelUpload: () => void;

  createBatch: (period: string, name: string, remark?: string) => ReconciliationBatch;
  setCurrentBatch: (batchId: string | null) => void;
  updateBatchStatus: (batchId: string, status: ReconciliationBatch['status']) => void;
  updateCustomerProgress: (batchId: string, customerId: string, updates: Partial<CustomerProgress>) => void;

  runReconciliation: () => ReconciliationResult[];
  recalculateResultAmount: (resultId: string) => void;

  markAsDuplicate: (callRecordId: string) => void;
  markAsOverAuthorized: (callRecordId: string) => void;
  resolveDiscrepancy: (resultId: string, discrepancyId: string, resolution: string, amountImpact?: number) => void;
  waiveDiscrepancy: (resultId: string, discrepancyId: string) => void;
  markDiscrepancyAsFreeTrial: (resultId: string, discrepancyId: string) => void;
  applyPeriodAdjustment: (resultId: string, amount: number, reason: string) => void;
  addAdjustment: (adjustment: Omit<AdjustmentRecord, 'id' | 'createdAt'>) => void;

  exportReport: (type: ExportType, period: string) => void;

  resetData: () => void;
}

const initialFetchStatuses: FetchStatus[] = [
  { source: 'calls', status: 'idle', count: 0 },
  { source: 'authorization', status: 'idle', count: 0 },
  { source: 'refunds', status: 'idle', count: 0 },
  { source: 'adjustments', status: 'idle', count: 0 },
];

const calculateUnitPrice = (product: DataProduct, totalCalls: number): number => {
  if (product.billingType === 'tiered' && product.tierPrices) {
    for (const tier of product.tierPrices) {
      if (totalCalls >= tier.minCalls && totalCalls <= tier.maxCalls) {
        return tier.unitPrice;
      }
    }
  }
  return product.unitPrice;
};

const calculateProductAmount = (
  product: DataProduct,
  totalCalls: number,
  authorized: { pricingType: string; discountRate?: number }
): { billableCalls: number; unitPrice: number; subtotal: number } => {
  let unitPrice = calculateUnitPrice(product, totalCalls);
  let billableCalls = totalCalls;
  let subtotal = 0;

  if (authorized.pricingType === 'free_trial') {
    return { billableCalls: 0, unitPrice, subtotal: 0 };
  }

  if (product.billingType === 'monthly' && product.monthlyFee) {
    subtotal = product.monthlyFee;
  } else {
    subtotal = billableCalls * unitPrice;
  }

  if (authorized.pricingType === 'discount' && authorized.discountRate) {
    subtotal = subtotal * authorized.discountRate;
  }

  return { billableCalls, unitPrice, subtotal };
};

const isDateInPeriod = (dateStr: string, period: string): boolean => {
  return dateStr.startsWith(period);
};

const isAuthorizedForPeriod = (authorized: { startDate: string; endDate: string }, period: string): boolean => {
  const [year, month] = period.split('-').map(Number);
  const periodStart = new Date(year, month - 1, 1);
  const periodEnd = new Date(year, month, 0);
  const authStart = new Date(authorized.startDate);
  const authEnd = new Date(authorized.endDate);
  return authStart <= periodEnd && authEnd >= periodStart;
};

const validateUploadedCalls = (rows: any[], customers: Customer[], products: DataProduct[]): UploadValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  let validRows = 0;

  const customerMap = new Map(customers.map(c => [c.name, c.id]));
  const productMap = new Map(products.map(p => [p.name, p.id]));

  rows.forEach((row, idx) => {
    const lineNum = idx + 2;
    if (!row.customerName || !row.productName || !row.callCount) {
      errors.push(`第${lineNum}行: 缺少必填字段(客户名称/产品名称/调用次数)`);
      return;
    }
    if (!customerMap.has(row.customerName)) {
      warnings.push(`第${lineNum}行: 客户"${row.customerName}"不存在系统中，将跳过`);
      return;
    }
    if (!productMap.has(row.productName)) {
      warnings.push(`第${lineNum}行: 产品"${row.productName}"不存在系统中，将跳过`);
      return;
    }
    if (isNaN(Number(row.callCount)) || Number(row.callCount) < 0) {
      errors.push(`第${lineNum}行: 调用次数必须是非负数字`);
      return;
    }
    validRows++;
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    totalRows: rows.length,
    validRows,
  };
};

const validateUploadedRefunds = (rows: any[], customers: Customer[], products: DataProduct[]): UploadValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  let validRows = 0;

  const customerMap = new Map(customers.map(c => [c.name, c.id]));
  const productMap = new Map(products.map(p => [p.name, p.id]));

  rows.forEach((row, idx) => {
    const lineNum = idx + 2;
    if (!row.customerName || !row.productName || !row.amount || !row.reason) {
      errors.push(`第${lineNum}行: 缺少必填字段(客户名称/产品名称/金额/退款原因)`);
      return;
    }
    if (!customerMap.has(row.customerName)) {
      warnings.push(`第${lineNum}行: 客户"${row.customerName}"不存在`);
      return;
    }
    if (!productMap.has(row.productName)) {
      warnings.push(`第${lineNum}行: 产品"${row.productName}"不存在`);
      return;
    }
    if (isNaN(Number(row.amount)) || Number(row.amount) <= 0) {
      errors.push(`第${lineNum}行: 退款金额必须是正数`);
      return;
    }
    validRows++;
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    totalRows: rows.length,
    validRows,
  };
};

const validateUploadedAdjustments = (rows: any[], customers: Customer[]): UploadValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  let validRows = 0;

  const customerMap = new Map(customers.map(c => [c.name, c.id]));

  rows.forEach((row, idx) => {
    const lineNum = idx + 2;
    if (!row.customerName || !row.amount || !row.type || !row.reason || !row.operator) {
      errors.push(`第${lineNum}行: 缺少必填字段(客户名称/金额/类型/原因/操作人)`);
      return;
    }
    if (!customerMap.has(row.customerName)) {
      warnings.push(`第${lineNum}行: 客户"${row.customerName}"不存在`);
      return;
    }
    if (!['addition', 'deduction'].includes(row.type)) {
      errors.push(`第${lineNum}行: 类型必须是 addition(加款) 或 deduction(减款)`);
      return;
    }
    if (isNaN(Number(row.amount)) || Number(row.amount) <= 0) {
      errors.push(`第${lineNum}行: 金额必须是正数`);
      return;
    }
    validRows++;
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    totalRows: rows.length,
    validRows,
  };
};

const recalculateConfirmedAmount = (result: ReconciliationResult): ReconciliationResult => {
  let confirmedAmount = result.receivableAmount;

  for (const d of result.discrepancies) {
    if (d.status === 'resolved') {
      if (d.type === 'duplicate_call') {
        confirmedAmount -= d.amount;
      } else if (d.type === 'over_authorized') {
        confirmedAmount -= d.amount;
      } else if (d.type === 'free_trial') {
        confirmedAmount -= d.amount;
      } else if (d.type === 'period_adjustment') {
        confirmedAmount += d.amount;
      } else if (d.type === 'other') {
        confirmedAmount += d.amount;
      }
    }
  }

  return {
    ...result,
    confirmedAmount: Number(confirmedAmount.toFixed(2)),
    differenceAmount: Number((result.receivableAmount - confirmedAmount).toFixed(2)),
  };
};

export const useReconciliationStore = create<ReconciliationStore>()(
  persist(
    (set, get) => ({
      products: mockProducts,
      customers: mockCustomers,
      callRecords: [],
      refundRecords: [],
      adjustmentRecords: [],
      reconciliationCycle: mockReconciliationCycle,
      billingConfigs: [],
      results: [],
      reconciliationResults: [],
      batches: [],
      currentBatchId: null,
      customerProgress: [],
      currentPeriod: '2026-05',
      fetchStatuses: initialFetchStatuses,
      isFetching: false,
      isReconciling: false,
      uploadPreview: null,

      setProducts: (products) => set({ products }),
      addProduct: (product) =>
        set((state) => ({
          products: [
            ...state.products,
            {
              ...product,
              id: generateId('prod'),
              createdAt: new Date().toISOString().split('T')[0],
            },
          ],
        })),
      updateProduct: (product) =>
        set((state) => ({
          products: state.products.map((p) => (p.id === product.id ? product : p)),
        })),
      deleteProduct: (id) =>
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
        })),

      setCustomers: (customers) => set({ customers }),
      addCustomer: (customer) =>
        set((state) => ({
          customers: [
            ...state.customers,
            {
              ...customer,
              id: generateId('cust'),
              createdAt: new Date().toISOString().split('T')[0],
            },
          ],
        })),
      updateCustomer: (customer) =>
        set((state) => ({
          customers: state.customers.map((c) => (c.id === customer.id ? customer : c)),
        })),
      deleteCustomer: (id) =>
        set((state) => ({
          customers: state.customers.filter((c) => c.id !== id),
        })),

      setBillingConfigs: (billingConfigs) => set({ billingConfigs }),
      addBillingConfig: (config) =>
        set((state) => ({
          billingConfigs: [...state.billingConfigs, config],
        })),
      updateBillingConfig: (config) =>
        set((state) => ({
          billingConfigs: state.billingConfigs.map((c) => (c.id === config.id ? config : c)),
        })),
      deleteBillingConfig: (id) =>
        set((state) => ({
          billingConfigs: state.billingConfigs.filter((c) => c.id !== id),
        })),

      setReconciliationCycle: (cycle) => set({ reconciliationCycle: cycle }),

      fetchAllData: async () => {
        set({ isFetching: true, fetchStatuses: initialFetchStatuses.map(s => ({ ...s, status: 'fetching' })) });

        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        await delay(800);
        const { customers } = get();
        set((state) => ({
          callRecords: mockCallRecords,
          fetchStatuses: state.fetchStatuses.map(s =>
            s.source === 'calls' ? { ...s, status: 'success', count: mockCallRecords.length, fetchedAt: new Date().toISOString() } : s
          ),
        }));

        await delay(600);
        set((state) => ({
          fetchStatuses: state.fetchStatuses.map(s =>
            s.source === 'authorization' ? { ...s, status: 'success', count: customers.reduce((acc, c) => acc + c.authorizedProducts.length, 0), fetchedAt: new Date().toISOString() } : s
          ),
        }));

        await delay(500);
        set((state) => ({
          refundRecords: mockRefundRecords,
          fetchStatuses: state.fetchStatuses.map(s =>
            s.source === 'refunds' ? { ...s, status: 'success', count: mockRefundRecords.length, fetchedAt: new Date().toISOString() } : s
          ),
        }));

        await delay(400);
        set((state) => ({
          adjustmentRecords: mockAdjustmentRecords,
          fetchStatuses: state.fetchStatuses.map(s =>
            s.source === 'adjustments' ? { ...s, status: 'success', count: mockAdjustmentRecords.length, fetchedAt: new Date().toISOString() } : s
          ),
        }));

        set({ isFetching: false });

        const { currentBatchId, batches, currentPeriod } = get();
        if (currentBatchId) {
          customers.forEach(c => {
            get().updateCustomerProgress(currentBatchId, c.id, {
              callsFetched: true,
              refundsFetched: true,
              adjustmentsFetched: true,
              status: 'fetched',
              lastUpdated: new Date().toISOString(),
            });
          });
        }
      },

      parseUploadFile: async (file, type) => {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        const headers = rows.length > 0 ? Object.keys(rows[0]) : [];

        const { customers, products } = get();
        let validation: UploadValidationResult;

        if (type === 'calls') {
          validation = validateUploadedCalls(rows, customers, products);
        } else if (type === 'refunds') {
          validation = validateUploadedRefunds(rows, customers, products);
        } else {
          validation = validateUploadedAdjustments(rows, customers);
        }

        const preview: UploadPreviewData = {
          type,
          headers,
          rows: rows.slice(0, 10),
          validation,
          mappedFields: {},
        };

        set({ uploadPreview: preview });
        return preview;
      },

      confirmUpload: () => {
        const { uploadPreview, callRecords, refundRecords, adjustmentRecords, customers, products } = get();
        if (!uploadPreview) return;

        const customerMap = new Map(customers.map(c => [c.name, c.id]));
        const productMap = new Map(products.map(p => [p.name, p.id]));

        if (uploadPreview.type === 'calls') {
          const newRecords: CallRecord[] = uploadPreview.rows
            .filter(row => customerMap.has(row.customerName) && productMap.has(row.productName))
            .map(row => ({
              id: generateId('call'),
              customerId: customerMap.get(row.customerName)!,
              customerName: row.customerName,
              productId: productMap.get(row.productName)!,
              productName: row.productName,
              callTime: row.callTime || new Date().toISOString().slice(0, 10),
              callCount: Number(row.callCount),
              isDuplicate: false,
              isOverAuthorized: false,
            }));
          set({
            callRecords: [...callRecords, ...newRecords],
            uploadPreview: null,
          });
        } else if (uploadPreview.type === 'refunds') {
          const newRecords: RefundRecord[] = uploadPreview.rows
            .filter(row => customerMap.has(row.customerName) && productMap.has(row.productName))
            .map(row => ({
              id: generateId('refund'),
              customerId: customerMap.get(row.customerName)!,
              customerName: row.customerName,
              productId: productMap.get(row.productName)!,
              productName: row.productName,
              amount: Number(row.amount),
              reason: row.reason,
              refundDate: row.refundDate || new Date().toISOString().slice(0, 10),
              status: 'approved',
            }));
          set({
            refundRecords: [...refundRecords, ...newRecords],
            uploadPreview: null,
          });
        } else {
          const newRecords: AdjustmentRecord[] = uploadPreview.rows
            .filter(row => customerMap.has(row.customerName))
            .map(row => ({
              id: generateId('adj'),
              customerId: customerMap.get(row.customerName)!,
              customerName: row.customerName,
              amount: Number(row.amount),
              type: row.type as 'addition' | 'deduction',
              reason: row.reason,
              operator: row.operator,
              createdAt: row.createdAt || new Date().toISOString().slice(0, 10),
            }));
          set({
            adjustmentRecords: [...adjustmentRecords, ...newRecords],
            uploadPreview: null,
          });
        }
      },

      cancelUpload: () => set({ uploadPreview: null }),

      createBatch: (period, name, remark) => {
        const { customers } = get();
        const batch: ReconciliationBatch = {
          id: generateId('batch'),
          period,
          name,
          status: 'draft',
          createdAt: new Date().toISOString(),
          createdBy: '系统管理员',
          remark,
        };

        const progress: CustomerProgress[] = customers.map(c => ({
          batchId: batch.id,
          customerId: c.id,
          customerName: c.name,
          status: 'not_started',
          callsFetched: false,
          refundsFetched: false,
          adjustmentsFetched: false,
          reconciled: false,
          discrepanciesResolved: false,
          exported: false,
          lastUpdated: new Date().toISOString(),
        }));

        set(state => ({
          batches: [...state.batches, batch],
          currentBatchId: batch.id,
          customerProgress: [...state.customerProgress, ...progress],
        }));

        return batch;
      },

      setCurrentBatch: (batchId) => set({ currentBatchId: batchId }),

      updateBatchStatus: (batchId, status) =>
        set(state => ({
          batches: state.batches.map(b =>
            b.id === batchId
              ? { ...b, status, completedAt: status === 'completed' || status === 'closed' ? new Date().toISOString() : undefined }
              : b
          ),
        })),

      updateCustomerProgress: (batchId, customerId, updates) =>
        set(state => ({
          customerProgress: state.customerProgress.map(p =>
            p.batchId === batchId && p.customerId === customerId
              ? { ...p, ...updates, lastUpdated: new Date().toISOString() }
              : p
          ),
        })),

      runReconciliation: () => {
        set({ isReconciling: true });

        const {
          customers,
          products,
          callRecords,
          refundRecords,
          adjustmentRecords,
          currentPeriod,
          currentBatchId,
        } = get();

        const results: ReconciliationResult[] = [];

        for (const customer of customers) {
          const customerCalls = callRecords.filter(
            (c) => c.customerId === customer.id && c.callTime.startsWith(currentPeriod)
          );

          const customerRefunds = refundRecords.filter(
            (r) => r.customerId === customer.id && r.status === 'approved' && isDateInPeriod(r.refundDate, currentPeriod)
          );

          const customerAdjustments = adjustmentRecords.filter(
            (a) => a.customerId === customer.id && isDateInPeriod(a.createdAt, currentPeriod)
          );

          const discrepancies: DiscrepancyItem[] = [];
          const callSummary: ReconciliationResult['callSummary'] = [];
          let totalReceivable = 0;

          for (const authorized of customer.authorizedProducts) {
            const product = products.find((p) => p.id === authorized.productId);
            if (!product) continue;

            if (!isAuthorizedForPeriod(authorized, currentPeriod)) {
              continue;
            }

            const productCalls = customerCalls.filter((c) => c.productId === product.id);
            const duplicateCalls = productCalls.filter((c) => c.isDuplicate);
            const overAuthorizedCalls = productCalls.filter((c) => c.isOverAuthorized);

            const totalCalls = productCalls.reduce((sum, c) => sum + c.callCount, 0);
            const duplicateCount = duplicateCalls.reduce((sum, c) => sum + c.callCount, 0);
            const overAuthorizedCount = overAuthorizedCalls.reduce((sum, c) => sum + c.callCount, 0);

            if (authorized.maxCallsPerMonth && totalCalls > authorized.maxCallsPerMonth) {
              const overLimitCount = totalCalls - authorized.maxCallsPerMonth;
              const overLimitAmount = overLimitCount * product.unitPrice;
              discrepancies.push({
                id: generateId('disc'),
                type: 'over_authorized',
                description: `超出月调用上限${overLimitCount}次(${product.name})，上限${authorized.maxCallsPerMonth}次，实际${totalCalls}次`,
                amount: overLimitAmount,
                callRecordIds: productCalls.map((c) => c.id),
                status: 'pending',
              });
            }

            if (duplicateCount > 0) {
              const duplicateAmount = duplicateCount * product.unitPrice;
              discrepancies.push({
                id: generateId('disc'),
                type: 'duplicate_call',
                description: `检测到${duplicateCount}次重复调用(${product.name})`,
                amount: duplicateAmount,
                callRecordIds: duplicateCalls.map((c) => c.id),
                status: 'pending',
              });
            }

            if (overAuthorizedCount > 0) {
              const overAmount = overAuthorizedCount * product.unitPrice;
              discrepancies.push({
                id: generateId('disc'),
                type: 'over_authorized',
                description: `检测到${overAuthorizedCount}次超授权调用(${product.name})`,
                amount: overAmount,
                callRecordIds: overAuthorizedCalls.map((c) => c.id),
                status: 'pending',
              });
            }

            if (authorized.pricingType === 'free_trial') {
              if (totalCalls > 0) {
                const freeAmount = totalCalls * product.unitPrice;
                discrepancies.push({
                  id: generateId('disc'),
                  type: 'free_trial',
                  description: `免费试用期间，${totalCalls}次调用免计费(${product.name})`,
                  amount: freeAmount,
                  status: 'pending',
                });
              }
            }

            if (authorized.pricingType === 'discount' && authorized.discountRate && totalCalls > 0) {
              const originalAmount = totalCalls * product.unitPrice;
              const discountedAmount = originalAmount * authorized.discountRate;
              const discountValue = originalAmount - discountedAmount;
              if (discountValue > 0) {
                discrepancies.push({
                  id: generateId('disc'),
                  type: 'period_adjustment',
                  description: `客户折扣${(authorized.discountRate * 100).toFixed(0)}%，优惠金额¥${discountValue.toFixed(2)}(${product.name})`,
                  amount: -discountValue,
                  status: 'resolved',
                  resolution: '自动应用客户折扣',
                  resolvedAt: new Date().toISOString(),
                });
              }
            }

            const billableCount = totalCalls - duplicateCount;
            const productAmount = calculateProductAmount(product, billableCount, authorized);
            callSummary.push({
              productId: product.id,
              productName: product.name,
              totalCalls,
              billableCalls: productAmount.billableCalls,
              unitPrice: productAmount.unitPrice,
              subtotal: productAmount.subtotal,
            });

            totalReceivable += productAmount.subtotal;
          }

          const refundTotal = customerRefunds.reduce((sum, r) => sum + r.amount, 0);
          const adjustmentTotal = customerAdjustments.reduce(
            (sum, a) => sum + (a.type === 'deduction' ? -a.amount : a.amount),
            0
          );

          customerAdjustments.forEach((adj) => {
            discrepancies.push({
              id: generateId('disc'),
              type: 'period_adjustment',
              description: `人工${adj.type === 'addition' ? '加' : '减'}款: ${adj.reason}`,
              amount: adj.type === 'deduction' ? -adj.amount : adj.amount,
              status: 'resolved',
              resolution: '已确认人工调整',
              resolvedAt: adj.createdAt,
            });
          });

          customerRefunds.forEach((refund) => {
            discrepancies.push({
              id: generateId('disc'),
              type: 'other',
              description: `退款: ${refund.reason}`,
              amount: -refund.amount,
              status: 'resolved',
              resolution: '已退款',
              resolvedAt: refund.refundDate,
            });
          });

          const unresolvedDiscrepancies = discrepancies.filter(
            (d) => d.status === 'pending'
          );

          const details: ReconciliationDetail[] = callSummary.map((s) => {
            const product = products.find((p) => p.id === s.productId);
            const authorized = customer.authorizedProducts.find(
              (a) => a.productId === s.productId
            );
            return {
              productId: s.productId,
              productName: s.productName,
              billingType: product?.billingType || 'per_call',
              callCount: s.totalCalls,
              unitPrice: s.unitPrice,
              discountRate: authorized?.discountRate,
              receivableAmount: s.subtotal,
              isConfirmed: true,
            };
          });

          const preliminaryResult: ReconciliationResult = {
            id: generateId('result'),
            customerId: customer.id,
            customerName: customer.name,
            period: currentPeriod,
            totalCalls: callSummary.reduce((sum, s) => sum + s.totalCalls, 0),
            receivableAmount: Number(totalReceivable.toFixed(2)),
            confirmedAmount: Number((totalReceivable - refundTotal + adjustmentTotal).toFixed(2)),
            differenceAmount: Number((refundTotal - adjustmentTotal).toFixed(2)),
            refundAdjustment: Number(refundTotal.toFixed(2)),
            manualAdjustment: Number(adjustmentTotal.toFixed(2)),
            status:
              unresolvedDiscrepancies.length === 0
                ? 'completed'
                : unresolvedDiscrepancies.length === discrepancies.length
                ? 'pending'
                : 'partial',
            details,
            discrepancies,
            callSummary,
            createdAt: new Date().toISOString(),
          };

          const finalResult = recalculateConfirmedAmount(preliminaryResult);
          results.push(finalResult);

          if (currentBatchId) {
            let status: CustomerProgressStatus = 'reconciled';
            if (unresolvedDiscrepancies.length > 0) {
              status = 'pending_resolution';
            }
            get().updateCustomerProgress(currentBatchId, customer.id, {
              reconciled: true,
              discrepanciesResolved: unresolvedDiscrepancies.length === 0,
              status,
              lastUpdated: new Date().toISOString(),
            });
          }
        }

        set({ results, reconciliationResults: results, isReconciling: false });
        return results;
      },

      recalculateResultAmount: (resultId) =>
        set(state => {
          const newResults = state.results.map(r =>
            r.id === resultId ? recalculateConfirmedAmount(r) : r
          );
          return { results: newResults, reconciliationResults: newResults };
        }),

      addAdjustment: (adjustment) =>
        set((state) => ({
          adjustmentRecords: [
            ...state.adjustmentRecords,
            {
              ...adjustment,
              id: generateId('adj'),
              createdAt: new Date().toISOString().split('T')[0],
            },
          ],
        })),

      markAsDuplicate: (callRecordId) =>
        set((state) => ({
          callRecords: state.callRecords.map((c) =>
            c.id === callRecordId ? { ...c, isDuplicate: true } : c
          ),
        })),

      markAsOverAuthorized: (callRecordId) =>
        set((state) => ({
          callRecords: state.callRecords.map((c) =>
            c.id === callRecordId ? { ...c, isOverAuthorized: true } : c
          ),
        })),

      resolveDiscrepancy: (resultId, discrepancyId, resolution, amountImpact) =>
        set((state) => {
          const newResults = state.results.map((r) => {
            if (r.id !== resultId) return r;
            const newDiscrepancies = r.discrepancies.map((d) =>
              d.id === discrepancyId
                ? {
                    ...d,
                    status: 'resolved' as const,
                    resolution,
                    resolvedAt: new Date().toISOString(),
                    ...(amountImpact !== undefined ? { amount: amountImpact } : {}),
                  }
                : d
            );
            const hasPending = newDiscrepancies.some((d) => d.status === 'pending');
            const newStatus: 'completed' | 'partial' | 'pending' = hasPending
              ? newDiscrepancies.every((d) => d.status === 'pending')
                ? 'pending'
                : 'partial'
              : 'completed';
            const updated = {
              ...r,
              discrepancies: newDiscrepancies,
              status: newStatus,
            };
            return recalculateConfirmedAmount(updated);
          });
          return { results: newResults, reconciliationResults: newResults };
        }),

      waiveDiscrepancy: (resultId, discrepancyId) =>
        set((state) => {
          const newResults = state.results.map((r) => {
            if (r.id !== resultId) return r;
            const newDiscrepancies = r.discrepancies.map((d) =>
              d.id === discrepancyId
                ? {
                    ...d,
                    status: 'resolved' as const,
                    resolution: '豁免该笔费用，不计入结算',
                    resolvedAt: new Date().toISOString(),
                  }
                : d
            );
            const hasPending = newDiscrepancies.some((d) => d.status === 'pending');
            const newStatus: 'completed' | 'partial' | 'pending' = hasPending
              ? newDiscrepancies.every((d) => d.status === 'pending')
                ? 'pending'
                : 'partial'
              : 'completed';
            const updated = {
              ...r,
              discrepancies: newDiscrepancies,
              status: newStatus,
            };
            return recalculateConfirmedAmount(updated);
          });
          return { results: newResults, reconciliationResults: newResults };
        }),

      markDiscrepancyAsFreeTrial: (resultId, discrepancyId) =>
        set((state) => {
          const newResults = state.results.map((r) => {
            if (r.id !== resultId) return r;
            const newDiscrepancies = r.discrepancies.map((d) =>
              d.id === discrepancyId
                ? {
                    ...d,
                    type: 'free_trial' as const,
                    status: 'resolved' as const,
                    resolution: '标记为免费试用，免计费',
                    resolvedAt: new Date().toISOString(),
                  }
                : d
            );
            const hasPending = newDiscrepancies.some((d) => d.status === 'pending');
            const newStatus: 'completed' | 'partial' | 'pending' = hasPending
              ? newDiscrepancies.every((d) => d.status === 'pending')
                ? 'pending'
                : 'partial'
              : 'completed';
            const updated = {
              ...r,
              discrepancies: newDiscrepancies,
              status: newStatus,
            };
            return recalculateConfirmedAmount(updated);
          });
          return { results: newResults, reconciliationResults: newResults };
        }),

      applyPeriodAdjustment: (resultId, amount, reason) =>
        set((state) => {
          const newResults = state.results.map((r) => {
            if (r.id !== resultId) return r;
            const updated = {
              ...r,
              discrepancies: [
                ...r.discrepancies,
                {
                  id: generateId('disc'),
                  type: 'period_adjustment' as const,
                  description: reason,
                  amount,
                  status: 'resolved' as const,
                  resolution: '人工账期调整',
                  resolvedAt: new Date().toISOString(),
                },
              ],
            };
            return recalculateConfirmedAmount(updated);
          });
          return { results: newResults, reconciliationResults: newResults };
        }),

      exportReport: (type, period) => {
        const { results, customers, callRecords, customerProgress, currentBatchId } = get();
        let wb: XLSX.WorkBook;

        if (type === 'customer_statement') {
          wb = XLSX.utils.book_new();

          for (const result of results) {
            if (!result.period.startsWith(period)) continue;

            const customer = customers.find((c) => c.id === result.customerId);
            if (!customer) continue;

            const data: any[] = [
              ['客户对账单'],
              ['客户名称', result.customerName],
              ['对账周期', result.period],
              ['联系人', customer.contact],
              ['联系电话', customer.phone],
              ['联系邮箱', customer.email],
              [],
              ['一、调用明细'],
              ['产品名称', '总调用次数', '计费次数', '单价(元)', '小计(元)'],
              ...result.callSummary.map((s) => [
                s.productName,
                s.totalCalls,
                s.billableCalls,
                s.unitPrice.toFixed(2),
                s.subtotal.toFixed(2),
              ]),
              [],
              ['二、应收金额'],
              ['应收金额(元)', result.receivableAmount.toFixed(2)],
              [],
              ['三、差异调整'],
              ['类型', '说明', '金额(元)', '状态', '处理说明'],
              ...result.discrepancies.map((d) => [
                d.type === 'duplicate_call' ? '重复调用' :
                d.type === 'over_authorized' ? '超授权调用' :
                d.type === 'free_trial' ? '免费试用' :
                d.type === 'period_adjustment' ? '账期调整' : '其他',
                d.description,
                d.amount.toFixed(2),
                d.status === 'resolved' ? '已处理' : '待处理',
                d.resolution || '',
              ]),
              [],
              ['四、结算金额'],
              ['确认金额(元)', result.confirmedAmount.toFixed(2)],
              ['差异金额(元)', result.differenceAmount.toFixed(2)],
              ['对账状态', result.status === 'completed' ? '已完成' : result.status === 'partial' ? '部分处理' : '待处理'],
            ];

            const ws = XLSX.utils.aoa_to_sheet(data);
            ws['!cols'] = [
              { wch: 25 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 20 }, { wch: 30 }
            ];
            const sheetName = result.customerName.length > 30 ? result.customerName.slice(0, 30) : result.customerName;
            XLSX.utils.book_append_sheet(wb, ws, sheetName);
          }

          XLSX.writeFile(wb, `客户对账单_${period}.xlsx`);
        } else if (type === 'internal_summary') {
          const data: any[] = [
            ['内部对账汇总表'],
            ['对账周期', period],
            ['生成时间', new Date().toLocaleString('zh-CN')],
            [],
            ['客户名称', '调用次数', '应收金额(元)', '确认金额(元)', '差异金额(元)', '状态', '待处理差异数'],
            ...results
              .filter((r) => r.period.startsWith(period))
              .map((r) => [
                r.customerName,
                r.totalCalls,
                r.receivableAmount.toFixed(2),
                r.confirmedAmount.toFixed(2),
                r.differenceAmount.toFixed(2),
                r.status === 'completed' ? '已完成' : r.status === 'partial' ? '部分处理' : '待处理',
                r.discrepancies.filter((d) => d.status === 'pending').length,
              ]),
            [],
            ['合计'],
            ['总调用次数', results.filter(r => r.period.startsWith(period)).reduce((s, r) => s + r.totalCalls, 0)],
            ['总应收', results.filter(r => r.period.startsWith(period)).reduce((s, r) => s + r.receivableAmount, 0).toFixed(2)],
            ['总确认', results.filter(r => r.period.startsWith(period)).reduce((s, r) => s + r.confirmedAmount, 0).toFixed(2)],
            ['总差异', results.filter(r => r.period.startsWith(period)).reduce((s, r) => s + r.differenceAmount, 0).toFixed(2)],
          ];

          wb = XLSX.utils.book_new();
          const ws = XLSX.utils.aoa_to_sheet(data);
          ws['!cols'] = [{ wch: 30 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 15 }];
          XLSX.utils.book_append_sheet(wb, ws, '汇总');
          XLSX.writeFile(wb, `内部对账汇总表_${period}.xlsx`);
        } else {
          const batchProgress = currentBatchId
            ? customerProgress.filter(p => p.batchId === currentBatchId)
            : [];

          const followupItems: any[] = [];
          followupItems.push(['待跟进清单']);
          followupItems.push(['对账周期', period]);
          followupItems.push(['生成时间', new Date().toLocaleString('zh-CN')]);
          followupItems.push([]);
          followupItems.push(['客户名称', '联系人', '联系电话', '差异类型', '差异说明', '金额(元)', '处理状态', '跟进建议']);

          for (const result of results) {
            if (!result.period.startsWith(period)) continue;
            const customer = customers.find(c => c.id === result.customerId);
            const progress = batchProgress.find(p => p.customerId === result.customerId);

            for (const d of result.discrepancies) {
              if (d.status === 'pending') {
                let suggestion = '';
                if (d.type === 'duplicate_call') suggestion = '联系客户确认调用是否重复';
                else if (d.type === 'over_authorized') suggestion = '确认是否超授权并协商处理';
                else if (d.type === 'free_trial') suggestion = '确认免费试用资格';
                else suggestion = '与客户核实差异';

                followupItems.push([
                  result.customerName,
                  customer?.contact || '',
                  customer?.phone || '',
                  d.type === 'duplicate_call' ? '重复调用' :
                  d.type === 'over_authorized' ? '超授权调用' :
                  d.type === 'free_trial' ? '免费试用' :
                  d.type === 'period_adjustment' ? '账期调整' : '其他',
                  d.description,
                  d.amount.toFixed(2),
                  '待处理',
                  suggestion,
                ]);
              }
            }
          }

          wb = XLSX.utils.book_new();
          const ws = XLSX.utils.aoa_to_sheet(followupItems);
          ws['!cols'] = [{ wch: 25 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 45 }, { wch: 12 }, { wch: 10 }, { wch: 30 }];
          XLSX.utils.book_append_sheet(wb, ws, '待跟进');
          XLSX.writeFile(wb, `待跟进清单_${period}.xlsx`);
        }

        if (currentBatchId) {
          results.forEach(r => {
            if (r.period.startsWith(period)) {
              get().updateCustomerProgress(currentBatchId, r.customerId, {
                exported: true,
                status: 'exported',
                lastUpdated: new Date().toISOString(),
              });
            }
          });
        }
      },

      resetData: () =>
        set({
          callRecords: [],
          refundRecords: [],
          adjustmentRecords: [],
          results: [],
          reconciliationResults: [],
          fetchStatuses: initialFetchStatuses,
          uploadPreview: null,
        }),
    }),
    {
      name: 'reconciliation-store',
      partialize: (state) => ({
        products: state.products,
        customers: state.customers,
        callRecords: state.callRecords,
        refundRecords: state.refundRecords,
        adjustmentRecords: state.adjustmentRecords,
        billingConfigs: state.billingConfigs,
        results: state.results,
        reconciliationResults: state.reconciliationResults,
        batches: state.batches,
        currentBatchId: state.currentBatchId,
        customerProgress: state.customerProgress,
        currentPeriod: state.currentPeriod,
        reconciliationCycle: state.reconciliationCycle,
      }),
    }
  )
);
