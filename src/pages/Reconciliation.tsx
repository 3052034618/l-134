import { useState } from 'react';
import { Calculator, CheckCircle, AlertTriangle, TrendingUp, TrendingDown, ChevronDown, ChevronRight, RefreshCw, Play, Search, FileText, Plus, Layers, Clock, Users } from 'lucide-react';
import { useReconciliationStore } from '@/store/useReconciliationStore';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/Modal';

export default function Reconciliation() {
  const {
    reconciliationResults,
    runReconciliation,
    currentPeriod,
    isReconciling,
    customers,
    products,
    batches,
    currentBatchId,
    customerProgress,
    createBatch,
    setCurrentBatch,
    updateBatchStatus,
  } = useReconciliationStore();
  const [expandedResult, setExpandedResult] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [newBatchPeriod, setNewBatchPeriod] = useState(currentPeriod);
  const [newBatchName, setNewBatchName] = useState('');
  const [newBatchRemark, setNewBatchRemark] = useState('');
  const [viewMode, setViewMode] = useState<'reconciliation' | 'batch'>('reconciliation');

  const totalReceivable = reconciliationResults.reduce((sum, r) => sum + r.receivableAmount, 0);
  const totalConfirmed = reconciliationResults.reduce((sum, r) => sum + r.confirmedAmount, 0);
  const totalDifference = reconciliationResults.reduce((sum, r) => sum + r.differenceAmount, 0);
  const pendingCount = reconciliationResults.filter((r) => r.status === 'pending').length;

  const currentBatch = batches.find(b => b.id === currentBatchId);
  const batchProgress = currentBatchId ? customerProgress.filter(p => p.batchId === currentBatchId) : [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'exported':
        return 'bg-emerald-500';
      case 'partial':
      case 'pending_resolution':
        return 'bg-amber-500';
      case 'pending':
      case 'fetched':
      case 'reconciled':
        return 'bg-rose-500';
      default:
        return 'bg-navy-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '对账完成';
      case 'partial':
        return '部分处理';
      case 'pending':
        return '待处理';
      case 'not_started':
        return '未开始';
      case 'fetched':
        return '已拉取';
      case 'reconciled':
        return '已核对';
      case 'pending_resolution':
        return '待处理差异';
      case 'exported':
        return '已导出';
      default:
        return '未知';
    }
  };

  const filteredResults = reconciliationResults.filter(
    (r) =>
      r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.details.some((d) => d.productName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredProgress = batchProgress.filter(
    (p) => p.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateBatch = () => {
    if (!newBatchName.trim()) return;
    createBatch(newBatchPeriod, newBatchName.trim(), newBatchRemark.trim() || undefined);
    setShowBatchModal(false);
    setNewBatchName('');
    setNewBatchRemark('');
  };

  const progressStats = {
    notStarted: batchProgress.filter(p => p.status === 'not_started').length,
    fetched: batchProgress.filter(p => p.status === 'fetched').length,
    reconciled: batchProgress.filter(p => p.status === 'reconciled').length,
    pendingResolution: batchProgress.filter(p => p.status === 'pending_resolution').length,
    exported: batchProgress.filter(p => p.status === 'exported').length,
  };

  const renderBatchView = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} className="text-navy-500" />
            <p className="stat-label">未开始</p>
          </div>
          <p className="stat-value text-navy-600">{progressStats.notStarted}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <FileText size={16} className="text-blue-500" />
            <p className="stat-label">已拉取</p>
          </div>
          <p className="stat-value text-blue-600">{progressStats.fetched}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <Calculator size={16} className="text-emerald-500" />
            <p className="stat-label">已核对</p>
          </div>
          <p className="stat-value text-emerald-600">{progressStats.reconciled}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-amber-500" />
            <p className="stat-label">待处理差异</p>
          </div>
          <p className="stat-value text-amber-600">{progressStats.pendingResolution}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={16} className="text-green-500" />
            <p className="stat-label">已导出</p>
          </div>
          <p className="stat-value text-green-600">{progressStats.exported}</p>
        </div>
      </div>

      {batchProgress.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-navy-800 flex items-center gap-2">
              <Users size={20} className="text-navy-600" />
              客户对账进度
            </h3>
            <div className="relative max-w-md">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
              <input
                type="text"
                placeholder="搜索客户名称..."
                className="input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>客户名称</th>
                  <th>数据拉取</th>
                  <th>对账计算</th>
                  <th>差异处理</th>
                  <th>报表导出</th>
                  <th>整体进度</th>
                  <th>最后更新</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100">
                {filteredProgress.map((progress) => {
                  const steps = [
                    { done: progress.callsFetched && progress.refundsFetched && progress.adjustmentsFetched, label: '数据拉取' },
                    { done: progress.reconciled, label: '对账计算' },
                    { done: progress.discrepanciesResolved, label: '差异处理' },
                    { done: progress.exported, label: '报表导出' },
                  ];
                  const doneCount = steps.filter(s => s.done).length;
                  const progressPct = (doneCount / steps.length) * 100;

                  return (
                    <tr key={progress.customerId}>
                      <td className="font-medium">{progress.customerName}</td>
                      <td className="text-center">
                        {(progress.callsFetched && progress.refundsFetched && progress.adjustmentsFetched) ? (
                          <CheckCircle size={18} className="text-emerald-500 mx-auto" />
                        ) : (
                          <Clock size={18} className="text-navy-300 mx-auto" />
                        )}
                      </td>
                      <td className="text-center">
                        {progress.reconciled ? (
                          <CheckCircle size={18} className="text-emerald-500 mx-auto" />
                        ) : (
                          <Clock size={18} className="text-navy-300 mx-auto" />
                        )}
                      </td>
                      <td className="text-center">
                        {progress.discrepanciesResolved ? (
                          <CheckCircle size={18} className="text-emerald-500 mx-auto" />
                        ) : (
                          <AlertTriangle size={18} className="text-amber-400 mx-auto" />
                        )}
                      </td>
                      <td className="text-center">
                        {progress.exported ? (
                          <CheckCircle size={18} className="text-emerald-500 mx-auto" />
                        ) : (
                          <Clock size={18} className="text-navy-300 mx-auto" />
                        )}
                      </td>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-navy-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-500"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white ${getStatusColor(progress.status)}`}
                          >
                            {getStatusText(progress.status)}
                          </span>
                        </div>
                      </td>
                      <td className="text-sm text-navy-500">
                        {new Date(progress.lastUpdated).toLocaleString('zh-CN')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const renderReconciliationView = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={18} className="text-emerald-500" />
            <p className="stat-label">应收总金额</p>
          </div>
          <p className="stat-value text-emerald-600">¥{totalReceivable.toLocaleString()}</p>
          <p className="text-xs text-navy-400 mt-1">
            {customers.length} 个客户
          </p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={18} className="text-blue-500" />
            <p className="stat-label">已确认金额</p>
          </div>
          <p className="stat-value text-blue-600">¥{totalConfirmed.toLocaleString()}</p>
          <p className="text-xs text-navy-400 mt-1">
            {reconciliationResults.filter((r) => r.status === 'completed').length} 家已完成
          </p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={18} className="text-amber-500" />
            <p className="stat-label">差异总金额</p>
          </div>
          <p className="stat-value text-amber-600">¥{totalDifference.toLocaleString()}</p>
          <p className="text-xs text-navy-400 mt-1">
            {reconciliationResults.reduce((sum, r) => sum + r.discrepancies.length, 0)} 条差异
          </p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={18} className="text-rose-500" />
            <p className="stat-label">待处理客户</p>
          </div>
          <p className="stat-value text-rose-600">{pendingCount}</p>
          <p className="text-xs text-navy-400 mt-1">需要人工介入</p>
        </div>
      </div>

      {reconciliationResults.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-navy-800 flex items-center gap-2">
              <FileText size={20} className="text-navy-600" />
              客户对账明细
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

          <div className="space-y-3">
            {filteredResults.map((result) => (
              <div
                key={result.id}
                className="border border-navy-100 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg"
              >
                <button
                  onClick={() =>
                    setExpandedResult(expandedResult === result.id ? null : result.id)
                  }
                  className="w-full p-4 hover:bg-navy-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {expandedResult === result.id ? (
                        <ChevronDown size={20} className="text-navy-400 flex-shrink-0" />
                      ) : (
                        <ChevronRight size={20} className="text-navy-400 flex-shrink-0" />
                      )}
                      <div className="text-left">
                        <p className="font-semibold text-navy-800">{result.customerName}</p>
                        <p className="text-xs text-navy-500">{result.period}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <p className="text-xs text-navy-500">调用次数</p>
                        <p className="font-semibold font-mono text-navy-800">
                          {result.totalCalls.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-navy-500">应收金额</p>
                        <p className="font-semibold font-mono text-navy-800">
                          ¥{result.receivableAmount.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-navy-500">已确认</p>
                        <p className="font-semibold font-mono text-emerald-600">
                          ¥{result.confirmedAmount.toLocaleString()}
                        </p>
                      </div>
                      {result.differenceAmount !== 0 && (
                        <div className="text-right">
                          <p className="text-xs text-navy-500">差异</p>
                          <p
                            className={`font-semibold font-mono ${
                              result.differenceAmount > 0 ? 'text-rose-600' : 'text-emerald-600'
                            }`}
                          >
                            {result.differenceAmount > 0 ? '+' : ''}¥
                            {result.differenceAmount.toLocaleString()}
                          </p>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        {result.discrepancies.length > 0 && (
                          <span className="badge badge-danger">
                            {result.discrepancies.length} 条差异
                          </span>
                        )}
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(
                            result.status
                          )}`}
                        >
                          {getStatusText(result.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>

                {expandedResult === result.id && (
                  <div className="border-t border-navy-100 bg-navy-50 p-6 space-y-6">
                    <div>
                      <h4 className="text-sm font-semibold text-navy-800 mb-3">产品明细</h4>
                      <div className="table-container">
                        <table className="table">
                          <thead>
                            <tr>
                              <th>产品名称</th>
                              <th>计费方式</th>
                              <th>调用次数</th>
                              <th>单价</th>
                              <th>折扣</th>
                              <th>应收金额</th>
                              <th>确认状态</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-navy-100">
                            {result.details.map((detail, idx) => (
                              <tr key={idx}>
                                <td className="font-medium">{detail.productName}</td>
                                <td>
                                  <span className="badge badge-info">
                                    {detail.billingType === 'per_call'
                                      ? '按次'
                                      : detail.billingType === 'monthly'
                                      ? '包月'
                                      : '阶梯'}
                                  </span>
                                </td>
                                <td className="font-mono">
                                  {detail.callCount.toLocaleString()}
                                </td>
                                <td className="font-mono">¥{detail.unitPrice}</td>
                                <td className="font-mono">
                                  {detail.discountRate
                                    ? `${(detail.discountRate * 100).toFixed(0)}%`
                                    : '-'}
                                </td>
                                <td className="font-mono font-semibold">
                                  ¥{detail.receivableAmount.toLocaleString()}
                                </td>
                                <td>
                                  <StatusBadge
                                    status={detail.isConfirmed ? 'success' : 'pending'}
                                    size="sm"
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="bg-navy-100">
                              <td colSpan={5} className="text-right font-semibold">
                                合计
                              </td>
                              <td className="font-mono font-bold">
                                ¥{result.receivableAmount.toLocaleString()}
                              </td>
                              <td></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>

                    {result.discrepancies.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-navy-800 mb-3 flex items-center gap-2">
                          <AlertTriangle size={16} className="text-amber-500" />
                          差异项
                        </h4>
                        <div className="space-y-2">
                          {result.discrepancies.map((disc, idx) => (
                            <div
                              key={idx}
                              className={`p-3 rounded-lg border ${
                                disc.status === 'resolved'
                                  ? 'border-emerald-200 bg-emerald-50'
                                  : 'border-amber-200 bg-amber-50'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <span
                                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                                      disc.type === 'duplicate_call'
                                        ? 'bg-rose-100 text-rose-700'
                                        : disc.type === 'over_authorized'
                                        ? 'bg-amber-100 text-amber-700'
                                        : disc.type === 'free_trial'
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : disc.type === 'period_adjustment'
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-navy-100 text-navy-700'
                                    }`}
                                  >
                                    {disc.type === 'duplicate_call'
                                      ? '重复调用'
                                      : disc.type === 'over_authorized'
                                      ? '超授权调用'
                                      : disc.type === 'free_trial'
                                      ? '免费试用'
                                      : disc.type === 'period_adjustment'
                                      ? '账期调整'
                                      : '其他'}
                                  </span>
                                  <p className="text-sm text-navy-800">{disc.description}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                  <span
                                    className={`font-mono font-semibold ${
                                      disc.amount > 0 ? 'text-rose-600' : 'text-emerald-600'
                                    }`}
                                  >
                                    {disc.amount > 0 ? '+' : ''}¥{disc.amount.toLocaleString()}
                                  </span>
                                  <StatusBadge
                                    status={disc.status === 'resolved' ? 'success' : 'pending'}
                                    size="sm"
                                  />
                                </div>
                              </div>
                              {disc.resolution && (
                                <p className="text-xs text-emerald-700 mt-2">
                                  处理结果: {disc.resolution}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-navy-200">
                      <div className="p-4 rounded-lg bg-white border border-navy-100">
                        <p className="text-xs text-navy-500 mb-1">退款调整</p>
                        <p className="text-lg font-semibold font-mono text-rose-600">
                          -¥{result.refundAdjustment.toLocaleString()}
                        </p>
                      </div>
                      <div className="p-4 rounded-lg bg-white border border-navy-100">
                        <p className="text-xs text-navy-500 mb-1">人工调整</p>
                        <p
                          className={`text-lg font-semibold font-mono ${
                            result.manualAdjustment >= 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {result.manualAdjustment >= 0 ? '+' : ''}¥
                          {result.manualAdjustment.toLocaleString()}
                        </p>
                      </div>
                      <div className="p-4 rounded-lg bg-white border border-navy-100">
                        <p className="text-xs text-navy-500 mb-1">最终确认金额</p>
                        <p className="text-lg font-bold font-mono text-navy-800">
                          ¥{result.confirmedAmount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {reconciliationResults.length === 0 && (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-navy-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calculator size={32} className="text-navy-400" />
          </div>
          <h3 className="text-lg font-semibold text-navy-800 mb-2">暂无对账结果</h3>
          <p className="text-navy-500 mb-6">点击"开始对账"按钮，生成本周期的对账结果</p>
          <button className="btn btn-primary" onClick={() => runReconciliation()}>
            <Play size={16} className="mr-2" />
            开始对账
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">对账核对</h1>
          <p className="text-navy-500 mt-1">
            对账周期: <span className="font-semibold text-navy-700">{currentPeriod}</span>
            {currentBatch && (
              <span className="ml-4">
                当前批次: <span className="font-semibold text-blue-600">{currentBatch.name}</span>
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-3">
          <div className="flex bg-navy-50 rounded-lg p-1">
            <button
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'batch' ? 'bg-white text-navy-800 shadow-sm' : 'text-navy-500 hover:text-navy-700'
              }`}
              onClick={() => setViewMode('batch')}
            >
              <Layers size={14} className="inline mr-1" /> 批次进度
            </button>
            <button
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'reconciliation' ? 'bg-white text-navy-800 shadow-sm' : 'text-navy-500 hover:text-navy-700'
              }`}
              onClick={() => setViewMode('reconciliation')}
            >
              <Calculator size={14} className="inline mr-1" /> 对账详情
            </button>
          </div>
          <button className="btn btn-secondary" onClick={() => setShowBatchModal(true)}>
            <Plus size={16} className="mr-2" />
            新建批次
          </button>
          <button className="btn btn-secondary" onClick={() => runReconciliation()}>
            <RefreshCw size={16} className="mr-2" />
            重新计算
          </button>
          <button
            className="btn btn-primary"
            onClick={() => runReconciliation()}
            disabled={isReconciling}
          >
            {isReconciling ? (
              <>
                <RefreshCw size={16} className="mr-2 animate-spin" />
                计算中...
              </>
            ) : (
              <>
                <Calculator size={16} className="mr-2" />
                开始对账
              </>
            )}
          </button>
        </div>
      </div>

      {batches.length > 0 && (
        <div className="card p-4">
          <div className="flex items-center gap-4 overflow-x-auto scrollbar-thin">
            <span className="text-sm font-medium text-navy-600 flex-shrink-0">切换批次:</span>
            <div className="flex gap-2">
              {batches.map((batch) => (
                <button
                  key={batch.id}
                  onClick={() => setCurrentBatch(batch.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    currentBatchId === batch.id
                      ? 'bg-navy-800 text-white shadow-md'
                      : 'bg-navy-50 text-navy-600 hover:bg-navy-100'
                  }`}
                >
                  {batch.name}
                  <span className="ml-2 text-xs opacity-70">
                    ({batch.period})
                  </span>
                  <span className={`ml-2 inline-block w-2 h-2 rounded-full ${
                    batch.status === 'completed' ? 'bg-emerald-400' :
                    batch.status === 'in_progress' ? 'bg-blue-400' :
                    batch.status === 'closed' ? 'bg-navy-400' : 'bg-amber-400'
                  }`} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {viewMode === 'reconciliation' ? renderReconciliationView() : renderBatchView()}

      <Modal
        isOpen={showBatchModal}
        onClose={() => setShowBatchModal(false)}
        title="新建对账批次"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">
              对账周期
            </label>
            <input
              type="text"
              className="input"
              value={newBatchPeriod}
              onChange={(e) => setNewBatchPeriod(e.target.value)}
              placeholder="YYYY-MM"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">
              批次名称 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              className="input"
              value={newBatchName}
              onChange={(e) => setNewBatchName(e.target.value)}
              placeholder="例如：2026年5月第一批对账"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">
              备注说明
            </label>
            <textarea
              className="input min-h-[80px]"
              value={newBatchRemark}
              onChange={(e) => setNewBatchRemark(e.target.value)}
              placeholder="可选：备注本次对账的说明..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-navy-100">
            <button
              className="btn btn-secondary"
              onClick={() => setShowBatchModal(false)}
            >
              取消
            </button>
            <button
              className="btn btn-primary"
              onClick={handleCreateBatch}
              disabled={!newBatchName.trim()}
            >
              创建批次
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
