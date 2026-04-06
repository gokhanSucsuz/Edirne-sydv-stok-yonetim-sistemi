import React, { useEffect, useState } from 'react';
import { getPersonnel, getAllItems, getAllTransactions, getMasterItems, Personnel, Item, Transaction, UnitType } from '../lib/db';
import { Link } from 'react-router-dom';
import { Package, ArrowDownRight, ArrowUpRight, Users, PackageOpen, AlertTriangle, Droplets, Utensils, Home, Gift, Building2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

const UNITS: UnitType[] = ['Vefa Temizlik', 'Aşevi', 'Dergah', 'Bağış', 'Vakıf'];
const UNIT_ICONS = {
  'Vefa Temizlik': Droplets,
  'Aşevi': Utensils,
  'Dergah': Home,
  'Bağış': Gift,
  'Vakıf': Building2
};
const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

interface UnitStats {
  name: UnitType;
  itemCount: number;
  lowStockCount: number;
  transactionCount: number;
}

export default function Dashboard() {
  const [personnelCount, setPersonnelCount] = useState(0);
  const [masterItemsCount, setMasterItemsCount] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [personnelMap, setPersonnelMap] = useState<Record<number, string>>({});
  const [unitStats, setUnitStats] = useState<UnitStats[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const p = await getPersonnel();
      setPersonnelCount(p.length);
      
      const pMap: Record<number, string> = {};
      p.forEach(person => {
        if (person.id) pMap[person.id] = person.name;
      });
      setPersonnelMap(pMap);

      const items = await getAllItems();
      const mItems = await getMasterItems();
      setMasterItemsCount(mItems.length);

      const txs = await getAllTransactions();
      setRecentTransactions(txs.sort((a, b) => b.date - a.date).slice(0, 5));

      // Calculate per-unit stats
      const stats: UnitStats[] = UNITS.map(unit => {
        const unitItems = items.filter(i => i.unit === unit);
        const unitTxs = txs.filter(t => t.unit === unit);
        const lowStock = unitItems.filter(i => {
          const threshold = i.tenderLimit ? Math.max(i.tenderLimit * 0.1, 2) : 2;
          return i.currentStock < threshold;
        });

        return {
          name: unit,
          itemCount: unitItems.length,
          lowStockCount: lowStock.length,
          transactionCount: unitTxs.length
        };
      });

      setUnitStats(stats);
      setChartData(stats.map(s => ({ name: s.name, value: s.itemCount })));
    };
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Gösterge Paneli</h1>
        <div className="text-sm text-gray-500">Son Güncelleme: {new Date().toLocaleTimeString('tr-TR')}</div>
      </div>

      {/* Global Alerts */}
      <div className="space-y-3">
        {personnelCount === 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <Users className="h-5 w-5 text-yellow-400" />
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Sistemde kayıtlı personel bulunmuyor. <Link to="/personnel" className="font-medium underline">Personel ekleyin</Link>.
                </p>
              </div>
            </div>
          </div>
        )}

        {masterItemsCount === 0 && (
          <div className="bg-orange-50 border-l-4 border-orange-400 p-4">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-orange-400" />
              <div className="ml-3">
                <p className="text-sm text-orange-700">
                  Sistemde tanımlı malzeme bulunmuyor. <Link to="/master-items" className="font-medium underline">Malzeme tanımlayın</Link>.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white p-5 shadow rounded-lg flex items-center">
          <div className="p-3 bg-red-100 rounded-full">
            <Users className="h-6 w-6 text-red-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Kayıtlı Personel</p>
            <p className="text-2xl font-semibold text-gray-900">{personnelCount}</p>
          </div>
        </div>
        <div className="bg-white p-5 shadow rounded-lg flex items-center">
          <div className="p-3 bg-blue-100 rounded-full">
            <PackageOpen className="h-6 w-6 text-blue-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Tanımlı Malzeme</p>
            <p className="text-2xl font-semibold text-gray-900">{masterItemsCount}</p>
          </div>
        </div>
        <div className="bg-white p-5 shadow rounded-lg flex items-center">
          <div className="p-3 bg-green-100 rounded-full">
            <Package className="h-6 w-6 text-green-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Toplam Stok Kalemi</p>
            <p className="text-2xl font-semibold text-gray-900">{unitStats.reduce((acc, s) => acc + s.itemCount, 0)}</p>
          </div>
        </div>
        <div className="bg-white p-5 shadow rounded-lg flex items-center">
          <div className="p-3 bg-yellow-100 rounded-full">
            <AlertTriangle className="h-6 w-6 text-yellow-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Düşük Stok Uyarısı</p>
            <p className="text-2xl font-semibold text-gray-900">{unitStats.reduce((acc, s) => acc + s.lowStockCount, 0)}</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 shadow rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Birimlere Göre Malzeme Dağılımı</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 shadow rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Stok Oranı</h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-bold">{unitStats.reduce((acc, s) => acc + s.itemCount, 0)}</span>
              <span className="text-xs text-gray-500">Toplam</span>
            </div>
          </div>
        </div>
      </div>

      {/* Unit Specific Cards */}
      <h2 className="text-xl font-semibold text-gray-900 mt-8">Birim Bazlı İstatistikler</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {unitStats.map((stats, index) => {
          const Icon = UNIT_ICONS[stats.name];
          const unitPath = stats.name === 'Vefa Temizlik' ? 'vefa' : 
                           stats.name === 'Aşevi' ? 'asevi' :
                           stats.name === 'Dergah' ? 'dergah' :
                           stats.name === 'Bağış' ? 'bagis' : 'vakif';
          
          return (
            <Link key={stats.name} to={`/unit/${unitPath}`} className="bg-white p-6 shadow rounded-lg hover:shadow-md transition-shadow border-t-4" style={{ borderTopColor: COLORS[index % COLORS.length] }}>
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-gray-50 rounded-lg">
                  <Icon className="h-6 w-6 text-gray-600" />
                </div>
                {stats.lowStockCount > 0 && (
                  <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {stats.lowStockCount} Uyarı
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">{stats.name}</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Toplam Malzeme:</span>
                  <span className="font-semibold">{stats.itemCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Toplam İşlem:</span>
                  <span className="font-semibold">{stats.transactionCount}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 mt-4">
                  <div 
                    className="h-1.5 rounded-full" 
                    style={{ 
                      width: `${stats.itemCount > 0 ? 100 : 0}%`, 
                      backgroundColor: COLORS[index % COLORS.length] 
                    }} 
                  />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-white shadow sm:rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Son İşlemler</h3>
          <Link to="/statistics" className="text-sm text-red-600 hover:text-red-800 font-medium">Tüm Raporlar →</Link>
        </div>
        <ul className="divide-y divide-gray-200">
          {recentTransactions.length === 0 ? (
            <li className="px-4 py-8 text-center text-gray-500">Henüz işlem bulunmuyor.</li>
          ) : (
            recentTransactions.map((tx) => (
              <li key={tx.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-full mr-3 ${tx.type === 'GİRİŞ' ? 'bg-green-100' : 'bg-red-100'}`}>
                      {tx.type === 'GİRİŞ' ? (
                        <ArrowDownRight className={`h-4 w-4 ${tx.type === 'GİRİŞ' ? 'text-green-600' : 'text-red-600'}`} />
                      ) : (
                        <ArrowUpRight className={`h-4 w-4 ${tx.type === 'GİRİŞ' ? 'text-green-600' : 'text-red-600'}`} />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        {tx.unit}
                      </p>
                      <p className="text-xs text-gray-500">{tx.type} İşlemi</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{tx.quantity} Birim</p>
                    <p className="text-xs text-gray-500">{new Date(tx.date).toLocaleDateString('tr-TR')}</p>
                  </div>
                </div>
                <div className="mt-2 flex justify-between items-center">
                  <p className="text-xs text-gray-500">
                    Sorumlu: <span className="font-medium text-gray-700">{personnelMap[tx.personnelId] || 'Bilinmiyor'}</span>
                  </p>
                  <p className="text-xs text-gray-400">Evrak: {tx.documentNo}</p>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

