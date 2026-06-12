import { useState } from 'react';
import { Plus, Edit2, Trash2, Tag, DollarSign, Layers, Calendar, CheckCircle } from 'lucide-react';
import { useReconciliationStore } from '@/store/useReconciliationStore';
import Modal from '@/components/Modal';
import StatusBadge from '@/components/StatusBadge';
import { BillingConfig as BillingConfigType } from '@/../shared/types';

export default function BillingConfig() {
  const { products } = useReconciliationStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [billingConfigs, setBillingConfigs] = useState<BillingConfigType[]>([
    {
      id: '1',
      name: '标准按次计费',
      type: 'per_call' as const,
      description: '适用于按调用次数计费的API服务',
      config: { unitPrice: 1.0 },
      createdAt: '2026-01-01',
    },
    {
      id: '2',
      name: '企业包月套餐',
      type: 'monthly' as const,
      description: '不限调用次数，按月收取固定费用',
      config: { monthlyFee: 5000 },
      createdAt: '2026-01-15',
    },
    {
      id: '3',
      name: '阶梯定价方案',
      type: 'tiered' as const,
      description: '调用量越大，单价越便宜',
      config: {
        tiers: [
          { minCalls: 0, maxCalls: 10000, unitPrice: 0.5 },
          { minCalls: 10001, maxCalls: 50000, unitPrice: 0.4 },
          { minCalls: 50001, maxCalls: 999999999, unitPrice: 0.3 },
        ],
      },
      createdAt: '2026-02-01',
    },
  ]);

  const [formData, setFormData] = useState({
    name: '',
    type: 'per_call' as 'per_call' | 'monthly' | 'tiered',
    description: '',
    unitPrice: 0,
    monthlyFee: 0,
    tiers: [] as Array<{ minCalls: number; maxCalls: number; unitPrice: number }>,
  });

  const openAddModal = () => {
    setEditingIndex(null);
    setFormData({
      name: '',
      type: 'per_call',
      description: '',
      unitPrice: 0,
      monthlyFee: 0,
      tiers: [],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (index: number) => {
    const config = billingConfigs[index];
    setEditingIndex(index);
    setFormData({
      name: config.name,
      type: config.type,
      description: config.description,
      unitPrice: config.config.unitPrice || 0,
      monthlyFee: config.config.monthlyFee || 0,
      tiers: config.config.tiers || [],
    });
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    let newConfig: BillingConfigType;

    if (formData.type === 'per_call') {
      newConfig = {
        id: String(Date.now()),
        name: formData.name,
        type: 'per_call',
        description: formData.description,
        config: { unitPrice: formData.unitPrice },
        createdAt: new Date().toISOString().split('T')[0],
      };
    } else if (formData.type === 'monthly') {
      newConfig = {
        id: String(Date.now()),
        name: formData.name,
        type: 'monthly',
        description: formData.description,
        config: { monthlyFee: formData.monthlyFee },
        createdAt: new Date().toISOString().split('T')[0],
      };
    } else {
      newConfig = {
        id: String(Date.now()),
        name: formData.name,
        type: 'tiered',
        description: formData.description,
        config: { tiers: formData.tiers },
        createdAt: new Date().toISOString().split('T')[0],
      };
    }

    if (editingIndex !== null) {
      const newConfigs = [...billingConfigs];
      newConfigs[editingIndex] = { ...newConfig, id: billingConfigs[editingIndex].id } as BillingConfigType;
      setBillingConfigs(newConfigs);
    } else {
      setBillingConfigs([...billingConfigs, newConfig]);
    }
    setIsModalOpen(false);
  };

  const addTier = () => {
    const lastTier = formData.tiers[formData.tiers.length - 1];
    const newTier = {
      minCalls: lastTier ? lastTier.maxCalls + 1 : 0,
      maxCalls: lastTier ? lastTier.maxCalls + 10000 : 10000,
      unitPrice: formData.unitPrice || 1,
    };
    setFormData({ ...formData, tiers: [...formData.tiers, newTier] });
  };

  const updateTier = (index: number, field: string, value: number) => {
    const newTiers = [...formData.tiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    setFormData({ ...formData, tiers: newTiers });
  };

  const removeTier = (index: number) => {
    const newTiers = formData.tiers.filter((_, i) => i !== index);
    setFormData({ ...formData, tiers: newTiers });
  };

  const typeIcons: Record<string, React.ReactNode> = {
    per_call: <DollarSign size={18} />,
    monthly: <Calendar size={18} />,
    tiered: <Layers size={18} />,
  };

  const typeLabels: Record<string, string> = {
    per_call: '按次计费',
    monthly: '包月计费',
    tiered: '阶梯计费',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">计费方式配置</h1>
          <p className="text-navy-500 mt-1">管理平台的计费规则和定价方案</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={16} className="mr-2" />
          新增计费方案
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {billingConfigs.map((config, index) => (
          <div key={config.id} className="card p-6 card-hover">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-navy-100 text-navy-600 rounded-lg">
                  {typeIcons[config.type]}
                </div>
                <div>
                  <h3 className="font-semibold text-navy-800">{config.name}</h3>
                  <span className="text-xs text-navy-500">{typeLabels[config.type]}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  className="p-1 hover:bg-navy-100 rounded text-navy-600 transition-colors"
                  onClick={() => openEditModal(index)}
                >
                  <Edit2 size={14} />
                </button>
                <button
                  className="p-1 hover:bg-rose-50 rounded text-rose-500 transition-colors"
                  onClick={() => setBillingConfigs(billingConfigs.filter((_, i) => i !== index))}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <p className="text-sm text-navy-500 mt-4">{config.description}</p>
            <div className="mt-4 pt-4 border-t border-navy-100">
              {config.type === 'per_call' && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-navy-600">单价</span>
                  <span className="font-semibold text-emerald-600 font-mono">
                    ¥{config.config.unitPrice?.toFixed(2)} / 次
                  </span>
                </div>
              )}
              {config.type === 'monthly' && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-navy-600">月费</span>
                  <span className="font-semibold text-emerald-600 font-mono">
                    ¥{config.config.monthlyFee?.toLocaleString()} / 月
                  </span>
                </div>
              )}
              {config.type === 'tiered' && config.config.tiers && (
                <div className="space-y-2">
                  <span className="text-sm text-navy-600">阶梯价格</span>
                  {config.config.tiers.map((tier, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-navy-500">
                        {tier.minCalls.toLocaleString()} - {tier.maxCalls.toLocaleString()} 次
                      </span>
                      <span className="font-mono text-emerald-600">¥{tier.unitPrice.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-4 text-xs text-navy-400">创建于 {config.createdAt}</div>
          </div>
        ))}
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold text-navy-800 mb-6">产品计费关联</h3>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>产品名称</th>
                <th>产品编码</th>
                <th>计费方式</th>
                <th>单价(元)</th>
                <th>月费(元)</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-100">
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="font-medium">
                    <div className="flex items-center gap-2">
                      <Tag size={16} className="text-navy-400" />
                      {product.name}
                    </div>
                  </td>
                  <td className="font-mono text-navy-600">{product.code}</td>
                  <td>
                    <span className="badge badge-info">{typeLabels[product.billingType]}</span>
                  </td>
                  <td className="number-font">
                    {product.billingType !== 'monthly' ? `¥${product.unitPrice.toFixed(2)}` : '-'}
                  </td>
                  <td className="number-font">
                    {product.monthlyFee ? `¥${product.monthlyFee.toLocaleString()}` : '-'}
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        product.status === 'active' ? 'badge-success' : 'badge-danger'
                      }`}
                    >
                      {product.status === 'active' ? '启用' : '停用'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingIndex !== null ? '编辑计费方案' : '新增计费方案'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              取消
            </button>
            <button className="btn btn-primary" onClick={handleSubmit}>
              {editingIndex !== null ? '保存修改' : '创建方案'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">方案名称</label>
            <input
              type="text"
              className="input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="输入计费方案名称"
            />
          </div>
          <div>
            <label className="label">计费类型</label>
            <select
              className="input"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
            >
              <option value="per_call">按次计费</option>
              <option value="monthly">包月计费</option>
              <option value="tiered">阶梯计费</option>
            </select>
          </div>
          <div>
            <label className="label">方案描述</label>
            <textarea
              className="input min-h-[80px]"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="描述计费方案的适用场景"
            />
          </div>
          {formData.type === 'per_call' && (
            <div>
              <label className="label">单次调用单价(元)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="input"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: Number(e.target.value) })}
              />
            </div>
          )}
          {formData.type === 'monthly' && (
            <div>
              <label className="label">月服务费(元)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="input"
                value={formData.monthlyFee}
                onChange={(e) => setFormData({ ...formData, monthlyFee: Number(e.target.value) })}
              />
            </div>
          )}
          {formData.type === 'tiered' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="label mb-0">阶梯配置</label>
                <button
                  type="button"
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                  onClick={addTier}
                >
                  + 添加阶梯
                </button>
              </div>
              {formData.tiers.length === 0 ? (
                <p className="text-sm text-navy-400 text-center py-4 bg-navy-50 rounded">
                  暂无阶梯配置，点击上方按钮添加
                </p>
              ) : (
                <div className="space-y-2">
                  {formData.tiers.map((tier, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 bg-navy-50 rounded">
                      <span className="text-sm text-navy-600 w-16">阶梯{index + 1}</span>
                      <input
                        type="number"
                        className="input flex-1"
                        placeholder="最小调用量"
                        value={tier.minCalls}
                        onChange={(e) => updateTier(index, 'minCalls', Number(e.target.value))}
                      />
                      <span className="text-navy-400">至</span>
                      <input
                        type="number"
                        className="input flex-1"
                        placeholder="最大调用量"
                        value={tier.maxCalls}
                        onChange={(e) => updateTier(index, 'maxCalls', Number(e.target.value))}
                      />
                      <span className="text-navy-400">单价:</span>
                      <input
                        type="number"
                        step="0.01"
                        className="input w-24"
                        placeholder="单价"
                        value={tier.unitPrice}
                        onChange={(e) => updateTier(index, 'unitPrice', Number(e.target.value))}
                      />
                      <button
                        type="button"
                        className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                        onClick={() => removeTier(index)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
