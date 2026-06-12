import { useState } from 'react';
import { Plus, Edit2, Trash2, Search, Users, User, Mail, Phone, Calendar, Tag, X } from 'lucide-react';
import { useReconciliationStore } from '@/store/useReconciliationStore';
import { Customer, AuthorizedProduct } from '@/../shared/types';
import Modal from '@/components/Modal';
import { generateId } from '@/data/mockData';

export default function CustomerConfig() {
  const { customers, products, addCustomer, updateCustomer, deleteCustomer } = useReconciliationStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editingAuthIndex, setEditingAuthIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    email: '',
    phone: '',
    authorizedProducts: [] as AuthorizedProduct[],
    status: 'active' as Customer['status'],
  });
  const [authFormData, setAuthFormData] = useState({
    productId: '',
    productName: '',
    startDate: '',
    endDate: '',
    maxCallsPerMonth: 0,
    pricingType: 'standard' as AuthorizedProduct['pricingType'],
    discountRate: 1,
  });

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.contact.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openAddModal = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      contact: '',
      email: '',
      phone: '',
      authorizedProducts: [],
      status: 'active',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      contact: customer.contact,
      email: customer.email,
      phone: customer.phone,
      authorizedProducts: [...customer.authorizedProducts],
      status: customer.status,
    });
    setIsModalOpen(true);
  };

  const openAddAuthModal = () => {
    setEditingAuthIndex(null);
    setAuthFormData({
      productId: '',
      productName: '',
      startDate: '',
      endDate: '',
      maxCallsPerMonth: 0,
      pricingType: 'standard',
      discountRate: 1,
    });
    setIsAuthModalOpen(true);
  };

  const openEditAuthModal = (index: number) => {
    setEditingAuthIndex(index);
    const auth = formData.authorizedProducts[index];
    setAuthFormData({
      productId: auth.productId,
      productName: auth.productName,
      startDate: auth.startDate,
      endDate: auth.endDate,
      maxCallsPerMonth: auth.maxCallsPerMonth || 0,
      pricingType: auth.pricingType,
      discountRate: auth.discountRate || 1,
    });
    setIsAuthModalOpen(true);
  };

  const handleAuthSubmit = () => {
    const product = products.find((p) => p.id === authFormData.productId);
    if (!product) return;

    const newAuth: AuthorizedProduct = {
      id: generateId('auth'),
      productId: authFormData.productId,
      productName: product.name,
      startDate: authFormData.startDate,
      endDate: authFormData.endDate,
      maxCallsPerMonth: authFormData.maxCallsPerMonth > 0 ? authFormData.maxCallsPerMonth : undefined,
      pricingType: authFormData.pricingType,
      discountRate: authFormData.pricingType === 'discount' ? authFormData.discountRate : undefined,
    };

    let newAuths: AuthorizedProduct[];
    if (editingAuthIndex !== null) {
      newAuths = [...formData.authorizedProducts];
      newAuths[editingAuthIndex] = newAuth;
    } else {
      newAuths = [...formData.authorizedProducts, newAuth];
    }

    setFormData({ ...formData, authorizedProducts: newAuths });
    setIsAuthModalOpen(false);
  };

  const removeAuth = (index: number) => {
    const newAuths = formData.authorizedProducts.filter((_, i) => i !== index);
    setFormData({ ...formData, authorizedProducts: newAuths });
  };

  const handleSubmit = () => {
    if (editingCustomer) {
      updateCustomer({
        ...editingCustomer,
        ...formData,
      });
    } else {
      addCustomer(formData);
    }
    setIsModalOpen(false);
  };

  const pricingTypeLabels: Record<string, string> = {
    standard: '标准定价',
    discount: '折扣定价',
    free_trial: '免费试用',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">客户配置</h1>
          <p className="text-navy-500 mt-1">管理客户信息和数据产品授权</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={16} className="mr-2" />
          新增客户
        </button>
      </div>

      <div className="card p-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
            <input
              type="text"
              placeholder="搜索客户名称或联系人..."
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
                <th>客户名称</th>
                <th>联系人</th>
                <th>联系电话</th>
                <th>电子邮箱</th>
                <th>授权产品数</th>
                <th>状态</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-100">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id}>
                  <td className="font-medium">
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-navy-400" />
                      {customer.name}
                    </div>
                  </td>
                  <td className="text-navy-600">{customer.contact}</td>
                  <td className="number-font">{customer.phone}</td>
                  <td className="text-navy-600">{customer.email}</td>
                  <td>
                    <span className="badge badge-info">{customer.authorizedProducts.length} 个</span>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        customer.status === 'active' ? 'badge-success' : 'badge-danger'
                      }`}
                    >
                      {customer.status === 'active' ? '启用' : '停用'}
                    </span>
                  </td>
                  <td className="text-navy-500">{customer.createdAt}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button
                        className="p-1 hover:bg-navy-100 rounded text-navy-600 transition-colors"
                        onClick={() => openEditModal(customer)}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="p-1 hover:bg-rose-50 rounded text-rose-500 transition-colors"
                        onClick={() => deleteCustomer(customer.id)}
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
        title={editingCustomer ? '编辑客户' : '新增客户'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              取消
            </button>
            <button className="btn btn-primary" onClick={handleSubmit}>
              {editingCustomer ? '保存修改' : '创建客户'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">客户名称</label>
              <div className="relative">
                <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
                <input
                  type="text"
                  className="input pl-10"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="输入客户名称"
                />
              </div>
            </div>
            <div>
              <label className="label">联系人</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
                <input
                  type="text"
                  className="input pl-10"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  placeholder="输入联系人姓名"
                />
              </div>
            </div>
            <div>
              <label className="label">联系电话</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
                <input
                  type="tel"
                  className="input pl-10"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="输入联系电话"
                />
              </div>
            </div>
            <div>
              <label className="label">电子邮箱</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
                <input
                  type="email"
                  className="input pl-10"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="输入电子邮箱"
                />
              </div>
            </div>
          </div>
          <div>
            <label className="label">状态</label>
            <select
              className="input"
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value as Customer['status'] })
              }
            >
              <option value="active">启用</option>
              <option value="inactive">停用</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">授权产品</label>
              <button
                type="button"
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                onClick={openAddAuthModal}
              >
                + 添加授权
              </button>
            </div>
            {formData.authorizedProducts.length === 0 ? (
              <p className="text-sm text-navy-400 text-center py-4 bg-navy-50 rounded">
                暂无授权产品，点击上方按钮添加
              </p>
            ) : (
              <div className="space-y-2">
                {formData.authorizedProducts.map((auth, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-navy-50 rounded"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-navy-800">{auth.productName}</span>
                        <span className="badge badge-info">
                          {pricingTypeLabels[auth.pricingType]}
                        </span>
                        {auth.maxCallsPerMonth && (
                          <span className="text-xs text-navy-500">
                            月限 {auth.maxCallsPerMonth.toLocaleString()} 次
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-navy-500 mt-1 flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {auth.startDate} ~ {auth.endDate}
                        </span>
                        {auth.pricingType === 'discount' && auth.discountRate && (
                          <span className="flex items-center gap-1">
                            <Tag size={12} />
                            {(auth.discountRate * 100).toFixed(0)}% 折扣
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className="p-1 text-navy-500 hover:bg-navy-100 rounded"
                        onClick={() => openEditAuthModal(index)}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                        onClick={() => removeAuth(index)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        title={editingAuthIndex !== null ? '编辑授权' : '添加授权'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsAuthModalOpen(false)}>
              取消
            </button>
            <button className="btn btn-primary" onClick={handleAuthSubmit}>
              {editingAuthIndex !== null ? '保存修改' : '添加授权'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">数据产品</label>
            <select
              className="input"
              value={authFormData.productId}
              onChange={(e) => {
                const product = products.find((p) => p.id === e.target.value);
                setAuthFormData({
                  ...authFormData,
                  productId: e.target.value,
                  productName: product?.name || '',
                });
              }}
            >
              <option value="">请选择数据产品</option>
              {products
                .filter((p) => p.status === 'active')
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code})
                  </option>
                ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">授权开始日期</label>
              <input
                type="date"
                className="input"
                value={authFormData.startDate}
                onChange={(e) => setAuthFormData({ ...authFormData, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="label">授权结束日期</label>
              <input
                type="date"
                className="input"
                value={authFormData.endDate}
                onChange={(e) => setAuthFormData({ ...authFormData, endDate: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="label">月调用上限(0表示不限)</label>
            <input
              type="number"
              min="0"
              className="input"
              value={authFormData.maxCallsPerMonth}
              onChange={(e) =>
                setAuthFormData({ ...authFormData, maxCallsPerMonth: Number(e.target.value) })
              }
            />
          </div>
          <div>
            <label className="label">定价类型</label>
            <select
              className="input"
              value={authFormData.pricingType}
              onChange={(e) =>
                setAuthFormData({
                  ...authFormData,
                  pricingType: e.target.value as AuthorizedProduct['pricingType'],
                })
              }
            >
              <option value="standard">标准定价</option>
              <option value="discount">折扣定价</option>
              <option value="free_trial">免费试用</option>
            </select>
          </div>
          {authFormData.pricingType === 'discount' && (
            <div>
              <label className="label">折扣率(如0.9表示9折)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                className="input"
                value={authFormData.discountRate}
                onChange={(e) =>
                  setAuthFormData({ ...authFormData, discountRate: Number(e.target.value) })
                }
              />
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
