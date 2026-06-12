import {
  DataProduct,
  Customer,
  CallRecord,
  RefundRecord,
  AdjustmentRecord,
  ReconciliationCycle,
} from '@/../shared/types';

export const mockProducts: DataProduct[] = [
  {
    id: 'prod-001',
    name: '企业征信查询API',
    code: 'API-CREDIT-001',
    description: '提供企业征信报告查询服务，包含基本工商信息、司法信息、经营信息等',
    billingType: 'per_call',
    unitPrice: 5.0,
    status: 'active',
    createdAt: '2026-01-15',
  },
  {
    id: 'prod-002',
    name: '个人身份核验服务',
    code: 'API-IDENTITY-002',
    description: '提供个人身份信息核验、手机号实名认证等服务',
    billingType: 'per_call',
    unitPrice: 0.8,
    status: 'active',
    createdAt: '2026-01-20',
  },
  {
    id: 'prod-003',
    name: '车辆信息查询包年服务',
    code: 'API-VIP-003',
    description: '车辆信息查询包年服务，不限调用次数',
    billingType: 'monthly',
    unitPrice: 0,
    monthlyFee: 5000,
    status: 'active',
    createdAt: '2026-02-01',
  },
  {
    id: 'prod-004',
    name: '地理位置逆编码',
    code: 'API-GEO-004',
    description: '经纬度逆地理编码服务，支持批量查询',
    billingType: 'tiered',
    unitPrice: 0.3,
    tierPrices: [
      { minCalls: 0, maxCalls: 10000, unitPrice: 0.3 },
      { minCalls: 10001, maxCalls: 50000, unitPrice: 0.25 },
      { minCalls: 50001, maxCalls: 100000, unitPrice: 0.2 },
      { minCalls: 100001, maxCalls: 999999999, unitPrice: 0.15 },
    ],
    status: 'active',
    createdAt: '2026-02-10',
  },
  {
    id: 'prod-005',
    name: '企业财务数据分析',
    code: 'API-FINANCE-005',
    description: '企业财务数据分析报告，包含财务健康度评估',
    billingType: 'per_call',
    unitPrice: 50.0,
    status: 'active',
    createdAt: '2026-03-01',
  },
];

export const mockCustomers: Customer[] = [
  {
    id: 'cust-001',
    name: '中国工商银行股份有限公司',
    contact: '张经理',
    email: 'zhang.manager@icbc.com.cn',
    phone: '13800138001',
    status: 'active',
    createdAt: '2026-01-15',
    authorizedProducts: [
      {
        id: 'auth-001',
        productId: 'prod-001',
        productName: '企业征信查询API',
        startDate: '2026-05-01',
        endDate: '2027-04-30',
        maxCallsPerMonth: 5000,
        pricingType: 'discount',
        discountRate: 0.9,
      },
      {
        id: 'auth-002',
        productId: 'prod-002',
        productName: '个人身份核验服务',
        startDate: '2026-05-01',
        endDate: '2027-04-30',
        maxCallsPerMonth: 50000,
        pricingType: 'standard',
      },
    ],
  },
  {
    id: 'cust-002',
    name: '阿里巴巴集团控股有限公司',
    contact: '李总监',
    email: 'li.zongjian@alibaba.com',
    phone: '13900139002',
    status: 'active',
    createdAt: '2026-02-01',
    authorizedProducts: [
      {
        id: 'auth-003',
        productId: 'prod-001',
        productName: '企业征信查询API',
        startDate: '2026-05-01',
        endDate: '2026-12-31',
        maxCallsPerMonth: 20000,
        pricingType: 'discount',
        discountRate: 0.85,
      },
      {
        id: 'auth-004',
        productId: 'prod-004',
        productName: '地理位置逆编码',
        startDate: '2026-05-01',
        endDate: '2027-04-30',
        maxCallsPerMonth: 200000,
        pricingType: 'standard',
      },
    ],
  },
  {
    id: 'cust-003',
    name: '腾讯科技(深圳)有限公司',
    contact: '王主管',
    email: 'wang.zhuguan@tencent.com',
    phone: '13700137003',
    status: 'active',
    createdAt: '2026-02-15',
    authorizedProducts: [
      {
        id: 'auth-005',
        productId: 'prod-002',
        productName: '个人身份核验服务',
        startDate: '2026-05-01',
        endDate: '2027-04-30',
        maxCallsPerMonth: 100000,
        pricingType: 'discount',
        discountRate: 0.88,
      },
      {
        id: 'auth-006',
        productId: 'prod-003',
        productName: '车辆信息查询包年服务',
        startDate: '2026-05-01',
        endDate: '2027-04-30',
        pricingType: 'standard',
      },
    ],
  },
  {
    id: 'cust-004',
    name: '北京字节跳动科技有限公司',
    contact: '赵经理',
    email: 'zhao.jingli@bytedance.com',
    phone: '13600136004',
    status: 'active',
    createdAt: '2026-03-10',
    authorizedProducts: [
      {
        id: 'auth-007',
        productId: 'prod-004',
        productName: '地理位置逆编码',
        startDate: '2026-06-01',
        endDate: '2026-08-31',
        maxCallsPerMonth: 50000,
        pricingType: 'free_trial',
      },
      {
        id: 'auth-008',
        productId: 'prod-005',
        productName: '企业财务数据分析',
        startDate: '2026-05-01',
        endDate: '2027-04-30',
        maxCallsPerMonth: 500,
        pricingType: 'standard',
      },
    ],
  },
  {
    id: 'cust-005',
    name: '京东科技集团',
    contact: '孙经理',
    email: 'sun.jingli@jd.com',
    phone: '13500135005',
    status: 'active',
    createdAt: '2026-03-20',
    authorizedProducts: [
      {
        id: 'auth-009',
        productId: 'prod-001',
        productName: '企业征信查询API',
        startDate: '2026-05-01',
        endDate: '2027-04-30',
        maxCallsPerMonth: 8000,
        pricingType: 'standard',
      },
      {
        id: 'auth-010',
        productId: 'prod-005',
        productName: '企业财务数据分析',
        startDate: '2026-05-01',
        endDate: '2027-04-30',
        maxCallsPerMonth: 200,
        pricingType: 'discount',
        discountRate: 0.95,
      },
    ],
  },
];

const generateCallRecords = (): CallRecord[] => {
  const records: CallRecord[] = [];
  let id = 1;

  const customerProductCalls = [
    { customerId: 'cust-001', customerName: '中国工商银行股份有限公司', productId: 'prod-001', productName: '企业征信查询API', days: 31, avgDaily: 150 },
    { customerId: 'cust-001', customerName: '中国工商银行股份有限公司', productId: 'prod-002', productName: '个人身份核验服务', days: 31, avgDaily: 1500 },
    { customerId: 'cust-002', customerName: '阿里巴巴集团控股有限公司', productId: 'prod-001', productName: '企业征信查询API', days: 31, avgDaily: 600 },
    { customerId: 'cust-002', customerName: '阿里巴巴集团控股有限公司', productId: 'prod-004', productName: '地理位置逆编码', days: 31, avgDaily: 5000 },
    { customerId: 'cust-003', customerName: '腾讯科技(深圳)有限公司', productId: 'prod-002', productName: '个人身份核验服务', days: 31, avgDaily: 3000 },
    { customerId: 'cust-003', customerName: '腾讯科技(深圳)有限公司', productId: 'prod-003', productName: '车辆信息查询包年服务', days: 31, avgDaily: 800 },
    { customerId: 'cust-004', customerName: '北京字节跳动科技有限公司', productId: 'prod-004', productName: '地理位置逆编码', days: 30, avgDaily: 1200 },
    { customerId: 'cust-004', customerName: '北京字节跳动科技有限公司', productId: 'prod-005', productName: '企业财务数据分析', days: 25, avgDaily: 15 },
    { customerId: 'cust-005', customerName: '京东科技集团', productId: 'prod-001', productName: '企业征信查询API', days: 31, avgDaily: 250 },
    { customerId: 'cust-005', customerName: '京东科技集团', productId: 'prod-005', productName: '企业财务数据分析', days: 20, avgDaily: 8 },
  ];

  customerProductCalls.forEach((config) => {
    for (let day = 1; day <= config.days; day++) {
      const callCount = Math.floor(config.avgDaily * (0.7 + Math.random() * 0.6));
      records.push({
        id: `call-${String(id).padStart(6, '0')}`,
        customerId: config.customerId,
        customerName: config.customerName,
        productId: config.productId,
        productName: config.productName,
        callTime: `2026-05-${String(day).padStart(2, '0')} ${String(9 + Math.floor(Math.random() * 10)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`,
        callCount,
        isDuplicate: Math.random() < 0.02,
        isOverAuthorized: false,
      });
      id++;
    }
  });

  if (records.length > 45) records[45].isDuplicate = true;
  if (records.length > 120) records[120].isDuplicate = true;
  if (records.length > 200) records[200].isOverAuthorized = true;
  if (records.length > 350) records[350].isOverAuthorized = true;

  return records;
};

export const mockCallRecords: CallRecord[] = generateCallRecords();

export const mockRefundRecords: RefundRecord[] = [
  {
    id: 'refund-001',
    customerId: 'cust-001',
    customerName: '中国工商银行股份有限公司',
    productId: 'prod-001',
    productName: '企业征信查询API',
    amount: 500.0,
    reason: '5月10日接口异常导致查询失败，共100次调用',
    refundDate: '2026-05-15',
    status: 'approved',
  },
  {
    id: 'refund-002',
    customerId: 'cust-002',
    customerName: '阿里巴巴集团控股有限公司',
    productId: 'prod-004',
    productName: '地理位置逆编码',
    amount: 1250.0,
    reason: '5月20日批量查询返回数据格式错误，共5000次调用',
    refundDate: '2026-05-25',
    status: 'approved',
  },
  {
    id: 'refund-003',
    customerId: 'cust-005',
    customerName: '京东科技集团',
    productId: 'prod-001',
    productName: '企业征信查询API',
    amount: 250.0,
    reason: '客户反馈重复扣款，已核实',
    refundDate: '2026-05-28',
    status: 'pending',
  },
];

export const mockAdjustmentRecords: AdjustmentRecord[] = [
  {
    id: 'adj-001',
    customerId: 'cust-002',
    customerName: '阿里巴巴集团控股有限公司',
    amount: 3000.0,
    type: 'deduction',
    reason: '季度客户折扣优惠',
    operator: '运营-刘经理',
    createdAt: '2026-05-31',
  },
  {
    id: 'adj-002',
    customerId: 'cust-003',
    customerName: '腾讯科技(深圳)有限公司',
    amount: 1500.0,
    type: 'addition',
    reason: '4月账期遗漏的增值服务费，调整至5月',
    operator: '财务-陈会计',
    createdAt: '2026-05-30',
  },
  {
    id: 'adj-003',
    customerId: 'cust-001',
    customerName: '中国工商银行股份有限公司',
    amount: 800.0,
    type: 'deduction',
    reason: '战略客户额外折扣',
    operator: '运营-王总监',
    createdAt: '2026-05-31',
  },
];

export const mockReconciliationCycle: ReconciliationCycle = {
  id: 'cycle-001',
  name: '月度对账',
  cycleType: 'monthly',
  startDay: 1,
  endDay: 31,
  excludeHolidays: true,
  holidays: ['2026-05-01', '2026-05-02', '2026-05-03', '2026-05-04', '2026-05-05'],
  createdAt: '2026-01-01',
};

export const generateId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const getCurrentPeriod = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};
