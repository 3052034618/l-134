import { useState } from 'react';
import { Plus, Edit2, Trash2, Calendar, Clock, Calendar as CalendarIcon, RefreshCw } from 'lucide-react';
import { useReconciliationStore } from '@/store/useReconciliationStore';
import Modal from '@/components/Modal';

export default function CycleConfig() {
  const { reconciliationCycle, setReconciliationCycle, currentPeriod } = useReconciliationStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: reconciliationCycle.name,
    cycleType: reconciliationCycle.cycleType,
    startDay: reconciliationCycle.startDay,
    endDay: reconciliationCycle.endDay,
    excludeHolidays: reconciliationCycle.excludeHolidays,
    holidays: [...reconciliationCycle.holidays],
  });
  const [newHoliday, setNewHoliday] = useState('');

  const openEditModal = () => {
    setFormData({
      name: reconciliationCycle.name,
      cycleType: reconciliationCycle.cycleType,
      startDay: reconciliationCycle.startDay,
      endDay: reconciliationCycle.endDay,
      excludeHolidays: reconciliationCycle.excludeHolidays,
      holidays: [...reconciliationCycle.holidays],
    });
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    setReconciliationCycle({
      ...reconciliationCycle,
      ...formData,
    });
    setIsModalOpen(false);
  };

  const addHoliday = () => {
    if (newHoliday && !formData.holidays.includes(newHoliday)) {
      setFormData({
        ...formData,
        holidays: [...formData.holidays, newHoliday].sort(),
      });
      setNewHoliday('');
    }
  };

  const removeHoliday = (date: string) => {
    setFormData({
      ...formData,
      holidays: formData.holidays.filter((h) => h !== date),
    });
  };

  const cycleTypeLabels: Record<string, string> = {
    daily: '日对账',
    weekly: '周对账',
    monthly: '月对账',
    quarterly: '季度对账',
  };

  const generatePreviewDates = () => {
    const dates = [];
    const year = 2026;
    for (let month = 0; month < 12; month++) {
      const lastDay = new Date(year, month + 1, 0).getDate();
      const start = new Date(year, month, formData.startDay || 1);
      const end = new Date(year, month, Math.min(formData.endDay || lastDay, lastDay));
      dates.push({
        month: `${year}-${String(month + 1).padStart(2, '0')}`,
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
      });
    }
    return dates;
  };

  const previewDates = generatePreviewDates();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">对账周期配置</h1>
          <p className="text-navy-500 mt-1">设置对账周期规则和节假日排除</p>
        </div>
        <button className="btn btn-primary" onClick={openEditModal}>
          <Edit2 size={16} className="mr-2" />
          编辑配置
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-navy-800 mb-6 flex items-center gap-2">
              <Calendar size={20} className="text-navy-600" />
              当前周期配置
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="p-4 bg-navy-50 rounded-lg">
                <p className="text-sm text-navy-500 mb-1">周期名称</p>
                <p className="text-lg font-semibold text-navy-800">{reconciliationCycle.name}</p>
              </div>
              <div className="p-4 bg-navy-50 rounded-lg">
                <p className="text-sm text-navy-500 mb-1">周期类型</p>
                <p className="text-lg font-semibold text-navy-800">
                  {cycleTypeLabels[reconciliationCycle.cycleType]}
                </p>
              </div>
              <div className="p-4 bg-navy-50 rounded-lg">
                <p className="text-sm text-navy-500 mb-1">周期起始日</p>
                <p className="text-lg font-semibold text-emerald-600 font-mono">
                  每月 {reconciliationCycle.startDay} 日
                </p>
              </div>
              <div className="p-4 bg-navy-50 rounded-lg">
                <p className="text-sm text-navy-500 mb-1">周期结束日</p>
                <p className="text-lg font-semibold text-rose-600 font-mono">
                  每月 {reconciliationCycle.endDay} 日
                </p>
              </div>
            </div>
            <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-amber-600" />
                <span className="font-medium text-amber-800">
                  当前对账周期: {currentPeriod}
                </span>
              </div>
              <p className="text-sm text-amber-600 mt-1">
                数据范围: {currentPeriod}-01 至 {currentPeriod}-31
              </p>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-navy-800 mb-6 flex items-center gap-2">
              <CalendarIcon size={20} className="text-navy-600" />
              周期预览（2026年）
            </h3>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>月份</th>
                    <th>起始日期</th>
                    <th>结束日期</th>
                    <th>天数</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-100">
                  {previewDates.map((date) => {
                    const isCurrent = date.month === currentPeriod;
                    const start = new Date(date.start);
                    const end = new Date(date.end);
                    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                    return (
                      <tr key={date.month} className={isCurrent ? 'bg-emerald-50' : ''}>
                        <td className="font-medium">{date.month}</td>
                        <td className="font-mono">{date.start}</td>
                        <td className="font-mono">{date.end}</td>
                        <td className="number-font">{days} 天</td>
                        <td>
                          {isCurrent ? (
                            <span className="badge badge-success">当前周期</span>
                          ) : (
                            <span className="badge badge-info">待处理</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-navy-800 mb-4">节假日配置</h3>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-navy-600">排除节假日</span>
              <span
                className={`badge ${
                  reconciliationCycle.excludeHolidays ? 'badge-success' : 'badge-info'
                }`}
              >
                {reconciliationCycle.excludeHolidays ? '已启用' : '未启用'}
              </span>
            </div>
            {reconciliationCycle.excludeHolidays && (
              <div>
                <p className="text-sm text-navy-500 mb-3">
                  已配置 {reconciliationCycle.holidays.length} 个节假日
                </p>
                <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin">
                  {reconciliationCycle.holidays.map((holiday) => (
                    <div
                      key={holiday}
                      className="flex items-center justify-between p-2 bg-navy-50 rounded text-sm"
                    >
                      <span className="font-mono text-navy-700">{holiday}</span>
                      <RefreshCw size={14} className="text-navy-400" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="card p-6 bg-gradient-to-br from-navy-800 to-navy-900 text-white">
            <h3 className="text-lg font-semibold mb-4">对账流程说明</h3>
            <div className="space-y-4 text-sm">
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <p className="font-medium">数据拉取</p>
                  <p className="text-navy-300 text-xs">拉取调用记录、授权信息、退款和调整项</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <p className="font-medium">自动核对</p>
                  <p className="text-navy-300 text-xs">计算应收金额、确认金额，识别差异</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <p className="font-medium">差异处理</p>
                  <p className="text-navy-300 text-xs">标记重复调用、超授权、免费试用等</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-navy-500 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                  4
                </div>
                <div>
                  <p className="font-medium">报表导出</p>
                  <p className="text-navy-300 text-xs">生成客户对账单、内部汇总表和待跟进清单</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="编辑对账周期"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              取消
            </button>
            <button className="btn btn-primary" onClick={handleSubmit}>
              保存配置
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">周期名称</label>
            <input
              type="text"
              className="input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="label">周期类型</label>
            <select
              className="input"
              value={formData.cycleType}
              onChange={(e) => setFormData({ ...formData, cycleType: e.target.value as any })}
            >
              <option value="daily">日对账</option>
              <option value="weekly">周对账</option>
              <option value="monthly">月对账</option>
              <option value="quarterly">季度对账</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">起始日(每月)</label>
              <input
                type="number"
                min="1"
                max="31"
                className="input"
                value={formData.startDay}
                onChange={(e) => setFormData({ ...formData, startDay: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="label">结束日(每月)</label>
              <input
                type="number"
                min="1"
                max="31"
                className="input"
                value={formData.endDay}
                onChange={(e) => setFormData({ ...formData, endDay: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="excludeHolidays"
              className="w-4 h-4 text-navy-600 rounded"
              checked={formData.excludeHolidays}
              onChange={(e) => setFormData({ ...formData, excludeHolidays: e.target.checked })}
            />
            <label htmlFor="excludeHolidays" className="label mb-0">
              排除节假日（不计算在工作日内）
            </label>
          </div>
          {formData.excludeHolidays && (
            <div>
              <label className="label">节假日列表</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="date"
                  className="input flex-1"
                  value={newHoliday}
                  onChange={(e) => setNewHoliday(e.target.value)}
                />
                <button type="button" className="btn btn-primary" onClick={addHoliday}>
                  <Plus size={16} />
                </button>
              </div>
              <div className="space-y-1 max-h-[150px] overflow-y-auto scrollbar-thin">
                {formData.holidays.map((holiday) => (
                  <div
                    key={holiday}
                    className="flex items-center justify-between p-2 bg-navy-50 rounded text-sm"
                  >
                    <span className="font-mono">{holiday}</span>
                    <button
                      type="button"
                      className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                      onClick={() => removeHoliday(holiday)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
