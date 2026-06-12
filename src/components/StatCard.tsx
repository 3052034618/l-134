import { ReactNode, useEffect, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number | string;
  prefix?: string;
  suffix?: string;
  change?: number;
  icon?: ReactNode;
  onClick?: () => void;
}

export default function StatCard({ label, value, prefix = '', suffix = '', change, icon, onClick }: StatCardProps) {
  const [displayValue, setDisplayValue] = useState<number | string>(0);

  useEffect(() => {
    if (typeof value === 'number') {
      const start = 0;
      const end = value;
      const duration = 1000;
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        setDisplayValue(Math.floor(start + (end - start) * easeOut));
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setDisplayValue(end);
        }
      };

      requestAnimationFrame(animate);
    } else {
      setDisplayValue(value);
    }
  }, [value]);

  const formatValue = (v: number | string) => {
    if (typeof v === 'number') {
      return v.toLocaleString('zh-CN', { minimumFractionDigits: typeof v === 'number' && v % 1 !== 0 ? 2 : 0 });
    }
    return v;
  };

  return (
    <div className="stat-card cursor-pointer" onClick={onClick}>
      <div className="flex items-start justify-between">
        <div>
          <p className="stat-label">{label}</p>
          <p className="stat-value animate-number-roll">
            {prefix}
            {formatValue(displayValue)}
            {suffix}
          </p>
          {change !== undefined && (
            <p className={`stat-change ${change >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {Math.abs(change)}% 较上月
            </p>
          )}
        </div>
        {icon && (
          <div className="p-3 bg-navy-50 rounded-lg">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
