import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Settings,
  Database,
  FileCheck,
  AlertTriangle,
  Download,
  ChevronDown,
  ChevronRight,
  Package,
  Users,
  Calendar,
  Tag,
} from 'lucide-react';

const menuItems = [
  {
    path: '/',
    label: '工作台',
    icon: LayoutDashboard,
  },
  {
    label: '配置管理',
    icon: Settings,
    children: [
      { path: '/config/products', label: '数据产品配置', icon: Package },
      { path: '/config/customers', label: '客户配置', icon: Users },
      { path: '/config/billing', label: '计费方式配置', icon: Tag },
      { path: '/config/cycle', label: '对账周期配置', icon: Calendar },
    ],
  },
  {
    path: '/fetch',
    label: '数据拉取',
    icon: Database,
  },
  {
    path: '/reconciliation',
    label: '对账核对',
    icon: FileCheck,
  },
  {
    path: '/discrepancy',
    label: '差异处理',
    icon: AlertTriangle,
  },
  {
    path: '/export',
    label: '报表导出',
    icon: Download,
  },
];

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['配置管理']);

  const toggleMenu = (label: string) => {
    setExpandedMenus((prev) =>
      prev.includes(label) ? prev.filter((m) => m !== label) : [...prev, label]
    );
  };

  return (
    <div className="flex h-screen bg-navy-50">
      <aside className="w-64 bg-navy-900 text-navy-100 flex flex-col">
        <div className="p-6 border-b border-navy-800">
          <h1 className="text-xl font-bold text-white">数据对账平台</h1>
          <p className="text-xs text-navy-400 mt-1">Data Reconciliation System</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin">
          {menuItems.map((item) => (
            <div key={item.label}>
              {'children' in item ? (
                <>
                  <button
                    onClick={() => toggleMenu(item.label)}
                    className="sidebar-link w-full justify-between text-navy-300 hover:text-white"
                  >
                    <span className="flex items-center gap-3">
                      <item.icon size={18} />
                      {item.label}
                    </span>
                    {expandedMenus.includes(item.label) ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                  </button>
                  {expandedMenus.includes(item.label) && (
                    <div className="ml-4 mt-1 space-y-1">
                      {item.children.map((child) => (
                        <NavLink
                          key={child.path}
                          to={child.path}
                          className={({ isActive }) =>
                            `sidebar-link text-navy-400 ${
                              isActive ? 'sidebar-link-active text-white' : 'hover:text-white'
                            }`
                          }
                        >
                          <child.icon size={16} className="mr-2" />
                          {child.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <NavLink
                  to={item.path}
                  end
                  className={({ isActive }) =>
                    `sidebar-link text-navy-300 ${
                      isActive ? 'sidebar-link-active text-white' : 'hover:text-white'
                    }`
                  }
                >
                  <item.icon size={18} className="mr-3" />
                  {item.label}
                </NavLink>
              )}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-navy-800">
          <div className="text-xs text-navy-400">
            <p>运营人员: 张运营</p>
            <p className="mt-1">上次登录: 2026-06-13 09:30</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-navy-100 px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-navy-800">
              数据要素流通对账自动化工具
            </h2>
            <span className="badge badge-info">V1.0.0</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-navy-500">对账周期: 2026-05</span>
            <div className="h-8 w-8 bg-emerald-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
              运
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 scrollbar-thin">
          {children}
        </div>
      </main>
    </div>
  );
}
