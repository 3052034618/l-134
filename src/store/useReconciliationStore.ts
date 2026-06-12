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
  results: ReconciliationResult[];
  reconciliationResults: ReconciliationResult[];
  currentPeriod: string;
  fetchStatuses: FetchStatus[];
  isFetching: boolean;
  isReconciling: boolean;

  setProducts: (products: DataProduct[]) => void;
  addProduct: (product: Omit<DataProduct, 'id' | 'createdAt'>) => void;
  updateProduct: (product: DataProduct) => void;
  deleteProduct: (id: string) => void;

  setCustomers: (customers: Customer[]) => void;
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => void;
  updateCustomer: (customer: Customer) => void;
  deleteCustomer: (id: string) => void;

  setReconciliationCycle: (cycle: ReconciliationCycle) => void;

  fetchAllData: () => Promise<void>;
  runReconciliation: () => ReconciliationResult[];

  markAsDuplicate: (callRecordId: string) => void;
  markAsOverAuthorized: (callRecordId: string) => void;
  resolveDiscrepancy: (resultId: string, discrepancyId: string, resolution: string) => void;
  applyPeriodAdjustment: (resultId: string, amount: number, reason: string) => void;
  markAsFreeTrial: (resultId: string, discrepancyId: string) => void;
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

export const useReconciliationStore = create<ReconciliationStore>()(
  persist(
    (set, get) => ({
      products: mockProducts,
      customers: mockCustomers,
      callRecords: [],
      refundRecords: [],
      adjustmentRecords: [],
      reconciliationCycle: mockReconciliationCycle,
      results: [],
      reconciliationResults: [],
      currentPeriod: '2026-05',
      fetchStatuses: initialFetchStatuses,
      isFetching: false,
      isReconciling: false,

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

      setReconciliationCycle: (cycle) => set({ reconciliationCycle: cycle }),

      fetchAllData: async () => {
        set({ isFetching: true, fetchStatuses: initialFetchStatuses.map(s => ({ ...s, status: 'fetching' })) });

        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        await delay(800);
        set((state) => ({
          callRecords: mockCallRecords,
          fetchStatuses: state.fetchStatuses.map(s =>
            s.source === 'calls' ? { ...s, status: 'success', count: mockCallRecords.length, fetchedAt: new Date().toISOString() } : s
          ),
        }));

        await delay(600);
        set((state) => ({
          fetchStatuses: state.fetchStatuses.map(s =>
            s.source === 'authorization' ? { ...s, status: 'success', count: get().customers.reduce((acc, c) => acc + c.authorizedProducts.length, 0), fetchedAt: new Date().toISOString() } : s
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
      },

      runReconciliation: () => {
        set({ isReconciling: true });

        const {
          customers,
          products,
          callRecords,
          refundRecords,
          adjustmentRecords,
          currentPeriod,
        } = get();

        const results: ReconciliationResult[] = [];

        for (const customer of customers) {
          const customerCalls = callRecords.filter(
            (c) => c.customerId === customer.id && c.callTime.startsWith(currentPeriod)
          );

          const customerRefunds = refundRecords.filter(
            (r) => r.customerId === customer.id && r.status === 'approved'
          );

          const customerAdjustments = adjustmentRecords.filter(
            (a) => a.customerId === customer.id
          );

          const discrepancies: DiscrepancyItem[] = [];
          const callSummary: ReconciliationResult['callSummary'] = [];
          let totalReceivable = 0;

          for (const authorized of customer.authorizedProducts) {
            const product = products.find((p) => p.id === authorized.productId);
            if (!product) continue;

            const productCalls = customerCalls.filter((c) => c.productId === product.id);
            const duplicateCalls = productCalls.filter((c) => c.isDuplicate);
            const overAuthorizedCalls = productCalls.filter((c) => c.isOverAuthorized);

            const totalCalls = productCalls.reduce((sum, c) => sum + c.callCount, 0);
            const duplicateCount = duplicateCalls.reduce((sum, c) => sum + c.callCount, 0);
            const overAuthorizedCount = overAuthorizedCalls.reduce((sum, c) => sum + c.callCount, 0);

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
              const productAmount = calculateProductAmount(product, totalCalls, authorized);
              if (productAmount.subtotal === 0 && totalCalls > 0) {
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

          const confirmedAmount = totalReceivable - refundTotal + adjustmentTotal;

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

          results.push({
            id: generateId('result'),
            customerId: customer.id,
            customerName: customer.name,
            period: currentPeriod,
            totalCalls: callSummary.reduce((sum, s) => sum + s.totalCalls, 0),
            receivableAmount: Number(totalReceivable.toFixed(2)),
            confirmedAmount: Number(confirmedAmount.toFixed(2)),
            differenceAmount: Number((totalReceivable - confirmedAmount).toFixed(2)),
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
          });
        }

        set({ results, reconciliationResults: results, isReconciling: false });
        return results;
      },

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

      resolveDiscrepancy: (resultId, discrepancyId, resolution) =>
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
                  }
                : d
            );
            const hasPending = newDiscrepancies.some((d) => d.status === 'pending');
            const newStatus: 'completed' | 'partial' | 'pending' = hasPending
              ? newDiscrepancies.every((d) => d.status === 'pending')
                ? 'pending'
                : 'partial'
              : 'completed';
            return {
              ...r,
              discrepancies: newDiscrepancies,
              status: newStatus,
            };
          });
          return { results: newResults, reconciliationResults: newResults };
        }),

      applyPeriodAdjustment: (resultId, amount, reason) =>
        set((state) => ({
          results: state.results.map((r) =>
            r.id === resultId
              ? {
                  ...r,
                  discrepancies: [
                    ...r.discrepancies,
                    {
                      id: generateId('disc'),
                      type: 'period_adjustment',
                      description: reason,
                      amount,
                      status: 'resolved',
                      resolution: '人工调整',
                      resolvedAt: new Date().toISOString(),
                    },
                  ],
                  confirmedAmount: Number((r.confirmedAmount + amount).toFixed(2)),
                  differenceAmount: Number((r.receivableAmount - (r.confirmedAmount + amount)).toFixed(2)),
                }
              : r
          ),
        })),

      markAsFreeTrial: (resultId, discrepancyId) =>
        set((state) => ({
          results: state.results.map((r) =>
            r.id === resultId
              ? {
                  ...r,
                  discrepancies: r.discrepancies.map((d) =>
                    d.id === discrepancyId
                      ? {
                          ...d,
                          type: 'free_trial',
                          status: 'resolved',
                          resolution: '标记为免费试用',
                          resolvedAt: new Date().toISOString(),
                        }
                      : d
                  ),
                }
              : r
          ),
        })),

      exportReport: (type, period) => {
        const { results, customers, callRecords } = get();
        let wb: XLSX.WorkBook;

        if (type === 'customer') {
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
            XLSX.utils.book_append_sheet(wb, ws, result.customerName.slice(0, 30));
          }

          XLSX.writeFile(wb, `客户对账单_${period}.xlsx`);
        } else if (type === 'internal') {
          const data: any[] = [
            ['内部对账汇总表'],
            ['对账周期', period],
            ['生成时间', new Date().toLocaleString('zh-CN')],
            [],
            ['客户名称', '应收金额(元)', '确认金额(元)', '差异金额(元)', '状态', '待处理差异数'],
            ...results
              .filter((r) => r.period.startsWith(period))
              .map((r) => [
                r.customerName,
                r.receivableAmount.toFixed(2),
                r.confirmedAmount.toFixed(2),
                r.differenceAmount.toFixed(2),
                r.status === 'completed' ? '已完成' : r.status === 'partial' ? '部分处理' : '待处理',
                r.discrepancies.filter((d) => d.status === 'pending').length,
              ]),
            [],
            ['合计'],
            ['总应收', results.filter(r => r.period.startsWith(period)).reduce((s, r) => s + r.receivableAmount, 0).toFixed(2)],
            ['总确认', results.filter(r => r.period.startsWith(period)).reduce((s, r) => s + r.confirmedAmount, 0).toFixed(2)],
            ['总差异', results.filter(r => r.period.startsWith(period)).reduce((s, r) => s + r.differenceAmount, 0).toFixed(2)],
          ];

          wb = XLSX.utils.book_new();
          const ws = XLSX.utils.aoa_to_sheet(data);
          ws['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 15 }];
          XLSX.utils.book_append_sheet(wb, ws, '汇总');
          XLSX.writeFile(wb, `内部对账汇总表_${period}.xlsx`);
        } else {
          const followupItems: any[] = [];
          followupItems.push(['待跟进清单']);
          followupItems.push(['对账周期', period]);
          followupItems.push(['生成时间', new Date().toLocaleString('zh-CN')]);
          followupItems.push([]);
          followupItems.push(['客户名称', '差异类型', '差异说明', '金额(元)', '调用记录ID']);

          for (const result of results) {
            if (!result.period.startsWith(period)) continue;
            for (const d of result.discrepancies) {
              if (d.status === 'pending') {
                followupItems.push([
                  result.customerName,
                  d.type === 'duplicate_call' ? '重复调用' :
                  d.type === 'over_authorized' ? '超授权调用' :
                  d.type === 'free_trial' ? '免费试用' :
                  d.type === 'period_adjustment' ? '账期调整' : '其他',
                  d.description,
                  d.amount.toFixed(2),
                  d.callRecordIds?.join(', ') || '',
                ]);
              }
            }
          }

          wb = XLSX.utils.book_new();
          const ws = XLSX.utils.aoa_to_sheet(followupItems);
          ws['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 40 }, { wch: 12 }, { wch: 25 }];
          XLSX.utils.book_append_sheet(wb, ws, '待跟进');
          XLSX.writeFile(wb, `待跟进清单_${period}.xlsx`);
        }
      },

      resetData: () =>
        set({
          callRecords: [],
          refundRecords: [],
          adjustmentRecords: [],
          results: [],
          fetchStatuses: initialFetchStatuses,
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
        results: state.results,
        currentPeriod: state.currentPeriod,
        reconciliationCycle: state.reconciliationCycle,
      }),
    }
  )
);
