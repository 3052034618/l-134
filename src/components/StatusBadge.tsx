import { ReconciliationResult, DiscrepancyItem, FetchStatus } from '@/../shared/types';

interface StatusBadgeProps {
  status: ReconciliationResult['status'] | DiscrepancyItem['status'] | FetchStatus['status'];
  size?: 'sm' | 'md';
}

const statusConfig: Record<string, { label: string; className: string }> = {
  matched: { label: '已核对', className: 'badge-success' },
  discrepancy: { label: '存在差异', className: 'badge-danger' },
  resolved: { label: '已处理', className: 'badge-warning' },
  pending: { label: '待处理', className: 'badge-warning' },
  idle: { label: '待拉取', className: 'badge-info' },
  fetching: { label: '拉取中', className: 'badge-warning' },
  success: { label: '成功', className: 'badge-success' },
  error: { label: '失败', className: 'badge-danger' },
};

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, className: 'badge-info' };
  const sizeClass = size === 'sm' ? 'text-xs px-1.5 py-0.5' : '';
  
  return (
    <span className={`badge ${config.className} ${sizeClass}`}>
      {config.label}
    </span>
  );
}
