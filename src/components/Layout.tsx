import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  Droplets, 
  Utensils, 
  Home, 
  Gift, 
  Building2,
  Menu,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';

const navigation = [
  { name: 'Gösterge Paneli', href: '/', icon: LayoutDashboard },
  { name: 'Personel Yönetimi', href: '/personnel', icon: Users },
  { name: 'Vefa Temizlik', href: '/unit/vefa', icon: Droplets },
  { name: 'Aşevi', href: '/unit/asevi', icon: Utensils },
  { name: 'Dergah', href: '/unit/dergah', icon: Home },
  { name: 'Bağış', href: '/unit/bagis', icon: Gift },
  { name: 'Vakıf', href: '/unit/vakif', icon: Building2 },
  { name: 'İstatistik & Raporlar', href: '/statistics', icon: BarChart3 },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar */}
      <div className={cn("fixed inset-0 z-50 lg:hidden", sidebarOpen ? "block" : "hidden")}>
        <div className="fixed inset-0 bg-gray-900/80" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl flex flex-col">
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
            <span className="text-lg font-bold text-gray-900">Edirne SYDV Stok</span>
            <button onClick={() => setSidebarOpen(false)} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  cn(
                    isActive ? 'bg-red-50 text-red-700' : 'text-gray-700 hover:bg-gray-100',
                    'group flex items-center px-2 py-2 text-base font-medium rounded-md'
                  )
                }
              >
                <item.icon className={cn("mr-4 flex-shrink-0 h-6 w-6")} aria-hidden="true" />
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64 border-r border-gray-200 bg-white">
          <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200 bg-red-600">
            <span className="text-lg font-bold text-white text-center">Edirne SYDV<br/><span className="text-sm font-normal">Stok Yönetim Sistemi</span></span>
          </div>
          <div className="flex flex-col flex-1 overflow-y-auto">
            <nav className="flex-1 px-2 py-4 space-y-1">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    cn(
                      isActive ? 'bg-red-50 text-red-700' : 'text-gray-700 hover:bg-gray-100',
                      'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                    )
                  }
                >
                  <item.icon className={cn("mr-3 flex-shrink-0 h-5 w-5")} aria-hidden="true" />
                  {item.name}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        <div className="lg:hidden flex items-center justify-between h-16 px-4 bg-red-600 border-b border-gray-200">
          <span className="text-lg font-bold text-white">Edirne SYDV Stok</span>
          <button onClick={() => setSidebarOpen(true)} className="text-white hover:text-gray-200">
            <Menu className="w-6 h-6" />
          </button>
        </div>
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
