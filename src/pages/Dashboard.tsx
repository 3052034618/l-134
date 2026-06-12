import { useNavigate } from 'react-router-dom';
import {
  Users,
  Package,
  FileCheck,
  AlertTriangle,
  Database,
  Download,
  ArrowRight,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useReconciliationStore } from '@/store/useReconciliationStore';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    products,
    customers,
    callRecords,
    results,
    fetchStatuses,
    currentPeriod,
    fetchAllData,
    runReconciliation,
  } = useReconciliationStore();

  const totalReceivable = results.reduce((sum, r) => sum + r.receivableAmount, 0);
  const totalConfirmed = results.reduce((sum, r) => sum + r.confirmedAmount, 0);
  const totalDifference = results.reduce((sum, r) => sum + r.differenceAmount, 0);
  const pendingDiscrepancies = results.reduce(
    (sum, r) => sum + r.discrepancies.filter((d) => d.status === 'pending').length,
    0
  );
  const matchedCount = results.filter((r) => r.status === 'completed').length;
  const discrepancyCount = results.filter((r) => r.status === 'pending' || r.status === 'partial').length;

  const quickActions = [
    {
      label: '一键拉取数据',
      icon: Database,
      onClick: () => navigate('/fetch'),
      color: 'bg-navy-800',
      description: '拉取调用、授权、退款、调整数据',
    },
    {
      label: '执行对账',
      icon: FileCheck,
      onClick: () => {
        runReconciliation();
        navigate('/reconciliation');
      },
      color: 'bg-emerald-600',
      description: '自动计算应收金额并生成差异',
    },
    {
      label: '处理差异',
      icon: AlertTriangle,
      onClick: () => navigate('/discrepancy'),
      color: 'bg-amber-500',
      description: '标记和处理对账差异项',
    },
    {
      label: '导出报表',
      icon: Download,
      onClick: () => navigate('/export'),
      color: 'bg-rose-600',
      description: '导出对账单、汇总表和待跟进清单',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">工作台</h1>
          <p className="text-navy-500 mt-1">
            对账周期: {currentPeriod} | 欢迎回来，张运营
          </p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-secondary" onClick={() => fetchAllData()}>
            <Database size={16} className="mr-2" />
            快速拉取
          </button>
          <button className="btn btn-primary" onClick={() => { runReconciliation(); navigate('/reconciliation'); }}>
            <FileCheck size={16} className="mr-2" />
            执行对账
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="客户总数"
          value={customers.length}
          icon={<Users size={24} className="text-navy-600" />}
          change={12}
          onClick={() => navigate('/config/customers')}
        />
        <StatCard
          label="数据产品"
          value={products.length}
          icon={<Package size={24} className="text-emerald-600" />}
          onClick={() => navigate('/config/products')}
        />
        <StatCard
          label="调用记录"
          value={callRecords.length}
          icon={<Database size={24} className="text-amber-600" />}
          suffix=" 条"
          onClick={() => navigate('/fetch')}
        />
        <StatCard
          label="待处理差异"
          value={pendingDiscrepancies}
          icon={<AlertTriangle size={24} className="text-rose-600" />}
          onClick={() => navigate('/discrepancy')}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label="应收总额"
          value={totalReceivable}
          prefix="¥"
          icon={<FileCheck size={24} className="text-navy-600" />}
        />
        <StatCard
          label="确认总额"
          value={totalConfirmed}
          prefix="¥"
          icon={<CheckCircle size={24} className="text-emerald-600" />}
        />
        <StatCard
          label="差异总额"
          value={Math.abs(totalDifference)}
          prefix="¥"
          icon={<XCircle size={24} className="text-rose-600" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-navy-800 mb-6">快捷操作</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className="card p-5 text-left transition-all duration-200 hover:shadow-md hover:-translate-y-1 group"
                >
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-lg ${action.color} text-white`}>
                      <action.icon size={24} />
                    </div>
                    <ArrowRight
                      size={20}
                      className="text-navy-300 group-hover:text-navy-600 transition-colors"
                    />
                  </div>
                  <h4 className="font-semibold text-navy-800 mt-4">{action.label}</h4>
                  <p className="text-sm text-navy-500 mt-1">{action.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-navy-800 mb-4">数据拉取状态</h3>
            <div className="space-y-4">
              {fetchStatuses.map((status) => (
                <div key={status.source} className="flex items-center justify-between">
                  <span className="text-sm text-navy-600">
                    {status.source === 'calls' && '调用记录'}
                    {status.source === 'authorization' && '授权信息'}
                    {status.source === 'refunds' && '退款记录'}
                    {status.source === 'adjustments' && '调整项'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-navy-400 number-font">{status.count} 条</span>
                    <StatusBadge status={status.status} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-navy-800 mb-4">对账状态统计</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-emerald-500" />
                  <span className="text-sm text-navy-600">已核对</span>
                </div>
                <span className="font-semibold text-emerald-600 number-font">{matchedCount} 家</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle size={16} className="text-rose-500" />
                  <span className="text-sm text-navy-600">存在差异</span>
                </div>
                <span className="font-semibold text-rose-600 number-font">{discrepancyCount} 家</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-amber-500" />
                  <span className="text-sm text-navy-600">待跟进</span>
                </div>
                <span className="font-semibold text-amber-600 number-font">{pendingDiscrepancies} 项</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {results.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-navy-800 mb-6">最近对账结果</h3>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>客户名称</th>
                  <th>应收金额</th>
                  <th>确认金额</th>
                  <th>差异金额</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100">
                {results.slice(0, 5).map((result) => (
                  <tr key={result.id}>
                    <td className="font-medium">{result.customerName}</td>
                    <td className="number-font">¥{result.receivableAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</td>
                    <td className="number-font">¥{result.confirmedAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</td>
                    <td className={`number-font ${result.differenceAmount !== 0 ? 'diff-negative diff-highlight' : ''}`}>
                      ¥{result.differenceAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <StatusBadge status={result.status} />
                    </td>
                    <td>
                      <button
                        className="text-navy-600 hover:text-navy-800 text-sm flex items-center gap-1"
                        onClick={() => navigate('/reconciliation')}
                      >
                        查看详情 <ArrowRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
