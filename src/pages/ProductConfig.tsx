import { useState } from 'react';
import { Plus, Edit2, Trash2, Search, Package, Tag } from 'lucide-react';
import { useReconciliationStore } from '@/store/useReconciliationStore';
import { DataProduct, TierPrice } from '@/../shared/types';
import Modal from '@/components/Modal';
import { generateId } from '@/data/mockData';

export default function ProductConfig() {
  const { products, addProduct, updateProduct, deleteProduct } = useReconciliationStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<DataProduct | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    billingType: 'per_call' as DataProduct['billingType'],
    unitPrice: 0,
    monthlyFee: 0,
    tierPrices: [] as TierPrice[],
    status: 'active' as DataProduct['status'],
  });

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      billingType: 'per_call',
      unitPrice: 0,
      monthlyFee: 0,
      tierPrices: [],
      status: 'active',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (product: DataProduct) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      code: product.code,
      description: product.description,
      billingType: product.billingType,
      unitPrice: product.unitPrice,
      monthlyFee: product.monthlyFee || 0,
      tierPrices: product.tierPrices || [],
      status: product.status,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    if (editingProduct) {
      updateProduct({
        ...editingProduct,
        ...formData,
      });
    } else {
      addProduct(formData);
    }
    setIsModalOpen(false);
  };

  const addTier = () => {
    const newTier: TierPrice = {
      minCalls: formData.tierPrices.length > 0 ? formData.tierPrices[formData.tierPrices.length - 1].maxCalls + 1 : 0,
      maxCalls: (formData.tierPrices.length > 0 ? formData.tierPrices[formData.tierPrices.length - 1].maxCalls + 1 : 0) + 10000,
      unitPrice: formData.unitPrice,
    };
    setFormData({ ...formData, tierPrices: [...formData.tierPrices, newTier] });
  };

  const updateTier = (index: number, field: keyof TierPrice, value: number) => {
    const newTiers = [...formData.tierPrices];
    newTiers[index] = { ...newTiers[index], [field]: value };
    setFormData({ ...formData, tierPrices: newTiers });
  };

  const removeTier = (index: number) => {
    const newTiers = formData.tierPrices.filter((_, i) => i !== index);
    setFormData({ ...formData, tierPrices: newTiers });
  };

  const billingTypeLabels: Record<string, string> = {
    per_call: '按次计费',
    monthly: '包月计费',
    tiered: '阶梯计费',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">数据产品配置</h1>
          <p className="text-navy-500 mt-1">管理平台提供的数据产品及其定价规则</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={16} className="mr-2" />
          新增产品
        </button>
      </div>

      <div className="card p-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
            <input
              type="text"
              placeholder="搜索产品名称或编码..."
              className="input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>产品编码</th>
                <th>产品名称</th>
                <th>计费方式</th>
                <th>单价(元)</th>
                <th>月费(元)</th>
                <th>状态</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-100">
              {filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td className="font-mono text-navy-600">{product.code}</td>
                  <td className="font-medium">
                    <div className="flex items-center gap-2">
                      <Package size={16} className="text-navy-400" />
                      {product.name}
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-info">
                      <Tag size={12} className="mr-1" />
                      {billingTypeLabels[product.billingType]}
                    </span>
                  </td>
                  <td className="number-font">¥{product.unitPrice.toFixed(2)}</td>
                  <td className="number-font">
                    {product.monthlyFee ? `¥${product.monthlyFee.toFixed(2)}` : '-'}
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
                  <td className="text-navy-500">{product.createdAt}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button
                        className="p-1 hover:bg-navy-100 rounded text-navy-600 transition-colors"
                        onClick={() => openEditModal(product)}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="p-1 hover:bg-rose-50 rounded text-rose-500 transition-colors"
                        onClick={() => deleteProduct(product.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
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
        title={editingProduct ? '编辑数据产品' : '新增数据产品'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              取消
            </button>
            <button className="btn btn-primary" onClick={handleSubmit}>
              {editingProduct ? '保存修改' : '创建产品'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">产品编码</label>
              <input
                type="text"
                className="input"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="如: API-CREDIT-001"
              />
            </div>
            <div>
              <label className="label">产品名称</label>
              <input
                type="text"
                className="input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="输入产品名称"
              />
            </div>
          </div>
          <div>
            <label className="label">产品描述</label>
            <textarea
              className="input min-h-[80px]"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="描述产品的功能和用途"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">计费方式</label>
              <select
                className="input"
                value={formData.billingType}
                onChange={(e) =>
                  setFormData({ ...formData, billingType: e.target.value as DataProduct['billingType'] })
                }
              >
                <option value="per_call">按次计费</option>
                <option value="monthly">包月计费</option>
                <option value="tiered">阶梯计费</option>
              </select>
            </div>
            <div>
              <label className="label">状态</label>
              <select
                className="input"
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as DataProduct['status'] })
                }
              >
                <option value="active">启用</option>
                <option value="inactive">停用</option>
              </select>
            </div>
          </div>
          {formData.billingType !== 'monthly' && (
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
          {formData.billingType === 'monthly' && (
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
          {formData.billingType === 'tiered' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="label mb-0">阶梯定价</label>
                <button
                  type="button"
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                  onClick={addTier}
                >
                  + 添加阶梯
                </button>
              </div>
              {formData.tierPrices.length === 0 ? (
                <p className="text-sm text-navy-400 text-center py-4 bg-navy-50 rounded">
                  暂无阶梯配置，点击上方按钮添加
                </p>
              ) : (
                <div className="space-y-2">
                  {formData.tierPrices.map((tier, index) => (
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
