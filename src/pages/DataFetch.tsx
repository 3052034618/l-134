import { useState, useRef } from 'react';
import { Database, RefreshCw, CheckCircle, XCircle, Clock, Play, FileJson, Key, CreditCard, Settings, ChevronDown, ChevronRight, Search, Upload, FileSpreadsheet, AlertTriangle, AlertCircle, Trash2, Lock, ShieldAlert } from 'lucide-react';
import { useReconciliationStore } from '@/store/useReconciliationStore';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/Modal';

export default function DataFetch() {
  const {
    fetchAllData,
    isFetching,
    fetchStatuses,
    callRecords,
    refundRecords,
    adjustmentRecords,
    customers,
    currentPeriod,
    markAsDuplicate,
    markAsOverAuthorized,
    resetData,
    parseUploadFile,
    confirmUpload,
    cancelUpload,
    uploadPreview,
    downloadErrorReport,
    batches,
    currentBatchId,
    isCurrentBatchConfirmed,
    getRefetchImpact,
  } = useReconciliationStore();
  const [activeTab, setActiveTab] = useState<'calls' | 'refunds' | 'adjustments'>('calls');
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadModalType, setUploadModalType] = useState<'calls' | 'refunds' | 'adjustments' | null>(null);
  const [showImpactModal, setShowImpactModal] = useState(false);
  const [impactData, setImpactData] = useState<any>(null);
  const [pendingAction, setPendingAction] = useState<'fetch' | 'reset' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentBatch = batches.find(b => b.id === currentBatchId);
  const locked = isCurrentBatchConfirmed();

  const sourceConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    calls: { label: '调用记录', icon: <FileJson size={20} />, color: 'bg-emerald-500' },
    authorization: { label: '授权信息', icon: <Key size={20} />, color: 'bg-blue-500' },
    refunds: { label: '退款记录', icon: <CreditCard size={20} />, color: 'bg-amber-500' },
    adjustments: { label: '人工调整', icon: <Settings size={20} />, color: 'bg-rose-500' },
  };

  const totalCallCount = callRecords.reduce((sum, c) => sum + c.callCount, 0);
  const duplicateCount = callRecords.filter((c) => c.isDuplicate).length;
  const overAuthorizedCount = callRecords.filter((c) => c.isOverAuthorized).length;

  const customerCallSummary = customers.map((customer) => {
    const customerCalls = callRecords.filter((c) => c.customerId === customer.id);
    const totalCalls = customerCalls.reduce((sum, c) => sum + c.callCount, 0);
    const duplicateCalls = customerCalls.filter((c) => c.isDuplicate).reduce((sum, c) => sum + c.callCount, 0);
    const overCalls = customerCalls.filter((c) => c.isOverAuthorized).reduce((sum, c) => sum + c.callCount, 0);
    return {
      customer,
      totalCalls,
      duplicateCalls,
      overCalls,
      recordCount: customerCalls.length,
    };
  }).filter((s) => s.recordCount > 0);

  const filteredCalls = callRecords.filter(
    (c) =>
      c.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRefunds = refundRecords.filter(
    (r) =>
      r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAdjustments = adjustmentRecords.filter(
    (a) => a.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadModalType) return;
    await parseUploadFile(file, uploadModalType);
  };

  const handleConfirmUpload = () => {
    confirmUpload();
    setUploadModalType(null);
  };

  const handleFetch = () => {
    const impact = getRefetchImpact();
    if (impact.isBatchConfirmed || impact.exportedCustomers.length > 0 || impact.affectedCustomers.length > 0) {
      setImpactData(impact);
      setPendingAction('fetch');
      setShowImpactModal(true);
    } else {
      fetchAllData();
    }
  };

  const handleReset = () => {
    const impact = getRefetchImpact();
    if (impact.isBatchConfirmed || impact.exportedCustomers.length > 0 || impact.affectedCustomers.length > 0) {
      setImpactData(impact);
      setPendingAction('reset');
      setShowImpactModal(true);
    } else {
      if (confirm('确定要重置所有数据吗？此操作不可撤销。')) {
        resetData();
      }
    }
  };

  const confirmAction = () => {
    if (impactData?.isBatchConfirmed) {
      alert('该批次已财务确认，不能直接覆盖数据。请先撤回确认或新建版本。');
      setShowImpactModal(false);
      return;
    }
    if (pendingAction === 'fetch') {
      fetchAllData();
    } else if (pendingAction === 'reset') {
      if (confirm('确定要重置所有数据吗？此操作不可撤销。')) {
        resetData();
      }
    }
    setShowImpactModal(false);
    setPendingAction(null);
    setImpactData(null);
  };

  const getTemplateFields = (type: string) => {
    if (type === 'calls') return ['customerName', 'productName', 'callTime', 'callCount'];
    if (type === 'refunds') return ['customerName', 'productName', 'amount', 'reason', 'refundDate'];
    return ['customerName', 'amount', 'type', 'reason', 'operator', 'createdAt'];
  };

  const renderUploadModal = () => {
    if (!uploadModalType) return null;
    const typeLabel = uploadModalType === 'calls' ? '调用记录' : uploadModalType === 'refunds' ? '退款记录' : '人工调整';
    const fields = getTemplateFields(uploadModalType);
    const fieldNames: Record<string, string> = {
      customerName: '客户名称',
      productName: '产品名称',
      callTime: '调用时间(YYYY-MM-DD HH:mm:ss)',
      callCount: '调用次数',
      amount: '金额(元)',
      reason: '原因说明',
      refundDate: '退款日期(YYYY-MM-DD)',
      type: '类型(addition/deduction)',
      operator: '操作人',
      createdAt: '创建日期(YYYY-MM-DD)',
    };

    return (
      <Modal
        isOpen={uploadModalType !== null}
        onClose={() => { setUploadModalType(null); cancelUpload(); }}
        title={`上传${typeLabel}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-2">上传文件(支持Excel和CSV格式)</label>
            <div
              className="border-2 border-dashed border-navy-200 rounded-lg p-8 text-center hover:border-navy-400 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileSpreadsheet size={40} className="mx-auto text-navy-400 mb-3" />
              <p className="text-navy-700 font-medium mb-1">点击或拖拽文件到此处上传</p>
              <p className="text-sm text-navy-500">支持 .xlsx, .xls, .csv 格式</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-800 mb-2">📋 必需字段模板</p>
            <div className="flex flex-wrap gap-2">
              {fields.map(f => (
                <span key={f} className="px-2 py-1 bg-white rounded text-xs text-blue-700 border border-blue-200">
                  {fieldNames[f] || f}
                </span>
              ))}
            </div>
          </div>

          {uploadPreview && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <p className="text-sm font-medium text-emerald-800 flex items-center gap-1">
                    <CheckCircle size={14} /> 校验通过行数
                  </p>
                  <p className="text-2xl font-bold font-mono text-emerald-700 mt-1">
                    {uploadPreview.validation.validRows} / {uploadPreview.validation.totalRows}
                  </p>
                </div>
                <div className={`p-3 rounded-lg border ${uploadPreview.validation.errors.length > 0 || uploadPreview.validation.warnings.length > 0 ? 'bg-amber-50 border-amber-200' : 'bg-navy-50 border-navy-200'}`}>
                  <p className={`text-sm font-medium flex items-center gap-1 ${uploadPreview.validation.errors.length > 0 ? 'text-rose-800' : 'text-navy-700'}`}>
                    {uploadPreview.validation.errors.length > 0 ? <AlertCircle size={14} /> : uploadPreview.validation.warnings.length > 0 ? <AlertTriangle size={14} /> : <CheckCircle size={14} />}
                    校验结果
                  </p>
                  <p className="text-sm mt-1">
                    {uploadPreview.validation.errors.length > 0 ? (
                      <span className="text-rose-600">{uploadPreview.validation.errors.length}个错误</span>
                    ) : uploadPreview.validation.warnings.length > 0 ? (
                      <span className="text-amber-600">{uploadPreview.validation.warnings.length}个警告</span>
                    ) : (
                      <span className="text-emerald-600">数据格式正确</span>
                    )}
                  </p>
                </div>
              </div>

              {(uploadPreview.validation.errors.length > 0 || uploadPreview.validation.warnings.length > 0) && (
                <div className="p-3 border rounded-lg max-h-32 overflow-y-auto scrollbar-thin space-y-1">
                  {uploadPreview.validation.errors.map((e, i) => (
                    <p key={i} className="text-xs text-rose-600">❌ {e}</p>
                  ))}
                  {uploadPreview.validation.warnings.map((w, i) => (
                    <p key={i} className="text-xs text-amber-600">⚠️ {w}</p>
                  ))}
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-navy-700 mb-2">数据预览(前10行)</p>
                <div className="table-container max-h-64 overflow-y-auto scrollbar-thin">
                  <table className="table">
                    <thead className="sticky top-0">
                      <tr>
                        <th>#</th>
                        {uploadPreview.headers.map(h => (
                          <th key={h}>{fieldNames[h] || h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-navy-100">
                      {uploadPreview.rows.map((row, i) => (
                        <tr key={i}>
                          <td className="text-navy-400 font-mono text-xs">{i + 1}</td>
                          {uploadPreview.headers.map(h => (
                            <td key={h} className="text-sm">{String(row[h] ?? '')}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-navy-100">
            {uploadPreview && uploadPreview.validation.errorRows.length > 0 && (
              <button
                className="btn btn-secondary text-sm"
                onClick={downloadErrorReport}
              >
                <FileSpreadsheet size={14} className="mr-1" />
                下载错误明细
              </button>
            )}
            {!uploadPreview?.validation.errorRows.length && <div />}
            <div className="flex gap-3">
              <button
                className="btn btn-secondary"
                onClick={() => { setUploadModalType(null); cancelUpload(); }}
              >
                取消
              </button>
              <button
                className="btn btn-primary"
                disabled={!uploadPreview || uploadPreview.validation.validRows === 0}
                onClick={handleConfirmUpload}
              >
                确认导入 ({uploadPreview?.validation.validRows || 0}条有效)
              </button>
            </div>
          </div>
        </div>
      </Modal>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {locked && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <Lock size={20} className="text-amber-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-amber-800">当前批次已财务确认，数据已锁定</p>
            <p className="text-sm text-amber-700">如需重新拉取或修改数据，请先撤回确认或新建版本。版本号: V{currentBatch?.version}</p>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">数据拉取</h1>
          <p className="text-navy-500 mt-1">一键拉取调用记录、授权信息、退款记录和人工调整项</p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-secondary" onClick={handleReset} disabled={locked || isFetching}>
            <RefreshCw size={16} className="mr-2" />
            重置数据
          </button>
          <button
            className="btn btn-primary"
            onClick={handleFetch}
            disabled={locked || isFetching}
          >
            {isFetching ? (
              <>
                <RefreshCw size={16} className="mr-2 animate-spin" />
                拉取中...
              </>
            ) : (
              <>
                <Play size={16} className="mr-2" />
                一键拉取
              </>
            )}
          </button>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold text-navy-800 mb-6 flex items-center gap-2">
          <Database size={20} className="text-navy-600" />
          数据源拉取状态
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {fetchStatuses.map((status) => {
            const config = sourceConfig[status.source];
            return (
              <div
                key={status.source}
                className={`p-5 rounded-lg border transition-all duration-300 ${
                  status.status === 'success'
                    ? 'border-emerald-200 bg-emerald-50'
                    : status.status === 'fetching'
                    ? 'border-amber-200 bg-amber-50'
                    : status.status === 'error'
                    ? 'border-rose-200 bg-rose-50'
                    : 'border-navy-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg text-white ${config.color} ${
                        status.status === 'fetching' ? 'animate-pulse' : ''
                      }`}
                    >
                      {config.icon}
                    </div>
                    <div>
                      <p className="font-medium text-navy-800">{config.label}</p>
                      <p className="text-xs text-navy-500">
                        {status.fetchedAt
                          ? `拉取于 ${new Date(status.fetchedAt).toLocaleTimeString('zh-CN')}`
                          : '未拉取'}
                      </p>
                    </div>
                  </div>
                  {status.source !== 'authorization' && (
                    <button
                      onClick={() => !locked && setUploadModalType(status.source as any)}
                      className={`p-1.5 rounded-lg transition-colors ${locked ? 'text-navy-300 cursor-not-allowed' : 'text-navy-600 hover:text-navy-800 hover:bg-white/60'}`}
                      title={locked ? '当前批次已锁定，不能上传' : `上传${config.label}`}
                      disabled={locked}
                    >
                      <Upload size={16} />
                    </button>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold font-mono text-navy-800">
                    {status.count}
                  </span>
                  <StatusBadge status={status.status} />
                </div>
                {status.status === 'fetching' && (
                  <div className="progress-bar mt-3">
                    <div className="progress-fill animate-pulse" style={{ width: '60%' }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {callRecords.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="stat-card">
            <p className="stat-label">总调用次数</p>
            <p className="stat-value">{totalCallCount.toLocaleString()}</p>
            <p className="text-xs text-navy-400 mt-1">账期: {currentPeriod}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">调用记录数</p>
            <p className="stat-value">{callRecords.length}</p>
            <p className="text-xs text-navy-400 mt-1">条记录</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">疑似重复调用</p>
            <p className="stat-value text-rose-600">{duplicateCount}</p>
            <p className="text-xs text-navy-400 mt-1">需要确认</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">超授权调用</p>
            <p className="stat-value text-amber-600">{overAuthorizedCount}</p>
            <p className="text-xs text-navy-400 mt-1">超出授权范围</p>
          </div>
        </div>
      )}

      {callRecords.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-navy-800 mb-4">各客户调用汇总</h3>
          <div className="space-y-2">
            {customerCallSummary.map((summary) => (
              <div key={summary.customer.id} className="border border-navy-100 rounded-lg overflow-hidden">
                <button
                  onClick={() =>
                    setExpandedCustomer(
                      expandedCustomer === summary.customer.id ? null : summary.customer.id
                    )
                  }
                  className="w-full p-4 flex items-center justify-between hover:bg-navy-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {expandedCustomer === summary.customer.id ? (
                      <ChevronDown size={18} className="text-navy-400" />
                    ) : (
                      <ChevronRight size={18} className="text-navy-400" />
                    )}
                    <div>
                      <p className="font-medium text-navy-800">{summary.customer.name}</p>
                      <p className="text-xs text-navy-500">{summary.customer.contact}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs text-navy-500">总调用次数</p>
                      <p className="font-semibold font-mono text-navy-800">
                        {summary.totalCalls.toLocaleString()}
                      </p>
                    </div>
                    {summary.duplicateCalls > 0 && (
                      <div className="text-right">
                        <p className="text-xs text-rose-500">重复调用</p>
                        <p className="font-semibold font-mono text-rose-600">
                          {summary.duplicateCalls}
                        </p>
                      </div>
                    )}
                    {summary.overCalls > 0 && (
                      <div className="text-right">
                        <p className="text-xs text-amber-500">超授权</p>
                        <p className="font-semibold font-mono text-amber-600">
                          {summary.overCalls}
                        </p>
                      </div>
                    )}
                  </div>
                </button>
                {expandedCustomer === summary.customer.id && (
                  <div className="border-t border-navy-100 p-4 bg-navy-50">
                    <div className="table-container">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>产品名称</th>
                            <th>调用时间</th>
                            <th>调用次数</th>
                            <th>状态</th>
                            <th>操作</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-navy-100">
                          {callRecords
                            .filter((c) => c.customerId === summary.customer.id)
                            .slice(0, 10)
                            .map((call) => (
                              <tr key={call.id}>
                                <td>{call.productName}</td>
                                <td className="text-navy-500 font-mono text-sm">{call.callTime}</td>
                                <td className="font-mono">{call.callCount}</td>
                                <td>
                                  {call.isDuplicate && (
                                    <span className="badge badge-danger mr-1">重复</span>
                                  )}
                                  {call.isOverAuthorized && (
                                    <span className="badge badge-warning mr-1">超授权</span>
                                  )}
                                  {!call.isDuplicate && !call.isOverAuthorized && (
                                    <span className="badge badge-success">正常</span>
                                  )}
                                </td>
                                <td>
                                  <div className="flex items-center gap-2">
                                    {!call.isDuplicate && (
                                      <button
                                        className={`text-xs ${locked ? 'text-navy-300 cursor-not-allowed' : 'text-rose-600 hover:text-rose-700'}`}
                                        onClick={() => !locked && markAsDuplicate(call.id)}
                                        disabled={locked}
                                      >
                                        {locked ? '已锁定' : '标记重复'}
                                      </button>
                                    )}
                                    {!call.isOverAuthorized && (
                                      <button
                                        className={`text-xs ${locked ? 'text-navy-300 cursor-not-allowed' : 'text-amber-600 hover:text-amber-700'}`}
                                        onClick={() => !locked && markAsOverAuthorized(call.id)}
                                        disabled={locked}
                                      >
                                        {locked ? '已锁定' : '标记超授权'}
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {(callRecords.length > 0 || refundRecords.length > 0 || adjustmentRecords.length > 0) && (
        <div className="card overflow-hidden">
          <div className="border-b border-navy-100">
            <div className="flex">
              <button
                className={`px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'calls'
                    ? 'text-navy-800 border-b-2 border-navy-800 bg-navy-50'
                    : 'text-navy-500 hover:text-navy-700'
                }`}
                onClick={() => setActiveTab('calls')}
              >
                调用记录 ({callRecords.length})
              </button>
              <button
                className={`px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'refunds'
                    ? 'text-navy-800 border-b-2 border-navy-800 bg-navy-50'
                    : 'text-navy-500 hover:text-navy-700'
                }`}
                onClick={() => setActiveTab('refunds')}
              >
                退款记录 ({refundRecords.length})
              </button>
              <button
                className={`px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'adjustments'
                    ? 'text-navy-800 border-b-2 border-navy-800 bg-navy-50'
                    : 'text-navy-500 hover:text-navy-700'
                }`}
                onClick={() => setActiveTab('adjustments')}
              >
                人工调整 ({adjustmentRecords.length})
              </button>
            </div>
          </div>

          <div className="p-4 border-b border-navy-100 flex items-center justify-between">
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
            {activeTab === 'calls' && (
              <table className="table">
                <thead className="sticky top-0">
                  <tr>
                    <th>记录ID</th>
                    <th>客户名称</th>
                    <th>产品名称</th>
                    <th>调用时间</th>
                    <th>调用次数</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-100">
                  {filteredCalls.map((call) => (
                    <tr key={call.id}>
                      <td className="font-mono text-xs text-navy-500">{call.id}</td>
                      <td className="font-medium">{call.customerName}</td>
                      <td>{call.productName}</td>
                      <td className="text-navy-500 font-mono text-sm">{call.callTime}</td>
                      <td className="font-mono">{call.callCount}</td>
                      <td>
                        {call.isDuplicate && <span className="badge badge-danger mr-1">重复</span>}
                        {call.isOverAuthorized && (
                          <span className="badge badge-warning mr-1">超授权</span>
                        )}
                        {!call.isDuplicate && !call.isOverAuthorized && (
                          <span className="badge badge-success">正常</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'refunds' && (
              <table className="table">
                <thead className="sticky top-0">
                  <tr>
                    <th>退款ID</th>
                    <th>客户名称</th>
                    <th>产品名称</th>
                    <th>退款金额</th>
                    <th>退款原因</th>
                    <th>退款日期</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-100">
                  {filteredRefunds.map((refund) => (
                    <tr key={refund.id}>
                      <td className="font-mono text-xs text-navy-500">{refund.id}</td>
                      <td className="font-medium">{refund.customerName}</td>
                      <td>{refund.productName}</td>
                      <td className="font-mono text-rose-600">
                        -¥{refund.amount.toLocaleString()}
                      </td>
                      <td className="text-sm text-navy-600 max-w-xs truncate">{refund.reason}</td>
                      <td className="text-navy-500">{refund.refundDate}</td>
                      <td>
                        <span
                          className={`badge ${
                            refund.status === 'approved' ? 'badge-success' : 'badge-warning'
                          }`}
                        >
                          {refund.status === 'approved' ? '已批准' : '待审批'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'adjustments' && (
              <table className="table">
                <thead className="sticky top-0">
                  <tr>
                    <th>调整ID</th>
                    <th>客户名称</th>
                    <th>调整金额</th>
                    <th>类型</th>
                    <th>调整原因</th>
                    <th>操作人</th>
                    <th>创建时间</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-100">
                  {filteredAdjustments.map((adj) => (
                    <tr key={adj.id}>
                      <td className="font-mono text-xs text-navy-500">{adj.id}</td>
                      <td className="font-medium">{adj.customerName}</td>
                      <td
                        className={`font-mono ${
                          adj.type === 'addition' ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {adj.type === 'addition' ? '+' : '-'}¥{adj.amount.toLocaleString()}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            adj.type === 'addition' ? 'badge-success' : 'badge-danger'
                          }`}
                        >
                          {adj.type === 'addition' ? '加款' : '减款'}
                        </span>
                      </td>
                      <td className="text-sm text-navy-600 max-w-xs truncate">{adj.reason}</td>
                      <td className="text-navy-500">{adj.operator}</td>
                      <td className="text-navy-500">{adj.createdAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {renderUploadModal()}

      <Modal
        isOpen={showImpactModal}
        onClose={() => { setShowImpactModal(false); setPendingAction(null); setImpactData(null); }}
        title="操作影响范围确认"
      >
        <div className="space-y-4">
          {impactData?.isBatchConfirmed && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-3">
              <ShieldAlert size={20} className="text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-800">该批次已财务确认，不能直接覆盖数据</p>
                <p className="text-sm text-rose-700 mt-1">请先撤回确认或新建版本后再执行此操作。</p>
              </div>
            </div>
          )}

          {impactData?.exportedCustomers?.length > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="font-semibold text-amber-800 mb-2">⚠️ 以下客户已导出对账单：</p>
              <div className="flex flex-wrap gap-2">
                {impactData.exportedCustomers.map((name: string, i: number) => (
                  <span key={i} className="px-2 py-1 bg-white rounded text-xs text-amber-700 border border-amber-200">{name}</span>
                ))}
              </div>
              <p className="text-xs text-amber-700 mt-2">重新操作后已导出的账单数据将与系统不一致，请谨慎操作。</p>
            </div>
          )}

          {impactData?.affectedCustomers?.length > 0 && !impactData?.isBatchConfirmed && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="font-semibold text-blue-800 mb-2">此次操作将影响以下 {impactData.affectedCustomers.length} 个客户：</p>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {impactData.affectedCustomers.map((name: string, i: number) => (
                  <span key={i} className="px-2 py-1 bg-white rounded text-xs text-blue-700 border border-blue-200">{name}</span>
                ))}
              </div>
            </div>
          )}

          {impactData?.confirmedCustomers?.length > 0 && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg">
              <p className="font-semibold text-rose-800 mb-2">⚠️ 以下客户已财务确认：</p>
              <div className="flex flex-wrap gap-2">
                {impactData.confirmedCustomers.map((name: string, i: number) => (
                  <span key={i} className="px-2 py-1 bg-white rounded text-xs text-rose-700 border border-rose-200">{name}</span>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-navy-100">
            <button
              className="btn btn-secondary"
              onClick={() => { setShowImpactModal(false); setPendingAction(null); setImpactData(null); }}
            >
              取消
            </button>
            <button
              className="btn btn-primary"
              onClick={confirmAction}
              disabled={impactData?.isBatchConfirmed}
            >
              {pendingAction === 'reset' ? '确认重置' : '确认执行'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
