import { useState, ReactNode } from 'react';
import { FileSpreadsheet, Download, Users, FileText, AlertTriangle, CheckCircle, Clock, Calendar, ChevronDown, Search, GitBranch, ShieldCheck, Send, BarChart3, ArrowUpDown, TrendingUp, TrendingDown } from 'lucide-react';
import { useReconciliationStore } from '@/store/useReconciliationStore';
import { ExportType, VersionComparison } from '@/../shared/types';

export default function ReportExport() {
  const { exportReport, reconciliationResults, currentPeriod, customers, products, batches, currentBatchId, compareVersions, getBatchVersions } =
    useReconciliationStore();
  const [selectedPeriod, setSelectedPeriod] = useState(currentPeriod);
  const [searchTerm, setSearchTerm] = useState('');
  const [exportingType, setExportingType] = useState<ExportType | null>(null);
  const [showCompare, setShowCompare] = useState(false);
  const [compareOldBatchId, setCompareOldBatchId] = useState('');
  const [compareNewBatchId, setCompareNewBatchId] = useState('');
  const [comparisonResults, setComparisonResults] = useState<VersionComparison[]>([]);

  const completedResults = reconciliationResults.filter((r) => r.status === 'completed');
  const pendingResults = reconciliationResults.filter((r) => r.status === 'pending');
  const partialResults = reconciliationResults.filter((r) => r.status === 'partial');

  const currentBatch = batches.find(b => b.id === currentBatchId);
  const batchVersions = currentBatchId ? getBatchVersions(currentBatchId) : [];

  const handleCompare = () => {
    if (!compareOldBatchId || !compareNewBatchId) return;
    const results = compareVersions(compareOldBatchId, compareNewBatchId);
    setComparisonResults(results);
  };

  const filteredComparisons = comparisonResults.filter(
    (c) => c.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalConfirmedAmount = reconciliationResults.reduce(
    (sum, r) => sum + r.confirmedAmount, 0);
  const totalReceivableAmount = reconciliationResults.reduce(
    (sum, r) => sum + r.receivableAmount, 0);
  const totalDiscrepancies = reconciliationResults.reduce(
    (sum, r) => sum + r.discrepancies.length, 0);
  const pendingDiscrepancies = reconciliationResults.reduce(
    (sum, r) => sum + r.discrepancies.filter((d) => d.status === 'pending').length, 0);

  const reportTypes: Array<{
    key: ExportType;
    label: string;
    icon: ReactNode;
    description: string;
    color: string;
    bgColor: string;
    borderColor: string;
  }> = [
    {
      key: 'customer_statement',
      label: '客户对账单',
      icon: <Users size={24} />,
      description: '为每个客户生成独立的对账单，包含调用明细、费用计算和差异说明',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    {
      key: 'internal_summary',
      label: '内部汇总表',
      icon: <FileText size={24} />,
      description: '按产品维度汇总的内部对账报表，包含各产品的调用量和收入统计',
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
    },
    {
      key: 'follow_up_list',
      label: '待跟进清单',
      icon: <AlertTriangle size={24} />,
      description: '需要跟进的客户和差异项清单，包含客户信息、联系人和差异金额',
      color: 'from-amber-500 to-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
    },
  ];

  const handleExport = async (type: ExportType) => {
    setExportingType(type);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    exportReport(type, selectedPeriod);
    setExportingType(null);
  };

  const filteredResults = reconciliationResults.filter(
    (r) =>
      r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.details.some((d) => d.productName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">报表导出</h1>
          <p className="text-navy-500 mt-1">导出客户对账单、内部汇总表和待跟进清单</p>
          {currentBatch && (
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-navy-500">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                <GitBranch size={12} /> 版本 V{currentBatch.version}
              </span>
              {currentBatch.submittedAt && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded">
                  <Send size={12} /> 提交人: {currentBatch.submittedBy}
                </span>
              )}
              {currentBatch.confirmedAt && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded">
                  <ShieldCheck size={12} /> 财务确认: {currentBatch.confirmedBy} · {new Date(currentBatch.confirmedAt).toLocaleDateString('zh-CN')}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <button
            className={`btn ${showCompare ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setShowCompare(!showCompare)}
          >
            <BarChart3 size={16} className="mr-2" />
            版本对比
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={18} className="text-emerald-500" />
            <p className="stat-label">对账完成</p>
          </div>
          <p className="stat-value text-emerald-600">{completedResults.length}</p>
          <p className="text-xs text-navy-400 mt-1">家客户</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={18} className="text-amber-500" />
            <p className="stat-label">待处理</p>
          </div>
          <p className="stat-value text-amber-600">{pendingResults.length}</p>
          <p className="text-xs text-navy-400 mt-1">家客户</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <FileText size={18} className="text-blue-500" />
            <p className="stat-label">确认金额</p>
          </div>
          <p className="stat-value text-blue-600">¥{totalConfirmedAmount.toLocaleString()}</p>
          <p className="text-xs text-navy-400 mt-1">
            应收 ¥{totalReceivableAmount.toLocaleString()}
          </p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={18} className="text-rose-500" />
            <p className="stat-label">待跟进差异</p>
          </div>
          <p className="stat-value text-rose-600">{pendingDiscrepancies}</p>
          <p className="text-xs text-navy-400 mt-1">共 {totalDiscrepancies} 条差异</p>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold text-navy-800 mb-6 flex items-center gap-2">
          <Calendar size={20} className="text-navy-600" />
          选择对账周期
        </h3>
        <div className="flex items-center gap-4">
          <div className="relative">
            <select
              className="input pr-10 appearance-none cursor-pointer"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
            >
              {['2026-12', '2026-11', '2026-10', '2026-09'].map((period) => (
                <option key={period} value={period}>
                  {period.replace('-', '年')}月
                </option>
              ))}
            </select>
            <ChevronDown
              size={18}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 pointer-events-none"
            />
          </div>
          <p className="text-sm text-navy-500">
            当前周期: <span className="font-semibold text-navy-700">{currentPeriod}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {reportTypes.map((report) => (
          <div
            key={report.key}
            className={`card p-6 ${report.bgColor} ${report.borderColor} border-2 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]`}
          >
            <div
              className={`w-14 h-14 rounded-xl bg-gradient-to-br ${report.color} flex items-center justify-center text-white mb-4 shadow-lg`}
            >
              {report.icon}
            </div>
            <h3 className="text-xl font-bold text-navy-800 mb-2">{report.label}</h3>
            <p className="text-sm text-navy-600 mb-6">{report.description}</p>

            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-navy-500">包含客户</span>
                <span className="font-semibold text-navy-700">
                  {report.key === 'follow_up_list'
                    ? pendingResults.length + partialResults.length
                    : customers.length}{' '}
                  家
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-navy-500">数据产品</span>
                <span className="font-semibold text-navy-700">{products.length} 个</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-navy-500">对账记录</span>
                <span className="font-semibold text-navy-700">
                  {reconciliationResults.length} 条
                </span>
              </div>
            </div>

            <button
              className={`w-full btn btn-primary justify-center bg-gradient-to-r ${report.color} border-transparent hover:opacity-90`}
              onClick={() => handleExport(report.key)}
              disabled={exportingType === report.key || reconciliationResults.length === 0}
            >
              {exportingType === report.key ? (
                <>
                  <Clock size={16} className="mr-2 animate-spin" />
                  导出中...
                </>
              ) : (
                <>
                  <Download size={16} className="mr-2" />
                  导出Excel
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      {reconciliationResults.length > 0 && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-navy-100">
            <h3 className="text-lg font-semibold text-navy-800 flex items-center gap-2">
              <FileSpreadsheet size={20} className="text-navy-600" />
              对账结果预览
            </h3>
            <div className="relative max-w-md">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
              <input
                type="text"
                placeholder="搜索客户或产品名称..."
                className="input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="table-container max-h-[400px] overflow-y-auto scrollbar-thin">
            <table className="table">
              <thead className="sticky top-0">
                <tr>
                  <th>客户名称</th>
                  <th>对账周期</th>
                  <th>调用次数</th>
                  <th>应收金额</th>
                  <th>已确认金额</th>
                  <th>差异金额</th>
                  <th>差异项</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100">
                {filteredResults.map((result) => (
                  <tr key={result.id}>
                    <td className="font-medium">{result.customerName}</td>
                    <td className="text-navy-500">{result.period}</td>
                    <td className="font-mono">{result.totalCalls.toLocaleString()}</td>
                    <td className="font-mono">¥{result.receivableAmount.toLocaleString()}</td>
                    <td className="font-mono text-emerald-600 font-semibold">
                      ¥{result.confirmedAmount.toLocaleString()}
                    </td>
                    <td
                      className={`font-mono font-semibold ${
                        result.differenceAmount > 0
                          ? 'text-rose-600'
                          : result.differenceAmount < 0
                          ? 'text-emerald-600'
                          : 'text-navy-600'
                      }`}
                    >
                      {result.differenceAmount > 0 ? '+' : ''}¥
                      {result.differenceAmount.toLocaleString()}
                    </td>
                    <td>
                      {result.discrepancies.length > 0 ? (
                        <span className="badge badge-danger">
                          {result.discrepancies.length} 条
                        </span>
                      ) : (
                        <span className="badge badge-success">无</span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-white ${
                          result.status === 'completed'
                            ? 'bg-emerald-500'
                            : result.status === 'partial'
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                      >
                        {result.status === 'completed'
                          ? '已完成'
                          : result.status === 'partial'
                          ? '部分处理'
                          : '待处理'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="sticky bottom-0 bg-navy-50">
                <tr>
                  <td colSpan={2} className="font-semibold text-navy-700">
                    合计
                  </td>
                  <td className="font-mono font-bold text-navy-800">
                    {reconciliationResults.reduce((sum, r) => sum + r.totalCalls, 0).toLocaleString()}
                  </td>
                  <td className="font-mono font-bold text-navy-800">
                    ¥{totalReceivableAmount.toLocaleString()}
                  </td>
                  <td className="font-mono font-bold text-emerald-600">
                    ¥{totalConfirmedAmount.toLocaleString()}
                  </td>
                  <td className="font-mono font-bold text-rose-600">
                    {totalReceivableAmount - totalConfirmedAmount > 0 ? '+' : ''}¥
                    {(totalReceivableAmount - totalConfirmedAmount).toLocaleString()}
                  </td>
                  <td className="font-mono font-bold text-navy-800">
                    {totalDiscrepancies} 条
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {showCompare && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-navy-100">
            <h3 className="text-lg font-semibold text-navy-800 flex items-center gap-2">
              <ArrowUpDown size={20} className="text-navy-600" />
              历史版本对比
            </h3>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-navy-500">旧版本</span>
                <select
                  className="input text-sm py-1.5"
                  value={compareOldBatchId}
                  onChange={(e) => setCompareOldBatchId(e.target.value)}
                >
                  <option value="">请选择</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} (V{b.version})
                    </option>
                  ))}
                </select>
              </div>
              <span className="text-navy-400">→</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-navy-500">新版本</span>
                <select
                  className="input text-sm py-1.5"
                  value={compareNewBatchId}
                  onChange={(e) => setCompareNewBatchId(e.target.value)}
                >
                  <option value="">请选择</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} (V{b.version})
                    </option>
                  ))}
                </select>
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleCompare}
                disabled={!compareOldBatchId || !compareNewBatchId}
              >
                开始对比
              </button>
            </div>
          </div>

          {comparisonResults.length > 0 && (
            <div className="table-container max-h-[400px] overflow-y-auto scrollbar-thin">
              <table className="table">
                <thead className="sticky top-0">
                  <tr>
                    <th>客户名称</th>
                    <th className="text-right">调用量变化</th>
                    <th className="text-right">应收金额变化</th>
                    <th className="text-right">确认金额变化</th>
                    <th className="text-right">差异金额变化</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-100">
                  {filteredComparisons.map((comp) => (
                    <tr key={comp.customerId}>
                      <td className="font-medium">{comp.customerName}</td>
                      <td className="text-right font-mono">
                        <span className={`inline-flex items-center gap-1 ${comp.callDiff > 0 ? 'text-rose-600' : comp.callDiff < 0 ? 'text-emerald-600' : 'text-navy-600'}`}>
                          {comp.callDiff > 0 ? <TrendingUp size={14} /> : comp.callDiff < 0 ? <TrendingDown size={14} /> : null}
                          {comp.callDiff > 0 ? '+' : ''}{comp.callDiff.toLocaleString()}
                        </span>
                      </td>
                      <td className="text-right font-mono">
                        <span className={`inline-flex items-center gap-1 ${comp.receivableDiff > 0 ? 'text-rose-600' : comp.receivableDiff < 0 ? 'text-emerald-600' : 'text-navy-600'}`}>
                          {comp.receivableDiff > 0 ? <TrendingUp size={14} /> : comp.receivableDiff < 0 ? <TrendingDown size={14} /> : null}
                          {comp.receivableDiff > 0 ? '+' : ''}¥{comp.receivableDiff.toLocaleString()}
                        </span>
                      </td>
                      <td className="text-right font-mono font-semibold">
                        <span className={`inline-flex items-center gap-1 ${comp.confirmedDiff > 0 ? 'text-rose-600' : comp.confirmedDiff < 0 ? 'text-emerald-600' : 'text-navy-600'}`}>
                          {comp.confirmedDiff > 0 ? <TrendingUp size={14} /> : comp.confirmedDiff < 0 ? <TrendingDown size={14} /> : null}
                          {comp.confirmedDiff > 0 ? '+' : ''}¥{comp.confirmedDiff.toLocaleString()}
                        </span>
                      </td>
                      <td className="text-right font-mono">
                        <span className={`inline-flex items-center gap-1 ${comp.differenceDiff > 0 ? 'text-rose-600' : comp.differenceDiff < 0 ? 'text-emerald-600' : 'text-navy-600'}`}>
                          {comp.differenceDiff > 0 ? <TrendingUp size={14} /> : comp.differenceDiff < 0 ? <TrendingDown size={14} /> : null}
                          {comp.differenceDiff > 0 ? '+' : ''}¥{comp.differenceDiff.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="sticky bottom-0 bg-navy-50">
                  <tr>
                    <td className="font-semibold text-navy-700">合计变化</td>
                    <td className="text-right font-mono font-bold text-navy-800">
                      {comparisonResults.reduce((sum, c) => sum + c.callDiff, 0).toLocaleString()}
                    </td>
                    <td className="text-right font-mono font-bold text-navy-800">
                      ¥{comparisonResults.reduce((sum, c) => sum + c.receivableDiff, 0).toLocaleString()}
                    </td>
                    <td className="text-right font-mono font-bold text-emerald-600">
                      ¥{comparisonResults.reduce((sum, c) => sum + c.confirmedDiff, 0).toLocaleString()}
                    </td>
                    <td className="text-right font-mono font-bold text-rose-600">
                      ¥{comparisonResults.reduce((sum, c) => sum + c.differenceDiff, 0).toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {comparisonResults.length === 0 && compareOldBatchId && compareNewBatchId && (
            <div className="p-8 text-center text-navy-500">
              点击"开始对比"查看两版本的差异
            </div>
          )}
        </div>
      )}

      <div className="card p-6 bg-gradient-to-r from-navy-800 to-navy-900 text-white">
        <h3 className="text-lg font-semibold mb-4">导出说明</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div>
            <h4 className="font-medium text-emerald-400 mb-2">客户对账单</h4>
            <ul className="space-y-1 text-navy-200">
              <li>• 每个客户一个独立Sheet</li>
              <li>• 包含调用明细和费用计算</li>
              <li>• 列出所有差异项及处理状态</li>
              <li>• 可直接发送给客户确认</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-blue-400 mb-2">内部汇总表</h4>
            <ul className="space-y-1 text-navy-200">
              <li>• 按产品维度统计调用量</li>
              <li>• 按客户维度统计应收金额</li>
              <li>• 包含退款和调整项汇总</li>
              <li>• 用于内部财务核算</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-amber-400 mb-2">待跟进清单</h4>
            <ul className="space-y-1 text-navy-200">
              <li>• 列出所有待处理差异客户</li>
              <li>• 包含客户联系人信息</li>
              <li>• 标注差异金额和类型</li>
              <li>• 方便运营人员跟进</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
