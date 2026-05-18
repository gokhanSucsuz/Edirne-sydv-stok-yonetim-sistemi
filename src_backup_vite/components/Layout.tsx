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
  X,
  PackageOpen,
  BookOpen,
  LogOut,
  User as UserIcon,
  Database
} from 'lucide-react';
import { cn } from '../lib/utils';
import { APP_LOGO_URL, APP_NAME, APP_SUBTITLE } from '../constants';
import { useAuth } from '../contexts/AuthContext';

const navigation = [
  { name: 'Gösterge Paneli', href: '/', icon: LayoutDashboard },
  { name: 'İhale Yönetimi', href: '/tenders', icon: PackageOpen },
  { name: 'Malzeme Tanımları', href: '/master-items', icon: PackageOpen },
  { name: 'Personel Yönetimi', href: '/personnel', icon: Users },
  { name: 'Vefa Temizlik', href: '/unit/vefa', icon: Droplets },
  { name: 'Aşevi', href: '/unit/asevi', icon: Utensils },
  { name: 'Dergah', href: '/unit/dergah', icon: Home },
  { name: 'Bağış', href: '/unit/bagis', icon: Gift },
  { name: 'Vakıf', href: '/unit/vakif', icon: Building2 },
  { name: 'İstatistik & Raporlar', href: '/statistics', icon: BarChart3 },
  { name: 'Yedekleme & Güvenlik', href: '/backup', icon: Database },
  { name: 'Kullanım Kılavuzu', href: '/guide', icon: BookOpen },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const { personnel, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Çıkış yapılırken hata oluştu:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar */}
      <div className={cn("fixed inset-0 z-50 lg:hidden", sidebarOpen ? "block" : "hidden")}>
        <div className="fixed inset-0 bg-gray-900/80" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl flex flex-col">
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
            <div className="flex items-center">
              <img src={APP_LOGO_URL} alt="Logo" className="w-8 h-8 mr-2 rounded-full" referrerPolicy="no-referrer" />
              <span className="text-lg font-bold text-gray-900">{APP_NAME}</span>
            </div>
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
          {personnel && (
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center mb-4">
                <div className="bg-red-100 p-2 rounded-full mr-3">
                  <UserIcon className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{personnel.name}</p>
                  <p className="text-xs text-gray-500">{personnel.title}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-2 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md"
              >
                <LogOut className="mr-3 h-5 w-5" />
                Çıkış Yap
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64 border-r border-gray-200 bg-white">
          <div className="flex flex-col items-center justify-center py-6 px-4 border-b border-gray-200 bg-red-600">
            <img src={APP_LOGO_URL} alt="Logo" className="w-16 h-16 mb-2 rounded-full border-2 border-white shadow-lg" referrerPolicy="no-referrer" />
            <span className="text-lg font-bold text-white text-center leading-tight">{APP_NAME}<br/><span className="text-sm font-normal opacity-90">{APP_SUBTITLE}</span></span>
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
          {personnel && (
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center mb-4">
                <div className="bg-red-100 p-2 rounded-full mr-3">
                  <UserIcon className="w-5 h-5 text-red-600" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-bold text-gray-900 truncate">{personnel.name}</p>
                  <p className="text-xs text-gray-500 truncate">{personnel.title}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-2 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                <LogOut className="mr-3 h-5 w-5" />
                Çıkış Yap
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        <div className="lg:hidden flex items-center justify-between h-16 px-4 bg-red-600 border-b border-gray-200">
          <div className="flex items-center">
            <img src={APP_LOGO_URL} alt="Logo" className="w-8 h-8 mr-2 rounded-full border border-white" referrerPolicy="no-referrer" />
            <span className="text-lg font-bold text-white">{APP_NAME}</span>
          </div>
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
