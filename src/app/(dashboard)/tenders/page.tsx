'use client';

import React, { useEffect, useState } from 'react';
import { 
  Item, 
  Personnel, 
  getAllItems, 
  getPersonnel, 
  updateItem, 
  deleteItem,
  addItem,
  addTransaction,
  getAllTransactions,
  UnitType,
  generateUniqueDocNo,
  checkDocumentNoExists,
  Transaction
} from '@/lib/db';
import { format } from 'date-fns';
import { PackageOpen, Edit2, X, AlertCircle, Search, Building2, Calendar, Package, Plus, FileText } from 'lucide-react';
import { generateTenderReport } from '@/lib/reports';
import { useAuth } from '@/contexts/AuthContext';

interface TenderGroup {
  tenderName: string;
  unit: UnitType;
  items: Item[];
  endDate?: number;
}

export default function TenderManagement() {
  const { personnel: currentPersonnel } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tenders, setTenders] = useState<TenderGroup[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Edit Tender Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTender, setEditingTender] = useState<TenderGroup | null>(null);
  const [editTenderName, setEditTenderName] = useState('');
  const [editTenderEndDate, setEditTenderEndDate] = useState('');
  const [editTenderItems, setEditTenderItems] = useState<Item[]>([]);
  const [editPersonnelId, setEditPersonnelId] = useState<string>(currentPersonnel?.id || '');
  const [editDocumentNo, setEditDocumentNo] = useState(generateUniqueDocNo());
  const [editConfirm, setEditConfirm] = useState(false);
  const [allowHeaderEdit, setAllowHeaderEdit] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const [loadedItems, loadedPersonnel, loadedTransactions] = await Promise.all([
      getAllItems(),
      getPersonnel(),
      getAllTransactions()
    ]);
    
    setItems(loadedItems);
    setPersonnel(loadedPersonnel);
    setTransactions(loadedTransactions);

    // Group items by tenderId (fallback to tenderName-unit for legacy items)
    const grouped: Record<string, TenderGroup> = {};
    loadedItems.forEach(item => {
      if (item.tenderName) {
        const key = item.tenderId || `${item.tenderName}-${item.unit}`;
        if (!grouped[key]) {
          grouped[key] = {
            tenderName: item.tenderName,
            unit: item.unit,
            items: [],
            endDate: item.tenderEndDate
          };
        }
        grouped[key].items.push(item);
      }
    });

    setTenders(Object.values(grouped).sort((a, b) => a.tenderName.localeCompare(b.tenderName)));
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const isExpired = (endDate?: number) => {
    if (!endDate) return false;
    return endDate < Date.now();
  };

  const handleOpenEdit = (tender: TenderGroup) => {
    if (isExpired(tender.endDate)) {
      alert(`"${tender.tenderName}" ihalesinin süresi dolduğu için üzerinde değişiklik yapılamaz veya silinemez.`);
      // We still allow opening it to view, but we'll disable buttons in the modal
    } else {
      if (!window.confirm(`"${tender.tenderName}" ihalesini düzenlemek istediğinize emin misiniz?`)) return;
    }
    
    setEditingTender(tender);
    setEditTenderName(tender.tenderName);
    setEditTenderEndDate(tender.endDate ? format(tender.endDate, 'yyyy-MM-dd') : '');
    setEditTenderItems([...tender.items]);
    setEditPersonnelId('');
    setEditDocumentNo(generateUniqueDocNo());
    setEditConfirm(false);
    setAllowHeaderEdit(false);
    setShowEditModal(true);
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...editTenderItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setEditTenderItems(newItems);
  };

  const handleRemoveItemFromTender = (index: number) => {
    if (!window.confirm('Bu ürünü ihaleden çıkarmak istediğinize emin misiniz?')) return;
    const newItems = [...editTenderItems];
    newItems.splice(index, 1);
    setEditTenderItems(newItems);
  };

  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newItemId, setNewItemId] = useState<string | ''>('');
  const [newItemLimit, setNewItemLimit] = useState<number | ''>('');

  const handleAddItemToTender = () => {
    if (!newItemId || !newItemLimit) return;
    const masterItem = items.find(i => i.id === newItemId);
    if (!masterItem) return;

    const newItem: Item = {
      unit: editingTender!.unit,
      name: masterItem.name,
      measurementUnit: masterItem.measurementUnit,
      currentStock: 0,
      createdAt: Date.now(),
      tenderName: editTenderName,
      tenderEndDate: editTenderEndDate ? new Date(editTenderEndDate).getTime() : undefined,
      tenderLimit: Number(newItemLimit)
    };

    setEditTenderItems([...editTenderItems, newItem]);
    setShowAddItemModal(false);
    setNewItemId('');
    setNewItemLimit('');
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPersonnelId || !editConfirm || !editDocumentNo) {
      alert('İşlemi yapan personeli seçmeli, evrak no girmeli ve onay kutusunu işaretlemelisiniz.');
      return;
    }

    const docExists = await checkDocumentNoExists(editDocumentNo);
    if (docExists) {
      alert('Bu evrak numarası zaten sistemde kayıtlı. Lütfen farklı bir numara girin.');
      return;
    }

    try {
      const selectedPersonnel = personnel.find(p => p.id === editPersonnelId);
      if (!selectedPersonnel) return;

      // Update existing and add new items
      const originalItemIds = editingTender.items.map(i => i.id).filter(Boolean);
      const currentItemIds = editTenderItems.map(i => i.id).filter(Boolean);

      // Deletions
      const toDelete = originalItemIds.filter(id => !currentItemIds.includes(id));
      for (const id of toDelete) {
        if (id) await deleteItem(id);
      }

      for (const item of editTenderItems) {
        const originalItem = items.find(i => i.id === item.id);
        
        if (originalItem) {
          // Update
          const changes = [];
          if (originalItem.tenderName !== editTenderName) changes.push(`İhale Adı: ${originalItem.tenderName} -> ${editTenderName}`);
          if (originalItem.tenderLimit !== Number(item.tenderLimit)) changes.push(`Limit: ${originalItem.tenderLimit} -> ${item.tenderLimit}`);
          
          const oldDate = originalItem.tenderEndDate ? format(originalItem.tenderEndDate, 'yyyy-MM-dd') : '';
          if (oldDate !== editTenderEndDate) changes.push(`Tarih: ${oldDate} -> ${editTenderEndDate}`);

          const newHistory = [...(originalItem.tenderHistory || [])];
          if (changes.length > 0) {
            newHistory.push({
              date: Date.now(),
              personnelId: editPersonnelId,
              personnelName: selectedPersonnel.name,
              changes: changes.join(', ')
            });
          }

          await updateItem({
            ...item,
            tenderName: editTenderName,
            tenderEndDate: editTenderEndDate ? new Date(editTenderEndDate).getTime() : undefined,
            tenderLimit: Number(item.tenderLimit),
            tenderHistory: newHistory
          });
        } else {
          // New addition to existing tender
          const newItemId = await addItem({
            ...item,
            tenderName: editTenderName,
            tenderEndDate: editTenderEndDate ? new Date(editTenderEndDate).getTime() : undefined,
            tenderLimit: Number(item.tenderLimit),
            tenderHistory: [{
              date: Date.now(),
              personnelId: editPersonnelId,
              personnelName: selectedPersonnel.name,
              changes: 'İhaleye sonradan eklendi'
            }]
          });

          // Initial stock entry for new item
          await addTransaction({
            itemId: newItemId,
            unit: item.unit,
            type: 'GİRİŞ',
            quantity: Number(item.tenderLimit),
            date: Date.now(),
            personnelId: editPersonnelId,
            description: 'İhaleye Sonradan Eklenen Ürün Stoğu',
            documentNo: editDocumentNo
          });
        }
      }

      setShowEditModal(false);
      loadData();
      alert('İhale başarıyla güncellendi.');
    } catch (err) {
      console.error(err);
      alert('Güncelleme sırasında bir hata oluştu.');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`"${editTenderName}" ihalesine ait TÜM ürünler silinecektir. Bu işlem geri alınamaz. Onaylıyor musunuz?`)) return;
    
    try {
      for (const item of editTenderItems) {
        if (item.id) await deleteItem(item.id);
      }
      setShowEditModal(false);
      loadData();
      alert('İhale ve tüm ürünleri başarıyla silindi.');
    } catch (err) {
      console.error(err);
      alert('Silme işlemi sırasında bir hata oluştu.');
    }
  };

  const filteredTenders = tenders.filter(t => 
    t.tenderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.unit.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">İhale Yönetimi</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="İhale veya birim ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 sm:text-sm w-64"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTenders.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
              <PackageOpen className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">İhale Bulunamadı</h3>
              <p className="mt-1 text-sm text-gray-500">Henüz tanımlanmış bir ihale bulunmuyor veya arama kriterine uygun sonuç yok.</p>
            </div>
          ) : (
            filteredTenders.map((tender, idx) => (
              <div 
                key={idx}
                onClick={() => handleOpenEdit(tender)}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-red-50 rounded-lg text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors">
                    <PackageOpen className="w-6 h-6" />
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {tender.unit}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ml-2 bg-orange-100 text-orange-800">
                    {tender.items[0]?.tenderType || 'İhale'}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 truncate" title={tender.tenderName}>
                  {tender.tenderName}
                </h3>
                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Package className="w-4 h-4 mr-2" />
                    {tender.items.length} Kalem Ürün
                  </div>
                  <div className={`flex items-center ${isExpired(tender.endDate) ? 'text-red-600 font-bold' : ''}`}>
                    <Calendar className="w-4 h-4 mr-2" />
                    {tender.endDate ? format(tender.endDate, 'dd.MM.yyyy') : 'Belirtilmemiş'}
                    {isExpired(tender.endDate) && <span className="ml-2 text-[10px] uppercase tracking-wider bg-red-100 px-1 rounded">Süresi Doldu</span>}
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      generateTenderReport(tender.tenderName, tender.unit, tender.items, items, transactions, personnel, currentPersonnel);
                    }}
                    className="text-blue-600 text-sm font-medium flex items-center hover:underline"
                  >
                    <FileText className="w-4 h-4 mr-1" /> Rapor Al
                  </button>
                  <span className={`${isExpired(tender.endDate) ? 'text-gray-400' : 'text-red-600'} text-sm font-medium flex items-center group-hover:underline`}>
                    {isExpired(tender.endDate) ? <Search className="w-4 h-4 mr-1" /> : <Edit2 className="w-4 h-4 mr-1" />} 
                    {isExpired(tender.endDate) ? 'Görüntüle' : 'Düzenle'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingTender && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg p-6 max-w-5xl w-full shadow-xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">İhaleyi Düzenle: {editTenderName}</h3>
              {!isExpired(editingTender.endDate) && (
                <button onClick={handleDelete} className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center">
                  <X className="w-4 h-4 mr-1" /> İhaleyi Sil
                </button>
              )}
            </div>
            
            <form onSubmit={handleSubmitEdit} className="flex flex-col flex-1 overflow-hidden">
              {isExpired(editingTender.endDate) && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                    <div className="ml-3">
                      <p className="text-sm text-red-700 font-bold">
                        BU İHALENİN SÜRESİ DOLMUŞTUR!
                      </p>
                      <p className="text-xs text-red-600 mt-1">
                        Süresi dolan ihalelerde değişiklik yapılamaz ve silinemez.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <div className="bg-blue-50 p-4 rounded-md border border-blue-200 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      id="allowHeaderEdit" 
                      checked={allowHeaderEdit} 
                      onChange={e => setAllowHeaderEdit(e.target.checked)} 
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" 
                    />
                    <label htmlFor="allowHeaderEdit" className="ml-2 block text-sm text-blue-900 font-medium">
                      İhale adını veya tarihini değiştirmek istiyorum
                    </label>
                  </div>
                  {!allowHeaderEdit && (
                    <span className="text-xs text-blue-600 italic">* Bu alanlar varsayılan olarak kilitlidir.</span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">İhale Adı</label>
                    <input 
                      type="text" 
                      required 
                      disabled={!allowHeaderEdit}
                      value={editTenderName} 
                      onChange={e => setEditTenderName(e.target.value)} 
                      className={`mt-1 block w-full rounded-md shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border ${!allowHeaderEdit ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white'}`} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Geçerlilik Tarihi</label>
                    <input 
                      type="date" 
                      disabled={!allowHeaderEdit}
                      value={editTenderEndDate} 
                      onChange={e => setEditTenderEndDate(e.target.value)} 
                      className={`mt-1 block w-full rounded-md shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border ${!allowHeaderEdit ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white'}`} 
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium text-gray-700">İhale Ürünleri</h4>
                {!isExpired(editingTender.endDate) && (
                  <button 
                    type="button" 
                    onClick={() => setShowAddItemModal(true)}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center font-medium"
                  >
                    <Plus className="w-3 h-3 mr-1" /> Malzeme Ekle
                  </button>
                )}
              </div>
              <div className="overflow-y-auto flex-1 border border-gray-200 rounded-md p-2 bg-gray-50">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Malzeme</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Birim</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Toplam Limit</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Mevcut Stok</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {editTenderItems.map((item, index) => (
                      <tr key={item.id || index}>
                        <td className="px-4 py-2 text-sm text-gray-900">{item.name}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">{item.measurementUnit}</td>
                        <td className="px-4 py-2">
                          <input 
                            type="number" 
                            required 
                            disabled={isExpired(editingTender.endDate)}
                            value={item.tenderLimit} 
                            onChange={e => handleItemChange(index, 'tenderLimit', e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-xs p-1 border"
                          />
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500">{item.currentStock}</td>
                        <td className="px-4 py-2 text-right">
                          {!isExpired(editingTender.endDate) && (
                            <button 
                              type="button" 
                              onClick={() => handleRemoveItemFromTender(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 p-4 bg-yellow-50 rounded-md border border-yellow-200">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Değişikliği Onaylayan Personel</label>
                    <select required value={editPersonnelId} onChange={e => setEditPersonnelId(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border">
                      <option value="">Seçiniz...</option>
                      {personnel.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Evrak No</label>
                    <input type="text" required value={editDocumentNo} onChange={e => setEditDocumentNo(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border" />
                  </div>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" id="confirmEdit" checked={editConfirm} onChange={e => setEditConfirm(e.target.checked)} className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded" />
                  <label htmlFor="confirmEdit" className="ml-2 block text-sm text-gray-900 font-medium">
                    İhale bilgilerindeki değişiklikleri onaylıyorum. Bu işlem geçmişe kaydedilecektir.
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">Kapat</button>
                {!isExpired(editingTender.endDate) && (
                  <button type="submit" className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700">Değişiklikleri Kaydet</button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Item to Tender Modal */}
      {showAddItemModal && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-[60] px-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-medium text-gray-900 mb-4">İhaleye Yeni Malzeme Ekle</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Malzeme Seçin</label>
                <select 
                  value={newItemId} 
                  onChange={e => setNewItemId(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border"
                >
                  <option value="">Seçiniz...</option>
                  {items.filter(i => !editTenderItems.some(eti => eti.name === i.name)).map(i => (
                    <option key={i.id} value={i.id}>{i.name} ({i.measurementUnit})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">İhale Toplam Stoğu (Limit)</label>
                <input 
                  type="number" 
                  value={newItemLimit} 
                  onChange={e => setNewItemLimit(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button onClick={() => setShowAddItemModal(false)} className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">İptal</button>
                <button onClick={handleAddItemToTender} className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700">Ekle</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
