import React, { useEffect, useState } from 'react';
import { getPersonnel, getAllItems, getAllTransactions, getMasterItems, Personnel, Item, Transaction } from '../lib/db';
import { Link } from 'react-router-dom';
import { Package, ArrowDownRight, ArrowUpRight, Users, PackageOpen, AlertTriangle } from 'lucide-react';

export default function Dashboard() {
  const [personnelCount, setPersonnelCount] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [masterItemsCount, setMasterItemsCount] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [personnelMap, setPersonnelMap] = useState<Record<number, string>>({});

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
      setTotalItems(items.length);

      const mItems = await getMasterItems();
      setMasterItemsCount(mItems.length);

      const txs = await getAllTransactions();
      // Sort by date descending and get top 5
      setRecentTransactions(txs.sort((a, b) => b.date - a.date).slice(0, 5));
    };
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Gösterge Paneli</h1>

      {personnelCount === 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <Users className="h-5 w-5 text-yellow-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Sistemde kayıtlı personel bulunmuyor. Stok işlemlerine başlayabilmek için lütfen önce <Link to="/personnel" className="font-medium underline text-yellow-700 hover:text-yellow-600">personel ekleyin</Link>.
              </p>
            </div>
          </div>
        </div>
      )}

      {masterItemsCount === 0 && (
        <div className="bg-orange-50 border-l-4 border-orange-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-orange-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-orange-700">
                Sistemde tanımlı malzeme bulunmuyor. İhale veya stok girişi yapabilmek için lütfen önce <Link to="/master-items" className="font-medium underline text-orange-700 hover:text-orange-600">malzeme tanımlayın</Link>.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-gray-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Kayıtlı Personel</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{personnelCount}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link to="/personnel" className="font-medium text-red-700 hover:text-red-900">Tümünü gör</Link>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <PackageOpen className="h-6 w-6 text-gray-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Tanımlı Malzeme Sayısı</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{masterItemsCount}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link to="/master-items" className="font-medium text-red-700 hover:text-red-900">Tümünü gör</Link>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Package className="h-6 w-6 text-gray-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Birimlerdeki Toplam Kalem</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{totalItems}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link to="/statistics" className="font-medium text-red-700 hover:text-red-900">İstatistiklere git</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Son İşlemler</h3>
        </div>
        <ul className="divide-y divide-gray-200">
          {recentTransactions.length === 0 ? (
            <li className="px-4 py-8 text-center text-gray-500">Henüz işlem bulunmuyor.</li>
          ) : (
            recentTransactions.map((tx) => (
              <li key={tx.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {tx.type === 'GİRİŞ' ? (
                      <ArrowDownRight className="h-5 w-5 text-green-500 mr-2" />
                    ) : (
                      <ArrowUpRight className="h-5 w-5 text-red-500 mr-2" />
                    )}
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {tx.unit} - {tx.type} İşlemi
                    </p>
                  </div>
                  <div className="ml-2 flex-shrink-0 flex">
                    <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                      {new Date(tx.date).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                    <p className="flex items-center text-sm text-gray-500">
                      Miktar: {tx.quantity} | Personel: {personnelMap[tx.personnelId] || 'Bilinmiyor'}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                    <p>Evrak No: {tx.documentNo}</p>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
