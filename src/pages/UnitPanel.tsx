import React, { useEffect, useState } from 'react';
import { 
  UnitType, 
  Item, 
  Transaction, 
  Personnel, 
  getItemsByUnit, 
  getTransactionsByUnit, 
  getPersonnel, 
  addItem, 
  addTransaction 
} from '../lib/db';
import { Plus, ArrowDownRight, ArrowUpRight, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface UnitPanelProps {
  unit: UnitType;
}

export default function UnitPanel({ unit }: UnitPanelProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  
  // New Item Form
  const [newItemName, setNewItemName] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('Adet');
  
  // New Transaction Form
  const [txItemId, setTxItemId] = useState<number | ''>('');
  const [txType, setTxType] = useState<'GİRİŞ' | 'ÇIKIŞ'>('GİRİŞ');
  const [txQuantity, setTxQuantity] = useState<number | ''>('');
  const [txPersonnelId, setTxPersonnelId] = useState<number | ''>('');
  const [txDescription, setTxDescription] = useState('');
  const [txDocumentNo, setTxDocumentNo] = useState('');
  const [error, setError] = useState('');

  const loadData = async () => {
    const [loadedItems, loadedTxs, loadedPersonnel] = await Promise.all([
      getItemsByUnit(unit),
      getTransactionsByUnit(unit),
      getPersonnel()
    ]);
    setItems(loadedItems);
    setTransactions(loadedTxs.sort((a, b) => b.date - a.date));
    setPersonnel(loadedPersonnel);
  };

  useEffect(() => {
    loadData();
    // Reset forms when unit changes
    setTxItemId('');
    setTxPersonnelId('');
    setError('');
  }, [unit]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName || !newItemUnit) return;
    
    await addItem({
      name: newItemName,
      unit: unit,
      measurementUnit: newItemUnit,
      currentStock: 0
    });
    
    setNewItemName('');
    setNewItemUnit('Adet');
    loadData();
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!txItemId || !txQuantity || !txPersonnelId || !txDocumentNo) {
      setError('Lütfen zorunlu alanları doldurun.');
      return;
    }

    try {
      await addTransaction({
        itemId: Number(txItemId),
        unit: unit,
        type: txType,
        quantity: Number(txQuantity),
        date: Date.now(),
        personnelId: Number(txPersonnelId),
        description: txDescription,
        documentNo: txDocumentNo
      });

      setTxQuantity('');
      setTxDescription('');
      setTxDocumentNo('');
      loadData();
    } catch (err: any) {
      setError(err.message || 'İşlem sırasında bir hata oluştu.');
    }
  };

  const personnelMap = personnel.reduce((acc, p) => {
    if (p.id) acc[p.id] = p.name;
    return acc;
  }, {} as Record<number, string>);

  const itemMap = items.reduce((acc, i) => {
    if (i.id) acc[i.id] = i;
    return acc;
  }, {} as Record<number, Item>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">{unit} Paneli</h1>
      </div>

      {personnel.length === 0 && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                İşlem yapabilmek için sistemde kayıtlı personel bulunmalıdır. Lütfen Personel Yönetimi sayfasından personel ekleyin.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stok Durumu ve Yeni Kalem Ekleme */}
        <div className="space-y-6">
          <div className="bg-white shadow sm:rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Yeni Stok Kalemi Ekle</h3>
            <form onSubmit={handleAddItem} className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">Malzeme Adı</label>
                <input
                  type="text"
                  required
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border"
                />
              </div>
              <div className="w-32">
                <label className="block text-sm font-medium text-gray-700">Birim</label>
                <select
                  value={newItemUnit}
                  onChange={(e) => setNewItemUnit(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border"
                >
                  <option>Adet</option>
                  <option>Kg</option>
                  <option>Litre</option>
                  <option>Koli</option>
                  <option>Paket</option>
                  <option>Çuval</option>
                </select>
              </div>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <Plus className="w-4 h-4 mr-2" /> Ekle
              </button>
            </form>
          </div>

          <div className="bg-white shadow sm:rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Mevcut Stok Durumu</h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Malzeme</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Miktar</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.length === 0 ? (
                    <tr><td colSpan={2} className="px-6 py-4 text-center text-sm text-gray-500">Kayıtlı malzeme bulunmuyor.</td></tr>
                  ) : (
                    items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`font-bold ${item.currentStock <= 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {item.currentStock}
                          </span> {item.measurementUnit}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* İşlem Ekleme ve Geçmiş */}
        <div className="space-y-6">
          <div className="bg-white shadow sm:rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Stok İşlemi (Giriş/Çıkış)</h3>
            {error && (
              <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 text-sm text-red-700">
                {error}
              </div>
            )}
            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">İşlem Türü</label>
                  <select
                    value={txType}
                    onChange={(e) => setTxType(e.target.value as 'GİRİŞ' | 'ÇIKIŞ')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border"
                  >
                    <option value="GİRİŞ">GİRİŞ</option>
                    <option value="ÇIKIŞ">ÇIKIŞ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Malzeme</label>
                  <select
                    required
                    value={txItemId}
                    onChange={(e) => setTxItemId(Number(e.target.value))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border"
                  >
                    <option value="">Seçiniz...</option>
                    {items.map(item => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Miktar</label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <input
                      type="number"
                      required
                      min="0.01"
                      step="0.01"
                      value={txQuantity}
                      onChange={(e) => setTxQuantity(e.target.value)}
                      className="flex-1 block w-full rounded-none rounded-l-md border-gray-300 focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border"
                    />
                    <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                      {txItemId ? itemMap[Number(txItemId)]?.measurementUnit : '-'}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">İşlemi Yapan Personel</label>
                  <select
                    required
                    value={txPersonnelId}
                    onChange={(e) => setTxPersonnelId(Number(e.target.value))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border"
                  >
                    <option value="">Seçiniz...</option>
                    {personnel.map(p => (
                      <option key={p.id} value={p.id}>{p.name} - {p.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Resmi Evrak No</label>
                  <input
                    type="text"
                    required
                    value={txDocumentNo}
                    onChange={(e) => setTxDocumentNo(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border"
                    placeholder="Örn: 2023/123"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Açıklama (Opsiyonel)</label>
                  <input
                    type="text"
                    value={txDescription}
                    onChange={(e) => setTxDescription(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={personnel.length === 0}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-gray-400"
                >
                  İşlemi Kaydet
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white shadow sm:rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Son İşlemler</h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              <ul className="divide-y divide-gray-200">
                {transactions.length === 0 ? (
                  <li className="px-4 py-4 text-center text-sm text-gray-500">Kayıtlı işlem bulunmuyor.</li>
                ) : (
                  transactions.slice(0, 50).map((tx) => (
                    <li key={tx.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {tx.type === 'GİRİŞ' ? (
                            <ArrowDownRight className="h-5 w-5 text-green-500 mr-2" />
                          ) : (
                            <ArrowUpRight className="h-5 w-5 text-red-500 mr-2" />
                          )}
                          <p className="text-sm font-medium text-gray-900">
                            {itemMap[tx.itemId]?.name || 'Bilinmeyen Malzeme'}
                          </p>
                        </div>
                        <div className="ml-2 flex-shrink-0 flex">
                          <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                            {format(tx.date, 'dd.MM.yyyy HH:mm')}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex text-sm text-gray-500">
                          <p>
                            Miktar: <span className="font-medium text-gray-900">{tx.quantity} {itemMap[tx.itemId]?.measurementUnit}</span>
                          </p>
                          <p className="mt-2 sm:mt-0 sm:ml-6">
                            Personel: {personnelMap[tx.personnelId] || '-'}
                          </p>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <p>Evrak: {tx.documentNo}</p>
                        </div>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
