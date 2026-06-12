import { useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, Search, Filter, ChevronDown, ChevronRight, Copy, Shield, Gift, Calendar, AlertCircle } from 'lucide-react';
import { useReconciliationStore } from '@/store/useReconciliationStore';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/Modal';

export default function DiscrepancyHandling() {
  const {
    reconciliationResults,
    resolveDiscrepancy,
    waiveDiscrepancy,
    markDiscrepancyAsFreeTrial,
    applyPeriodAdjustment,
  } = useReconciliationStore();
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedResult, setExpandedResult] = useState<string | null>(null);
  const [resolveModal, setResolveModal] = useState<{
    isOpen: boolean; resultId: string; discrepancyId: string }>({
    isOpen: false, resultId: '', discrepancyId: '' });
  const [resolutionType, setResolutionType] = useState<string>('');
  const [resolutionNote, setResolutionNote] = useState('');
  const [adjustmentAmount, setAdjustmentAmount] = useState('');

  const allDiscrepancies = reconciliationResults.flatMap((result) =>
    result.discrepancies.map((disc) => ({
      ...disc,
      resultId: result.id,
      customerName: result.customerName,
      period: result.period,
    }))
  );

  const pendingDiscrepancies = allDiscrepancies.filter((d) => d.status === 'pending');
  const resolvedDiscrepancies = allDiscrepancies.filter((d) => d.status === 'resolved');

  const filteredResults = reconciliationResults
    .filter((r) => {
      if (activeFilter === 'pending') {
        return r.discrepancies.some((d) => d.status === 'pending');
      }
      if (activeFilter === 'resolved') {
        return r.discrepancies.some((d) => d.status === 'resolved');
      }
      return r.discrepancies.length > 0;
    })
    .filter(
      (r) =>
        r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.details.some((d) => d.productName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

  const getDiscrepancyTypeInfo = (type: string) => {
    switch (type) {
      case 'duplicate_call':
        return { label: '重复调用', icon: <Copy size={16} />, color: 'bg-rose-500' };
      case 'over_authorized':
        return { label: '超授权调用', icon: <Shield size={16} />, color: 'bg-amber-500' };
      case 'free_trial':
        return { label: '免费试用', icon: <Gift size={16} />, color: 'bg-emerald-500' };
      case 'period_adjustment':
        return { label: '账期调整', icon: <Calendar size={16} />, color: 'bg-blue-500' };
      default:
        return { label: '其他', icon: <AlertCircle size={16} />, color: 'bg-navy-500' };
    }
  };

  const handleResolve = () => {
    if (!resolveModal.resultId || !resolveModal.discrepancyId) return;

    switch (resolutionType) {
      case 'ignore':
        resolveDiscrepancy(
          resolveModal.resultId,
          resolveModal.discrepancyId,
          resolutionNote || '确认有效调用，正常计费'
        );
        break;
      case 'waive':
        waiveDiscrepancy(
          resolveModal.resultId,
          resolveModal.discrepancyId
        );
        break;
      case 'discount':
        const adjAmount = -parseFloat(adjustmentAmount || '0');
        applyPeriodAdjustment(
          resolveModal.resultId,
          adjAmount,
          resolutionNote || '差异调整'
        );
        resolveDiscrepancy(
          resolveModal.resultId,
          resolveModal.discrepancyId,
          `给予折扣，金额调整为 ¥${adjAmount.toFixed(2)}`
        );
        break;
      case 'free_trial':
        markDiscrepancyAsFreeTrial(
          resolveModal.resultId,
          resolveModal.discrepancyId
        );
        break;
      default:
        if (resolutionNote) {
          resolveDiscrepancy(
            resolveModal.resultId,
            resolveModal.discrepancyId,
            resolutionNote
          );
        }
    }

    setResolveModal({ isOpen: false, resultId: '', discrepancyId: '' });
    setResolutionType('');
    setResolutionNote('');
    setAdjustmentAmount('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">差异处理</h1>
          <p className="text-navy-500 mt-1">处理对账过程中发现的差异项，包括重复调用、超授权调用等</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={18} className="text-amber-500" />
            <p className="stat-label">待处理差异</p>
          </div>
          <p className="stat-value text-amber-600">{pendingDiscrepancies.length}</p>
          <p className="text-xs text-navy-400 mt-1">
            涉及 {new Set(pendingDiscrepancies.map((d) => d.customerName)).size} 个客户
          </p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={18} className="text-emerald-500" />
            <p className="stat-label">已处理差异</p>
          </div>
          <p className="stat-value text-emerald-600">{resolvedDiscrepancies.length}</p>
          <p className="text-xs text-navy-400 mt-1">已完成处理</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <Copy size={18} className="text-rose-500" />
            <p className="stat-label">重复调用</p>
          </div>
          <p className="stat-value text-rose-600">
            {allDiscrepancies.filter((d) => d.type === 'duplicate_call').length}
          </p>
          <p className="text-xs text-navy-400 mt-1">
            ¥{allDiscrepancies
              .filter((d) => d.type === 'duplicate_call')
              .reduce((sum, d) => sum + d.amount, 0)
              .toLocaleString()}
          </p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <Shield size={18} className="text-amber-500" />
            <p className="stat-label">超授权调用</p>
          </div>
          <p className="stat-value text-amber-600">
            {allDiscrepancies.filter((d) => d.type === 'over_authorized').length}
          </p>
          <p className="text-xs text-navy-400 mt-1">
            ¥{allDiscrepancies
              .filter((d) => d.type === 'over_authorized')
              .reduce((sum, d) => sum + d.amount, 0)
              .toLocaleString()}
          </p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-navy-100">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-navy-400" />
              <div className="flex gap-1 bg-navy-50 rounded-lg p-1">
                {[
                  { key: 'all', label: '全部' },
                  { key: 'pending', label: '待处理' },
                  { key: 'resolved', label: '已处理' },
                ].map((filter) => (
                  <button
                    key={filter.key}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      activeFilter === filter.key
                        ? 'bg-white text-navy-800 shadow-sm'
                        : 'text-navy-500 hover:text-navy-700'
                    }`}
                    onClick={() => setActiveFilter(filter.key)}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
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

        <div className="p-6">
          {filteredResults.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-navy-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-navy-400" />
              </div>
              <h3 className="text-lg font-semibold text-navy-800 mb-2">暂无差异项</h3>
              <p className="text-navy-500">当前没有需要处理的差异</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredResults.map((result) => {
              const discrepancies = activeFilter === 'pending'
                ? result.discrepancies.filter((d) => d.status === 'pending')
                : activeFilter === 'resolved'
                ? result.discrepancies.filter((d) => d.status === 'resolved')
                : result.discrepancies;

              if (discrepancies.length === 0) return null;

              return (
                <div
                  key={result.id}
                  className="border border-navy-100 rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() =>
                      setExpandedResult(
                        expandedResult === result.id ? null : result.id
                      )
                    }
                    className="w-full p-4 hover:bg-navy-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {expandedResult === result.id ? (
                          <ChevronDown size={20} className="text-navy-400" />
                        ) : (
                          <ChevronRight size={20} className="text-navy-400" />
                        )}
                        <div className="text-left">
                          <p className="font-semibold text-navy-800">
                            {result.customerName}
                          </p>
                          <p className="text-xs text-navy-500">{result.period}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="badge badge-danger">
                          {discrepancies.length} 条差异
                        </span>
                        <span className="badge badge-warning">
                          待处理 {result.discrepancies.filter((d) => d.status === 'pending').length}
                        </span>
                      </div>
                    </div>
                  </button>

                  {expandedResult === result.id && (
                    <div className="border-t border-navy-100 bg-navy-50 p-4 space-y-3">
                      {discrepancies.map((disc, idx) => {
                        const typeInfo = getDiscrepancyTypeInfo(disc.type);
                        return (
                          <div
                            key={idx}
                            className={`p-4 rounded-lg border ${
                              disc.status === 'resolved'
                                ? 'border-emerald-200 bg-emerald-50'
                                : 'border-amber-200 bg-white'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-4 flex-1">
                                <div
                                  className={`p-2 rounded-lg text-white flex-shrink-0 ${typeInfo.color}`}
                                >
                                  {typeInfo.icon}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
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
                                      {typeInfo.label}
                                    </span>
                                    <span className="text-sm text-navy-500">
                                      {disc.status === 'resolved' ? (
                                        <StatusBadge status="success" size="sm" />
                                      ) : (
                                        <StatusBadge status="pending" size="sm" />
                                      )}
                                    </span>
                                  </div>
                                  <p className="text-sm text-navy-800">
                                    {disc.description}
                                  </p>
                                  {disc.callRecordIds &&
                                    disc.callRecordIds.length > 0 && (
                                      <p className="text-xs text-navy-400 mt-1">
                                        涉及记录: {disc.callRecordIds.join(', ')}
                                      </p>
                                    )}
                                  {disc.resolution && (
                                    <p className="text-xs text-emerald-700 mt-2">
                                      <span className="font-medium">处理结果:</span>{' '}
                                      {disc.resolution}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-3">
                                <span
                                  className={`text-lg font-bold font-mono ${
                                    disc.amount > 0
                                      ? 'text-rose-600'
                                      : 'text-emerald-600'
                                  }`}
                                >
                                  {disc.amount > 0 ? '+' : ''}¥
                                  {disc.amount.toLocaleString()}
                                </span>
                                {disc.status === 'pending' && (
                                  <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() =>
                                      setResolveModal({
                                        isOpen: true,
                                        resultId: result.id,
                                        discrepancyId: disc.id,
                                      })
                                    }
                                  >
                                      处理
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={resolveModal.isOpen}
        onClose={() => setResolveModal({ isOpen: false, resultId: '', discrepancyId: '' })}
        title="处理差异项"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-2">
              选择处理方式</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'ignore', label: '正常计费', icon: <CheckCircle size={16} />, desc: '确认调用有效，正常计费' },
                { key: 'waive', label: '豁免费用', icon: <XCircle size={16} />, desc: '豁免该笔费用' },
                { key: 'discount', label: '调整金额', icon: <Gift size={16} />, desc: '给予折扣或调整' },
                { key: 'free_trial', label: '免费试用', icon: <Gift size={16} />, desc: '标记为免费试用' },
              ].map((option) => (
                <button
                  key={option.key}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    resolutionType === option.key
                      ? 'border-navy-800 bg-navy-50'
                      : 'border-navy-200 hover:border-navy-400'
                  }`}
                  onClick={() => setResolutionType(option.key)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {option.icon}
                    <span className="font-medium text-sm">{option.label}</span>
                  </div>
                  <p className="text-xs text-navy-500">{option.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {resolutionType === 'discount' && (
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">
                调整金额（元）</label>
              <input
                type="number"
                className="input"
                value={adjustmentAmount}
                onChange={(e) => setAdjustmentAmount(e.target.value)}
                placeholder="请输入调整金额"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">
              备注说明</label>
            <textarea
              className="input min-h-[80px]"
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              placeholder="请输入处理说明..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-navy-100">
            <button
              className="btn btn-secondary"
              onClick={() => setResolveModal({ isOpen: false, resultId: '', discrepancyId: '' })}
            >
              取消
            </button>
            <button
              className="btn btn-primary"
              onClick={handleResolve}
              disabled={!resolutionType}
            >
              确认处理
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
