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
  addTransaction,
  updateItem
} from '../lib/db';
import { Plus, ArrowDownRight, ArrowUpRight, AlertCircle, Edit2 } from 'lucide-react';
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
  const [tenderName, setTenderName] = useState('');
  const [tenderEndDate, setTenderEndDate] = useState('');
  const [tenderLimit, setTenderLimit] = useState<number | ''>('');
  
  const needsTender = ['Vefa Temizlik', 'Aşevi', 'Dergah'].includes(unit);
  
  // New Transaction Form
  const [txItemId, setTxItemId] = useState<number | ''>('');
  const [txType, setTxType] = useState<'GİRİŞ' | 'ÇIKIŞ'>('GİRİŞ');
  const [txQuantity, setTxQuantity] = useState<number | ''>('');
  const [txPersonnelId, setTxPersonnelId] = useState<number | ''>('');
  const [txDescription, setTxDescription] = useState('');
  const [txDocumentNo, setTxDocumentNo] = useState('');
  const [error, setError] = useState('');

  // Edit Item Form
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [editName, setEditName] = useState('');
  const [editUnit, setEditUnit] = useState('');
  const [editTenderName, setEditTenderName] = useState('');
  const [editTenderEndDate, setEditTenderEndDate] = useState('');
  const [editTenderLimit, setEditTenderLimit] = useState<number | ''>('');

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
    setError('');
    if (!newItemName || !newItemUnit) return;
    
    if (needsTender && (!tenderName || !tenderLimit)) {
      setError('İhale adı ve ihale stok limiti zorunludur.');
      return;
    }

    await addItem({
      name: newItemName,
      unit: unit,
      measurementUnit: newItemUnit,
      currentStock: 0,
      ...(needsTender && tenderName ? {
        tenderName,
        tenderEndDate: tenderEndDate ? new Date(tenderEndDate).getTime() : undefined,
        tenderLimit: tenderLimit ? Number(tenderLimit) : undefined
      } : {})
    });
    
    setNewItemName('');
    setNewItemUnit('Adet');
    setTenderName('');
    setTenderEndDate('');
    setTenderLimit('');
    loadData();
  };

  const openEditModal = (item: Item) => {
    setEditingItem(item);
    setEditName(item.name);
    setEditUnit(item.measurementUnit);
    setEditTenderName(item.tenderName || '');
    setEditTenderEndDate(item.tenderEndDate ? format(item.tenderEndDate, 'yyyy-MM-dd') : '');
    setEditTenderLimit(item.tenderLimit || '');
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    if (needsTender) {
      if (!editTenderName || !editTenderLimit) {
        alert('İhale adı ve ihale stok limiti zorunludur.');
        return;
      }
      if (editingItem.tenderLimit && Number(editTenderLimit) > editingItem.tenderLimit) {
        alert('İhalede belirtilen stok miktarı arttırılamaz. Yeni ihale yapılması gerekmektedir.');
        return;
      }
    }

    await updateItem({
      ...editingItem,
      name: editName,
      measurementUnit: editUnit,
      ...(needsTender ? {
        tenderName: editTenderName,
        tenderEndDate: editTenderEndDate ? new Date(editTenderEndDate).getTime() : undefined,
        tenderLimit: Number(editTenderLimit)
      } : {})
    });

    setEditingItem(null);
    loadData();
  };

  const printMuayeneKabul = (data: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const dateStr = format(data.date, 'dd.MM.yyyy');
    const html = `
      <!DOCTYPE html>
      <html lang="tr">
      <head>
        <meta charset="UTF-8">
        <title>Muayene Kabul Tutanağı</title>
        <style>
          body { font-family: 'Times New Roman', Times, serif; margin: 40px; color: #000; line-height: 1.5; }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { font-size: 16px; margin: 5px 0; font-weight: bold; }
          .header h2 { font-size: 14px; margin: 5px 0; font-weight: normal; }
          .title { text-align: center; font-weight: bold; text-decoration: underline; margin-bottom: 30px; font-size: 16px; }
          .content { text-align: justify; margin-bottom: 40px; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
          th, td { border: 1px solid #000; padding: 8px; text-align: left; font-size: 14px; }
          th { background-color: #f2f2f2; }
          .signatures { display: flex; justify-content: space-between; flex-wrap: wrap; margin-top: 50px; }
          .sig-box { width: 30%; text-align: center; margin-bottom: 40px; }
          .sig-box p { margin: 5px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>T.C.</h1>
          <h1>EDİRNE VALİLİĞİ</h1>
          <h2>Sosyal Yardımlaşma ve Dayanışma Vakfı Başkanlığı</h2>
        </div>
        <div class="title">MUAYENE VE KABUL TUTANAĞI</div>
        <div class="content">
          Vakfımız ${unit} birimi ihtiyacı için alımı yapılan ve aşağıda cinsi, miktarı belirtilen malzeme/ürünler muayene ve kabul komisyonumuz tarafından incelenmiş olup, evsafına ve şartnamesine uygun olduğu görülerek tam ve eksiksiz olarak teslim alınmıştır. İşbu tutanak tarafımızdan imza altına alınmıştır.
          <br><br>
          <strong>Tarih:</strong> ${dateStr}<br>
          <strong>Evrak/Fatura No:</strong> ${data.documentNo}
        </div>
        <table>
          <thead>
            <tr>
              <th>Sıra</th>
              <th>Malzeme/Ürün Adı</th>
              <th>Miktarı</th>
              <th>Birimi</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>${data.itemName}</td>
              <td>${data.quantity}</td>
              <td>${data.measurementUnit}</td>
            </tr>
          </tbody>
        </table>
        <div class="signatures">
          <div class="sig-box"><p><strong>Komisyon Başkanı</strong></p><br><br><p>Adı Soyadı</p><p>İmza</p></div>
          <div class="sig-box"><p><strong>Üye</strong></p><br><br><p>Adı Soyadı</p><p>İmza</p></div>
          <div class="sig-box"><p><strong>Üye</strong></p><br><br><p>Adı Soyadı</p><p>İmza</p></div>
          <div class="sig-box"><p><strong>Teslim Alan</strong></p><br><br><p>${data.personnelName}</p><p>İmza</p></div>
          <div class="sig-box"><p><strong>Gıda Mühendisi</strong></p><br><br><p>Adı Soyadı</p><p>İmza</p></div>
        </div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!txItemId || !txQuantity || !txPersonnelId || !txDocumentNo) {
      setError('Lütfen zorunlu alanları doldurun.');
      return;
    }

    const selectedItem = itemMap[Number(txItemId)];
    if (needsTender && (!selectedItem.tenderName || !selectedItem.tenderLimit)) {
      setError('Bu malzeme için ihale bilgisi girilmeden işlem yapılamaz. Lütfen önce malzemeyi düzenleyerek ihale bilgilerini girin.');
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

      if (txType === 'GİRİŞ') {
        printMuayeneKabul({
          itemName: itemMap[Number(txItemId)]?.name,
          quantity: txQuantity,
          measurementUnit: itemMap[Number(txItemId)]?.measurementUnit,
          documentNo: txDocumentNo,
          personnelName: personnelMap[Number(txPersonnelId)],
          date: Date.now()
        });
      }

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
            <form onSubmit={handleAddItem} className="space-y-4">
              <div className="flex gap-4 items-end">
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
              </div>
              
              {needsTender && (
                <div className="grid grid-cols-3 gap-4 bg-gray-50 p-3 rounded-md border border-gray-200">
                  <div>
                    <label className="block text-xs font-medium text-gray-700">İhale Adı</label>
                    <input
                      type="text"
                      value={tenderName}
                      onChange={(e) => setTenderName(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-xs p-1.5 border"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Geçerlilik Tarihi</label>
                    <input
                      type="date"
                      value={tenderEndDate}
                      onChange={(e) => setTenderEndDate(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-xs p-1.5 border"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">İhale Stok Limiti</label>
                    <input
                      type="number"
                      value={tenderLimit}
                      onChange={(e) => setTenderLimit(e.target.value ? Number(e.target.value) : '')}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-xs p-1.5 border"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <Plus className="w-4 h-4 mr-2" /> Ekle
                </button>
              </div>
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
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">İşlem</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.length === 0 ? (
                    <tr><td colSpan={2} className="px-6 py-4 text-center text-sm text-gray-500">Kayıtlı malzeme bulunmuyor.</td></tr>
                  ) : (
                    items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {item.name}
                          {item.tenderName && (
                            <div className="text-xs text-gray-500 font-normal mt-1">
                              İhale: {item.tenderName} 
                              {item.tenderEndDate && ` (Bitiş: ${format(item.tenderEndDate, 'dd.MM.yyyy')})`}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`font-bold ${item.currentStock <= 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {item.currentStock}
                          </span> {item.measurementUnit}
                          {item.currentStock <= 0 && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              Stok Bitti
                            </span>
                          )}
                          {item.tenderLimit && (
                            <div className="text-xs text-gray-400 mt-1">
                              Limit: {item.tenderLimit}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button onClick={() => openEditModal(item)} className="text-indigo-600 hover:text-indigo-900">
                            <Edit2 className="w-4 h-4" />
                          </button>
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

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Malzeme / İhale Düzenle</h3>
            <form onSubmit={handleUpdateItem} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Malzeme Adı</label>
                <input type="text" required value={editName} onChange={e => setEditName(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Birim</label>
                <select value={editUnit} onChange={e => setEditUnit(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border">
                  <option>Adet</option>
                  <option>Kg</option>
                  <option>Litre</option>
                  <option>Koli</option>
                  <option>Paket</option>
                  <option>Çuval</option>
                </select>
              </div>
              {needsTender && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">İhale Adı</label>
                    <input type="text" required value={editTenderName} onChange={e => setEditTenderName(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Geçerlilik Tarihi</label>
                    <input type="date" value={editTenderEndDate} onChange={e => setEditTenderEndDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">İhale Stok Limiti</label>
                    <input type="number" required value={editTenderLimit} onChange={e => setEditTenderLimit(e.target.value ? Number(e.target.value) : '')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border" />
                    {editingItem.tenderLimit && (
                      <p className="text-xs text-red-500 mt-1">Mevcut limit: {editingItem.tenderLimit}. Limit arttırılamaz.</p>
                    )}
                  </div>
                </>
              )}
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setEditingItem(null)} className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">İptal</button>
                <button type="submit" className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
