'use client';

import React, { useEffect, useState } from 'react';
import { getPersonnel, getAllItems, getAllTransactions, getMasterItems, getBackups, Personnel, Item, Transaction, UnitType } from '@/lib/db';
import { Timestamp } from 'firebase/firestore';
import Link from 'next/link';

import { Package, ArrowDownRight, ArrowUpRight, ArrowRight, Users, PackageOpen, AlertTriangle, AlertCircle, Droplets, Utensils, Home, Gift, Building2, FileText, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { generateMonthlyInventoryReport } from '@/lib/reports';

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
  zeroStockCount: number;
  transactionCount: number;
}

interface BackupRecord {
  id: string;
  createdAt: Timestamp;
  type: string;
  status: string;
  fileName: string;
  size: string;
}

export default function Dashboard() {
  const [backupAlert, setBackupAlert] = useState(false);

  useEffect(() => {
    const checkBackup = async () => {
      const backups = await getBackups() as unknown as BackupRecord[];
      if (backups.length > 0) {
        const lastBackup = backups[0].createdAt.toDate();
        const diff = new Date().getTime() - lastBackup.getTime();
        const days = diff / (1000 * 60 * 60 * 24);
        if (days > 10) setBackupAlert(true);
      } else {
        setBackupAlert(true);
      }
    };
    checkBackup();
  }, []);
  const [personnelCount, setPersonnelCount] = useState(0);
  const [masterItemsCount, setMasterItemsCount] = useState(0);
  const [tendersCount, setTendersCount] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [personnelMap, setPersonnelMap] = useState<Record<number, string>>({});
  const [unitStats, setUnitStats] = useState<UnitStats[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [allPersonnel, setAllPersonnel] = useState<Personnel[]>([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportMonth, setReportMonth] = useState(new Date().getMonth());
  const [reportYear, setReportYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const loadData = async () => {
      const p = await getPersonnel();
      setAllPersonnel(p);
      setPersonnelCount(p.length);
      
      const pMap: Record<string, string> = {};
      p.forEach(person => {
        if (person.id) pMap[person.id] = person.name;
      });
      setPersonnelMap(pMap);

      const items = await getAllItems();
      setAllItems(items);
      const mItems = await getMasterItems();
      setMasterItemsCount(mItems.length);

      // Count unique tenders
      const uniqueTenders = new Set(items.filter(i => i.tenderName).map(i => `${i.tenderName}-${i.unit}`));
      setTendersCount(uniqueTenders.size);

      const txs = await getAllTransactions();
      setAllTransactions(txs);
      setRecentTransactions(txs.sort((a, b) => b.date - a.date).slice(0, 5));

      // Calculate per-unit stats
      const stats: UnitStats[] = UNITS.map(unit => {
        const unitItems = items.filter(i => i.unit === unit);
        const unitTxs = txs.filter(t => t.unit === unit);
        
        // Group items by name within the unit to check total stock
        const groupedByProduct = unitItems.reduce((acc, item) => {
          if (!acc[item.name]) {
            acc[item.name] = { totalStock: 0, totalLimit: 0, latestCreatedAt: 0 };
          }
          acc[item.name].totalStock += item.currentStock;
          // Use the limit of the most recently created tender as the reference for low stock calculation
          if (item.createdAt > (acc[item.name].latestCreatedAt || 0)) {
            acc[item.name].totalLimit = (item.tenderLimit || 0);
            acc[item.name].latestCreatedAt = item.createdAt;
          }
          return acc;
        }, {} as Record<string, { totalStock: number, totalLimit: number, latestCreatedAt: number }>);

        const productValues = Object.values(groupedByProduct);
        const zeroStock = productValues.filter(p => p.totalStock <= 0);
        const lowStock = productValues.filter(p => {
          if (p.totalStock <= 0) return false;
          const threshold = p.totalLimit ? Math.max(p.totalLimit * 0.1, 2) : 2;
          return p.totalStock < threshold;
        });

        return {
          name: unit,
          itemCount: Object.keys(groupedByProduct).length,
          zeroStockCount: zeroStock.length,
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
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowReportModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <FileText className="w-4 h-4 mr-2" />
            Aylık Envanter Raporu Al
          </button>
          <div className="text-sm text-gray-500">Son Güncelleme: {new Date().toLocaleTimeString('tr-TR')}</div>
        </div>
      </div>

      {/* Global Alerts */}
      <div className="space-y-3">
        {backupAlert && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md shadow-sm animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-red-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700 font-bold">
                    DİKKAT: Veri yedekleme periyodu (10 gün) aşılmıştır!
                  </p>
                  <p className="text-xs text-red-600">
                    Veri güvenliği için lütfen acilen manuel yedek alınız veya otomatik yedeklemeyi kontrol ediniz.
                  </p>
                </div>
              </div>
              <Link
                to="/backup"
                className="flex items-center text-sm font-medium text-red-700 hover:text-red-600"
              >
                Yedekleme Paneli
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
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
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        <div className="bg-white p-5 shadow rounded-lg flex items-center">
          <div className="p-3 bg-red-100 rounded-full">
            <Users className="h-6 w-6 text-red-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Kayıtlı Personel</p>
            <p className="text-2xl font-semibold text-gray-900">{personnelCount}</p>
          </div>
        </div>
        <Link to="/tenders" className="bg-white p-5 shadow rounded-lg flex items-center hover:bg-gray-50 transition-colors">
          <div className="p-3 bg-purple-100 rounded-full">
            <PackageOpen className="h-6 w-6 text-purple-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">İhale Yönetimi</p>
            <p className="text-2xl font-semibold text-gray-900">{tendersCount}</p>
          </div>
        </Link>
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
          <div className="p-3 bg-red-100 rounded-full">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Biten Stok</p>
            <p className="text-2xl font-semibold text-gray-900">{unitStats.reduce((acc, s) => acc + s.zeroStockCount, 0)}</p>
          </div>
        </div>
        <div className="bg-white p-5 shadow rounded-lg flex items-center">
          <div className="p-3 bg-yellow-100 rounded-full">
            <AlertTriangle className="h-6 w-6 text-yellow-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Kritik Stok</p>
            <p className="text-2xl font-semibold text-gray-900">{unitStats.reduce((acc, s) => acc + s.lowStockCount, 0)}</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 shadow rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Birimlere Göre Malzeme Dağılımı</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
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
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
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
                <div className="flex flex-col space-y-1">
                  {stats.zeroStockCount > 0 && (
                    <span className="bg-red-100 text-red-800 text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {stats.zeroStockCount} Bitti
                    </span>
                  )}
                  {stats.lowStockCount > 0 && (
                    <span className="bg-yellow-100 text-yellow-800 text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      {stats.lowStockCount} Kritik
                    </span>
                  )}
                </div>
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

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center mb-4 text-red-600">
              <Calendar className="w-6 h-6 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Aylık Envanter Raporu</h3>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              Tüm birimlerin seçilen aydaki stok giriş ve çıkış hareketlerini içeren detaylı raporu hazırlar.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Yıl</label>
                <select
                  value={reportYear}
                  onChange={(e) => setReportYear(Number(e.target.value))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border"
                >
                  {[2023, 2024, 2025, 2026].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Ay</label>
                <select
                  value={reportMonth}
                  onChange={(e) => setReportMonth(Number(e.target.value))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border"
                >
                  {["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"].map((m, i) => (
                    <option key={i} value={i}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-8">
              <button
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                onClick={() => {
                  generateMonthlyInventoryReport(allItems, allTransactions, allPersonnel, reportMonth, reportYear);
                  setShowReportModal(false);
                }}
                className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                Raporu Oluştur
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

