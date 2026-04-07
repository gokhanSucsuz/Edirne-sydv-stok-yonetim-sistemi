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
  updateItem,
  deleteItem,
  getMasterItems,
  MasterItem
} from '../lib/db';
import { Plus, ArrowDownRight, ArrowUpRight, AlertCircle, Edit2, X, AlertTriangle, PackageOpen } from 'lucide-react';
import { format } from 'date-fns';
import { APP_LOGO_URL } from '../constants';
import { Link } from 'react-router-dom';

interface UnitPanelProps {
  unit: UnitType;
}

export default function UnitPanel({ unit }: UnitPanelProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [masterItems, setMasterItems] = useState<MasterItem[]>([]);
  
  // New Item Form
  const [newItemName, setNewItemName] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('Adet');
  const [tenderName, setTenderName] = useState('');
  const [tenderEndDate, setTenderEndDate] = useState('');
  const [tenderLimit, setTenderLimit] = useState<number | ''>('');
  const [addPersonnelId, setAddPersonnelId] = useState('');
  const [addDocumentNo, setAddDocumentNo] = useState('');
  
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
  const [editPersonnelId, setEditPersonnelId] = useState('');
  const [editDocumentNo, setEditDocumentNo] = useState('');
  const [editConfirm, setEditConfirm] = useState(false);

  // History Modal
  const [historyItem, setHistoryItem] = useState<Item | null>(null);

  // Bulk Tender Modal
  const [showTenderModal, setShowTenderModal] = useState(false);
  const [bulkTenderName, setBulkTenderName] = useState('');
  const [bulkTenderEndDate, setBulkTenderEndDate] = useState('');
  const [bulkPersonnelId, setBulkPersonnelId] = useState('');
  const [bulkDocumentNo, setBulkDocumentNo] = useState('');
  const [bulkItems, setBulkItems] = useState([{ name: '', unit: 'Adet', limit: '' }]);

  // Bulk Exit Modal
  const [showBulkExitModal, setShowBulkExitModal] = useState(false);
  const [bulkExitItems, setBulkExitItems] = useState<{ itemId: number | '', quantity: number | '' }[]>([{ itemId: '', quantity: '' }]);
  const [bulkExitPersonnelId, setBulkExitPersonnelId] = useState('');
  const [bulkExitDocumentNo, setBulkExitDocumentNo] = useState('');
  const [bulkExitDescription, setBulkExitDescription] = useState('');

  // Edit Tender Modal
  const [showEditTenderModal, setShowEditTenderModal] = useState(false);
  const [editingTenderName, setEditingTenderName] = useState('');
  const [editTenderItems, setEditTenderItems] = useState<Item[]>([]);
  const [editTenderEndDateVal, setEditTenderEndDateVal] = useState('');
  const [editTenderPersonnelId, setEditTenderPersonnelId] = useState('');
  const [editTenderConfirm, setEditTenderConfirm] = useState(false);
  const [allowTenderHeaderEdit, setAllowTenderHeaderEdit] = useState(false);

  const isTenderExpired = (item: Item) => {
    if (!item.tenderEndDate) return false;
    return item.tenderEndDate < Date.now();
  };

  const loadData = async () => {
    const [loadedItems, loadedTxs, loadedPersonnel, loadedMasterItems] = await Promise.all([
      getItemsByUnit(unit),
      getTransactionsByUnit(unit),
      getPersonnel(),
      getMasterItems()
    ]);
    setItems(loadedItems);
    setTransactions(loadedTxs.sort((a, b) => b.date - a.date));
    setPersonnel(loadedPersonnel);
    setMasterItems(loadedMasterItems.sort((a, b) => a.name.localeCompare(b.name)));
  };

  useEffect(() => {
    loadData();
    // Reset forms when unit changes
    setTxItemId('');
    setTxPersonnelId('');
    setError('');
    if (needsTender) {
      setTxType('ÇIKIŞ');
    } else {
      setTxType('GİRİŞ');
    }
  }, [unit, needsTender]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!newItemName || !newItemUnit) return;
    
    const isAlreadyInUnit = items.some(i => i.name === newItemName);
    if (isAlreadyInUnit) {
      setError('Bu malzeme zaten bu birimde mevcut.');
      return;
    }

    if (needsTender && (!tenderName || !tenderLimit)) {
      setError('İhale adı ve ihale toplam stoğu zorunludur.');
      return;
    }

    if (needsTender && (!addPersonnelId || !addDocumentNo)) {
      setError('İhale başlangıç stoğu girişi için personel ve evrak no zorunludur.');
      return;
    }

    const newItemId = await addItem({
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
    
    if (needsTender && tenderLimit) {
      await addTransaction({
        itemId: newItemId as number,
        unit: unit,
        type: 'GİRİŞ',
        quantity: Number(tenderLimit),
        date: Date.now(),
        personnelId: Number(addPersonnelId),
        description: 'İhale Başlangıç Stoğu',
        documentNo: addDocumentNo
      });

      printMuayeneKabul({
        itemName: newItemName,
        quantity: tenderLimit,
        measurementUnit: newItemUnit,
        documentNo: addDocumentNo,
        personnelName: personnelMap[Number(addPersonnelId)],
        date: Date.now()
      });
    }

    setNewItemName('');
    setNewItemUnit('Adet');
    setTenderName('');
    setTenderEndDate('');
    setTenderLimit('');
    setAddPersonnelId('');
    setAddDocumentNo('');
    loadData();
  };

  const openEditModal = (item: Item) => {
    setEditingItem(item);
    setEditName(item.name);
    setEditUnit(item.measurementUnit);
    setEditTenderName(item.tenderName || '');
    setEditTenderEndDate(item.tenderEndDate ? format(item.tenderEndDate, 'yyyy-MM-dd') : '');
    setEditTenderLimit(item.tenderLimit || '');
    setEditPersonnelId('');
    setEditConfirm(false);
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    let newHistory = editingItem.tenderHistory ? [...editingItem.tenderHistory] : [];
    let newPreviousTenderStock = editingItem.previousTenderStock || 0;

    let isNewTender = false;

    if (needsTender) {
      if (!editTenderName || !editTenderLimit) {
        alert('İhale adı ve ihale toplam stoğu zorunludur.');
        return;
      }
      
      isNewTender = !!(editingItem.tenderName && editTenderName && editingItem.tenderName !== editTenderName);

      if (!isNewTender && editingItem.tenderLimit && Number(editTenderLimit) > editingItem.tenderLimit) {
        alert('Mevcut ihalede belirtilen stok miktarı arttırılamaz. Yeni ihale yapılması gerekmektedir (İhale adını değiştirerek yeni ihale tanımlayabilirsiniz).');
        return;
      }
      
      const changes: string[] = [];
      if (editingItem.tenderName !== editTenderName) changes.push(`İhale Adı: ${editingItem.tenderName} -> ${editTenderName}`);
      if (editingItem.tenderLimit !== Number(editTenderLimit)) changes.push(`Toplam Stok: ${editingItem.tenderLimit} -> ${editTenderLimit}`);
      
      const oldDate = editingItem.tenderEndDate ? format(editingItem.tenderEndDate, 'yyyy-MM-dd') : '';
      if (oldDate !== editTenderEndDate) changes.push(`Tarih: ${oldDate} -> ${editTenderEndDate}`);

      if (changes.length > 0) {
        if (!editPersonnelId || !editConfirm) {
          alert('İhale bilgilerinde değişiklik yapmak için işlemi yapan personeli seçmeli ve onay kutusunu işaretlemelisiniz.');
          return;
        }
        if (isNewTender && !editDocumentNo) {
          alert('Yeni ihale stoğu girişi için Evrak No zorunludur.');
          return;
        }

        const selectedPersonnel = personnel.find(p => p.id === Number(editPersonnelId));
        if (!selectedPersonnel) return;
        
        if (isNewTender) {
           newPreviousTenderStock = editingItem.currentStock;
           changes.push(`Önceki ihaleden devreden stok: ${newPreviousTenderStock}`);
        }

        newHistory.push({
          date: Date.now(),
          personnelId: Number(editPersonnelId),
          personnelName: selectedPersonnel.name,
          changes: changes.join(', ')
        });
      }
    }

    await updateItem({
      ...editingItem,
      name: editName,
      measurementUnit: editUnit,
      ...(needsTender ? {
        tenderName: editTenderName,
        tenderEndDate: editTenderEndDate ? new Date(editTenderEndDate).getTime() : undefined,
        tenderLimit: Number(editTenderLimit),
        tenderHistory: newHistory,
        previousTenderStock: newPreviousTenderStock
      } : {})
    });

    if (needsTender && isNewTender) {
      await addTransaction({
        itemId: editingItem.id!,
        unit: unit,
        type: 'GİRİŞ',
        quantity: Number(editTenderLimit),
        date: Date.now(),
        personnelId: Number(editPersonnelId),
        description: 'Yeni İhale Stoğu',
        documentNo: editDocumentNo
      });

      printMuayeneKabul({
        itemName: editName,
        quantity: editTenderLimit,
        measurementUnit: editUnit,
        documentNo: editDocumentNo,
        personnelName: personnelMap[Number(editPersonnelId)],
        date: Date.now()
      });
    }

    setEditingItem(null);
    setEditDocumentNo('');
    loadData();
  };

  const handleAddBulkItemRow = () => {
    setBulkItems([...bulkItems, { name: '', unit: 'Adet', limit: '' }]);
  };

  const handleRemoveBulkItemRow = (index: number) => {
    const newItems = [...bulkItems];
    newItems.splice(index, 1);
    setBulkItems(newItems);
  };

  const handleBulkItemChange = (index: number, field: string, value: string) => {
    setBulkItems(prev => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], [field]: value };
      return newItems;
    });
  };

  const handleAddBulkExitRow = () => {
    setBulkExitItems([...bulkExitItems, { itemId: '', quantity: '' }]);
  };

  const handleRemoveBulkExitRow = (index: number) => {
    const newItems = [...bulkExitItems];
    newItems.splice(index, 1);
    setBulkExitItems(newItems);
  };

  const handleBulkExitItemChange = (index: number, field: string, value: any) => {
    const newItems = [...bulkExitItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setBulkExitItems(newItems);
  };

  const handleSubmitBulkExit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkExitPersonnelId || !bulkExitDocumentNo) {
      alert('Personel ve evrak no zorunludur.');
      return;
    }

    for (const item of bulkExitItems) {
      if (!item.itemId || !item.quantity) {
        alert('Tüm satırlar için malzeme ve miktar girilmelidir.');
        return;
      }
      const stockItem = items.find(i => i.id === Number(item.itemId));
      if (stockItem && stockItem.currentStock < Number(item.quantity)) {
        alert(`${stockItem.name} için yetersiz stok. Mevcut: ${stockItem.currentStock}`);
        return;
      }
    }

    try {
      for (const item of bulkExitItems) {
        await addTransaction({
          itemId: Number(item.itemId),
          unit: unit,
          type: 'ÇIKIŞ',
          quantity: Number(item.quantity),
          date: Date.now(),
          personnelId: Number(bulkExitPersonnelId),
          description: bulkExitDescription || 'Toplu Stok Çıkışı',
          documentNo: bulkExitDocumentNo
        });
      }

      setShowBulkExitModal(false);
      setBulkExitItems([{ itemId: '', quantity: '' }]);
      setBulkExitPersonnelId('');
      setBulkExitDocumentNo('');
      setBulkExitDescription('');
      loadData();
      alert('Toplu stok çıkışı başarıyla tamamlandı.');
    } catch (err) {
      console.error(err);
      alert('İşlem sırasında bir hata oluştu.');
    }
  };

  const handleOpenEditTender = (tName: string) => {
    const tenderItems = items.filter(i => i.tenderName === tName);
    setEditingTenderName(tName);
    setEditTenderItems(tenderItems);
    const firstItem = tenderItems[0];
    setEditTenderEndDateVal(firstItem?.tenderEndDate ? format(firstItem.tenderEndDate, 'yyyy-MM-dd') : '');
    setEditTenderPersonnelId('');
    setEditTenderConfirm(false);
    setAllowTenderHeaderEdit(false);
    setShowEditTenderModal(true);
  };

  const handleEditTenderItemChange = (index: number, field: string, value: any) => {
    const newItems = [...editTenderItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setEditTenderItems(newItems);
  };

  const handleSubmitEditTender = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTenderPersonnelId || !editTenderConfirm) {
      alert('İşlemi yapan personeli seçmeli ve onay kutusunu işaretlemelisiniz.');
      return;
    }

    try {
      const selectedPersonnel = personnel.find(p => p.id === Number(editTenderPersonnelId));
      if (!selectedPersonnel) return;

      for (const item of editTenderItems) {
        const originalItem = items.find(i => i.id === item.id);
        if (!originalItem) continue;

        const changes = [];
        if (originalItem.tenderName !== editingTenderName) changes.push(`İhale Adı: ${originalItem.tenderName} -> ${editingTenderName}`);
        if (originalItem.tenderLimit !== Number(item.tenderLimit)) changes.push(`Limit: ${originalItem.tenderLimit} -> ${item.tenderLimit}`);
        
        const oldDate = originalItem.tenderEndDate ? format(originalItem.tenderEndDate, 'yyyy-MM-dd') : '';
        if (oldDate !== editTenderEndDateVal) changes.push(`Tarih: ${oldDate} -> ${editTenderEndDateVal}`);

        const newHistory = [...(originalItem.tenderHistory || [])];
        if (changes.length > 0) {
          newHistory.push({
            date: Date.now(),
            personnelId: Number(editTenderPersonnelId),
            personnelName: selectedPersonnel.name,
            changes: changes.join(', ')
          });
        }

        await updateItem({
          ...item,
          tenderName: editingTenderName,
          tenderEndDate: editTenderEndDateVal ? new Date(editTenderEndDateVal).getTime() : undefined,
          tenderLimit: Number(item.tenderLimit),
          tenderHistory: newHistory
        });
      }

      setShowEditTenderModal(false);
      loadData();
      alert('İhale başarıyla güncellendi.');
    } catch (err) {
      console.error(err);
      alert('Güncelleme sırasında bir hata oluştu.');
    }
  };

  const handleDeleteTender = async () => {
    if (!window.confirm(`"${editingTenderName}" ihalesine ait TÜM ürünler silinecektir. Bu işlem geri alınamaz. Onaylıyor musunuz?`)) return;
    
    try {
      for (const item of editTenderItems) {
        if (item.id) await deleteItem(item.id);
      }
      setShowEditTenderModal(false);
      loadData();
      alert('İhale ve tüm ürünleri başarıyla silindi.');
    } catch (err) {
      console.error(err);
      alert('Silme işlemi sırasında bir hata oluştu.');
    }
  };

  const handleSubmitBulkTender = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkTenderName || !bulkPersonnelId || !bulkDocumentNo) {
      alert('İhale adı, personel ve evrak no zorunludur.');
      return;
    }
    
    for (const item of bulkItems) {
      if (!item.name || !item.limit) {
        alert('Tüm ürünlerin adı ve toplam stoğu girilmelidir.');
        return;
      }
    }

    try {
      const addedItemsForPrint = [];
      for (const item of bulkItems) {
        const newItemId = await addItem({
          name: item.name,
          unit: unit,
          measurementUnit: item.unit,
          currentStock: 0,
          tenderName: bulkTenderName,
          tenderEndDate: bulkTenderEndDate ? new Date(bulkTenderEndDate).getTime() : undefined,
          tenderLimit: Number(item.limit)
        });

        await addTransaction({
          itemId: newItemId as number,
          unit: unit,
          type: 'GİRİŞ',
          quantity: Number(item.limit),
          date: Date.now(),
          personnelId: Number(bulkPersonnelId),
          description: 'İhale Başlangıç Stoğu',
          documentNo: bulkDocumentNo
        });

        addedItemsForPrint.push({
          itemName: item.name,
          quantity: item.limit,
          measurementUnit: item.unit
        });
      }

      printBulkMuayeneKabul({
        items: addedItemsForPrint,
        documentNo: bulkDocumentNo,
        personnelName: personnelMap[Number(bulkPersonnelId)],
        date: Date.now()
      });

      setShowTenderModal(false);
      setBulkTenderName('');
      setBulkTenderEndDate('');
      setBulkItems([{ name: '', unit: 'Adet', limit: '' }]);
      setBulkPersonnelId('');
      setBulkDocumentNo('');
      loadData();
    } catch (err) {
      console.error(err);
      alert('İhale kaydedilirken bir hata oluştu.');
    }
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
          .header { text-align: center; margin-bottom: 30px; position: relative; }
          .logo { position: absolute; left: 0; top: 0; width: 80px; height: 80px; border-radius: 50%; }
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
          <img src="${APP_LOGO_URL}" class="logo" />
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

  const printBulkMuayeneKabul = (data: { items: any[], documentNo: string, personnelName: string, date: number }) => {
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
          .header { text-align: center; margin-bottom: 30px; position: relative; }
          .logo { position: absolute; left: 0; top: 0; width: 80px; height: 80px; border-radius: 50%; }
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
          <img src="${APP_LOGO_URL}" class="logo" />
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
            ${data.items.map((item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${item.itemName}</td>
                <td>${item.quantity}</td>
                <td>${item.measurementUnit}</td>
              </tr>
            `).join('')}
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

  const lowStockItems = items.filter(item => {
    const threshold = item.tenderLimit ? Math.max(item.tenderLimit * 0.1, 2) : 2;
    return item.currentStock < threshold;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">{unit} Paneli</h1>
      </div>

      {lowStockItems.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Düşük Stok Uyarısı</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc pl-5 space-y-1">
                  {lowStockItems.map(item => (
                    <li key={item.id}>
                      <strong>{item.name}</strong> kritik seviyede! Mevcut stok: {item.currentStock} {item.measurementUnit}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

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
            <h3 className="text-lg font-medium text-gray-900 mb-4">Stok Giriş / Çıkış Paneli</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <button
                type="button"
                onClick={() => setShowTenderModal(true)}
                className="flex justify-center items-center px-4 py-4 border-2 border-dashed border-red-300 rounded-xl text-sm font-semibold text-red-700 bg-red-50 hover:bg-red-100 transition-all shadow-sm"
              >
                <Plus className="w-6 h-6 mr-2" />
                {needsTender ? 'Yeni İhale Tanımla' : 'Toplu Stok Girişi'}
              </button>
              
              <button
                type="button"
                onClick={() => setShowBulkExitModal(true)}
                className="flex justify-center items-center px-4 py-4 border-2 border-dashed border-gray-300 rounded-xl text-sm font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 transition-all shadow-sm"
              >
                <ArrowUpRight className="w-6 h-6 mr-2" />
                Toplu Stok Çıkışı
              </button>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    Sistem artık sadece toplu giriş ve çıkış işlemlerini desteklemektedir. Tekli ürün eklemek yerine yukarıdaki panelleri kullanın.
                  </p>
                </div>
              </div>
            </div>
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
                          <div className="flex items-center">
                            {item.name}
                            {item.currentStock <= 0 && (
                              <AlertCircle className="w-4 h-4 text-red-600 ml-2" title="Stok Bitti" />
                            )}
                            {item.currentStock > 0 && item.currentStock < (item.tenderLimit ? Math.max(item.tenderLimit * 0.1, 2) : 2) && (
                              <AlertTriangle className="w-4 h-4 text-yellow-500 ml-2" title="Düşük Stok" />
                            )}
                          </div>
                          {item.tenderName && (
                            <div 
                              className="text-xs text-blue-600 font-normal mt-1 cursor-pointer hover:underline flex items-center"
                              onClick={() => setHistoryItem(item)}
                              title="İhale değişiklik geçmişini görmek için tıklayın"
                            >
                              İhale: {item.tenderName} 
                              {item.tenderEndDate && ` (Bitiş: ${format(item.tenderEndDate, 'dd.MM.yyyy')})`}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`font-bold ${
                            item.currentStock <= 0 
                            ? 'text-red-600' 
                            : item.currentStock < (item.tenderLimit ? Math.max(item.tenderLimit * 0.1, 2) : 2)
                            ? 'text-yellow-600'
                            : 'text-green-600'
                          }`}>
                            {item.currentStock}
                          </span> {item.measurementUnit}
                          {item.currentStock <= 0 && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              Stok Bitti
                            </span>
                          )}
                          {item.currentStock > 0 && item.currentStock < (item.tenderLimit ? Math.max(item.tenderLimit * 0.1, 2) : 2) && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                              Kritik Seviye
                            </span>
                          )}
                          {item.tenderLimit && (
                            <div className="text-xs text-gray-400 mt-1">
                              Toplam Stok: {item.tenderLimit}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => setEditingItem(item)}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Tekli Düzenle"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {item.tenderName && (
                              <button
                                onClick={() => handleOpenEditTender(item.tenderName!)}
                                className="text-blue-600 hover:text-blue-900"
                                title="İhaleyi Toplu Düzenle"
                              >
                                <PackageOpen className="w-4 h-4" />
                              </button>
                            )}
                          </div>
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
                    disabled={needsTender}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border disabled:bg-gray-100 disabled:text-gray-500"
                  >
                    {!needsTender && <option value="GİRİŞ">GİRİŞ</option>}
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

              {txType === 'ÇIKIŞ' && txItemId && txQuantity && (
                <div className={`p-3 rounded-md border flex justify-between items-center ${
                  (itemMap[Number(txItemId)]?.currentStock - Number(txQuantity)) < 0 
                  ? 'bg-red-50 border-red-200 text-red-700' 
                  : 'bg-green-50 border-green-200 text-green-700'
                }`}>
                  <span className="text-sm font-medium">İşlem Sonrası Kalan Stok:</span>
                  <span className="text-lg font-bold">
                    {(itemMap[Number(txItemId)]?.currentStock - Number(txQuantity)).toFixed(2)} {itemMap[Number(txItemId)]?.measurementUnit}
                  </span>
                </div>
              )}

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
                          {tx.remainingStock !== undefined && (
                            <p className="mt-2 sm:mt-0 sm:ml-6">
                              Kalan Stok: <span className="font-medium text-gray-900">{tx.remainingStock} {itemMap[tx.itemId]?.measurementUnit}</span>
                            </p>
                          )}
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
                <select
                  required
                  value={editName}
                  onChange={(e) => {
                    const selected = masterItems.find(i => i.name === e.target.value);
                    setEditName(e.target.value);
                    if (selected) setEditUnit(selected.measurementUnit);
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border"
                >
                  <option value="">Seçiniz...</option>
                  {masterItems.map(item => (
                    <option key={item.id} value={item.name}>{item.name}</option>
                  ))}
                </select>
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
                  <option>Teneke</option>
                </select>
              </div>
              {needsTender && (
                <>
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">İhale Bilgileri</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">İhale Adı</label>
                        <input 
                          type="text" 
                          required 
                          disabled={true}
                          value={editTenderName} 
                          onChange={e => setEditTenderName(e.target.value)} 
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border bg-gray-100 text-gray-500 cursor-not-allowed" 
                        />
                        <p className="text-[10px] text-blue-600 mt-1">* İhale adı sadece "İhale Yönetimi" sayfasından değiştirilebilir.</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Geçerlilik Tarihi</label>
                        <input 
                          type="date" 
                          disabled={true}
                          value={editTenderEndDate} 
                          onChange={e => setEditTenderEndDate(e.target.value)} 
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border bg-gray-100 text-gray-500 cursor-not-allowed" 
                        />
                        <p className="text-[10px] text-blue-600 mt-1">* İhale tarihi sadece "İhale Yönetimi" sayfasından değiştirilebilir.</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">İhale Toplam Stoğu</label>
                        <input type="number" required value={editTenderLimit} onChange={e => setEditTenderLimit(e.target.value ? Number(e.target.value) : '')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border" />
                        {editingItem.tenderLimit && (
                          <p className="text-xs text-red-500 mt-1">Mevcut toplam stok: {editingItem.tenderLimit}. Stok miktarı arttırılamaz.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {(editTenderName !== editingItem.tenderName || 
                    editTenderLimit !== editingItem.tenderLimit || 
                    editTenderEndDate !== (editingItem.tenderEndDate ? format(editingItem.tenderEndDate, 'yyyy-MM-dd') : '')) && (
                    <div className="border-t border-gray-200 pt-4 mt-4 bg-yellow-50 p-3 rounded-md">
                      <h4 className="text-sm font-medium text-yellow-800 mb-3 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        İhale Bilgisi Değişiklik Onayı
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">İşlemi Yapan Personel</label>
                          <select required value={editPersonnelId} onChange={e => setEditPersonnelId(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border">
                            <option value="">Seçiniz...</option>
                            {personnel.map(p => (
                              <option key={p.id} value={p.id}>{p.name} - {p.title}</option>
                            ))}
                          </select>
                        </div>
                        {(editTenderName !== editingItem.tenderName) && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Evrak No</label>
                            <input type="text" required value={editDocumentNo} onChange={e => setEditDocumentNo(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border" />
                          </div>
                        )}
                        <div className="flex items-start">
                          <div className="flex items-center h-5">
                            <input id="confirm" type="checkbox" required checked={editConfirm} onChange={e => setEditConfirm(e.target.checked)} className="focus:ring-red-500 h-4 w-4 text-red-600 border-gray-300 rounded" />
                          </div>
                          <div className="ml-3 text-sm">
                            <label htmlFor="confirm" className="font-medium text-gray-700">Değişikliği Onaylıyorum</label>
                            <p className="text-gray-500">İhale bilgilerinde yaptığım değişikliğin kayıt altına alınmasını onaylıyorum.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
              {isTenderExpired(editingItem) && (
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

              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setEditingItem(null)} className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">İptal</button>
                <button 
                  type="submit" 
                  disabled={isTenderExpired(editingItem)}
                  className={`px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${isTenderExpired(editingItem) ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* History Modal */}
      {historyItem && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full shadow-xl max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                İhale Değişiklik Geçmişi: {historyItem.name}
              </h3>
              <button onClick={() => setHistoryItem(null)} className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">Kapat</span>
                &times;
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1 pr-2">
              {historyItem.tenderHistory && historyItem.tenderHistory.length > 0 ? (
                <div className="space-y-4">
                  {historyItem.tenderHistory.map((hist, idx) => (
                    <div key={idx} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-sm text-gray-900">{hist.personnelName}</span>
                        <span className="text-xs text-gray-500">{format(hist.date, 'dd.MM.yyyy HH:mm')}</span>
                      </div>
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Değişiklikler:</span> {hist.changes}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">Bu ihale için henüz bir değişiklik kaydedilmemiş.</p>
              )}
            </div>
            
            <div className="mt-6 flex justify-end">
              <button onClick={() => setHistoryItem(null)} className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Bulk Tender Modal */}
      {showTenderModal && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full shadow-xl max-h-[90vh] flex flex-col">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Yeni İhale Tanımla</h3>
            <form onSubmit={handleSubmitBulkTender} className="flex flex-col flex-1 overflow-hidden">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">İhale Adı</label>
                  <input type="text" required value={bulkTenderName} onChange={e => setBulkTenderName(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Geçerlilik Tarihi</label>
                  <input type="date" value={bulkTenderEndDate} onChange={e => setBulkTenderEndDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6 bg-gray-50 p-3 rounded-md border border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700">İşlemi Yapan Personel</label>
                  <select required value={bulkPersonnelId} onChange={e => setBulkPersonnelId(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border">
                    <option value="">Seçiniz...</option>
                    {personnel.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Evrak No</label>
                  <input type="text" required value={bulkDocumentNo} onChange={e => setBulkDocumentNo(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border" />
                </div>
              </div>

              <div className="flex justify-between items-center mb-2">
                <h4 className="text-md font-medium text-gray-800">İhale Ürünleri</h4>
                <button type="button" onClick={handleAddBulkItemRow} className="text-sm text-red-600 hover:text-red-800 flex items-center font-medium">
                  <Plus className="w-4 h-4 mr-1" /> Yeni Ürün Satırı Ekle
                </button>
              </div>

              <div className="overflow-y-auto flex-1 border border-gray-200 rounded-md p-2 bg-gray-50">
                {bulkItems.map((item, index) => (
                  <div key={index} className="flex items-center space-x-3 mb-3 bg-white p-3 rounded shadow-sm border border-gray-100">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Malzeme Adı</label>
                      <select
                        required
                        value={item.name}
                        onChange={(e) => {
                          const selected = masterItems.find(mi => mi.name === e.target.value);
                          handleBulkItemChange(index, 'name', e.target.value);
                          if (selected) handleBulkItemChange(index, 'unit', selected.measurementUnit);
                        }}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border"
                      >
                        <option value="">Seçiniz...</option>
                        {masterItems.map(mi => (
                          <option key={mi.id} value={mi.name}>{mi.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-32">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Birim</label>
                      <div className="block w-full rounded-md border-gray-200 bg-gray-100 sm:text-sm p-2 border text-gray-600">
                        {item.unit}
                      </div>
                    </div>
                    <div className="w-32">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Toplam Stok</label>
                      <input type="number" required value={item.limit} onChange={e => handleBulkItemChange(index, 'limit', e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border" />
                    </div>
                    <div className="pt-5">
                      <button type="button" onClick={() => handleRemoveBulkItemRow(index)} disabled={bulkItems.length === 1} className="text-gray-400 hover:text-red-600 disabled:opacity-50">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => setShowTenderModal(false)} className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">İptal</button>
                <button type="submit" className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700">İhaleyi Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Bulk Exit Modal */}
      {showBulkExitModal && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full shadow-xl max-h-[90vh] flex flex-col">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Toplu Stok Çıkışı</h3>
            <form onSubmit={handleSubmitBulkExit} className="flex flex-col flex-1 overflow-hidden">
              <div className="grid grid-cols-2 gap-4 mb-6 bg-gray-50 p-3 rounded-md border border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700">İşlemi Yapan Personel</label>
                  <select required value={bulkExitPersonnelId} onChange={e => setBulkExitPersonnelId(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border">
                    <option value="">Seçiniz...</option>
                    {personnel.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Resmi Evrak No</label>
                  <input type="text" required value={bulkExitDocumentNo} onChange={e => setBulkExitDocumentNo(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border" />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Açıklama</label>
                <input type="text" value={bulkExitDescription} onChange={e => setBulkExitDescription(e.target.value)} placeholder="Toplu çıkış açıklaması..." className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border" />
              </div>

              <div className="flex justify-between items-center mb-2">
                <h4 className="text-md font-medium text-gray-800">Çıkış Yapılacak Ürünler</h4>
                <button type="button" onClick={handleAddBulkExitRow} className="text-sm text-red-600 hover:text-red-800 flex items-center font-medium">
                  <Plus className="w-4 h-4 mr-1" /> Yeni Satır Ekle
                </button>
              </div>

              <div className="overflow-y-auto flex-1 border border-gray-200 rounded-md p-2 bg-gray-50">
                {bulkExitItems.map((item, index) => (
                  <div key={index} className="flex items-center space-x-3 mb-3 bg-white p-3 rounded shadow-sm border border-gray-100">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Malzeme</label>
                      <select
                        required
                        value={item.itemId}
                        onChange={(e) => handleBulkExitItemChange(index, 'itemId', e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border"
                      >
                        <option value="">Seçiniz...</option>
                        {items.map(i => (
                          <option key={i.id} value={i.id}>{i.name} (Mevcut: {i.currentStock} {i.measurementUnit})</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-32">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Miktar</label>
                      <input type="number" required min="0.01" step="0.01" value={item.quantity} onChange={e => handleBulkExitItemChange(index, 'quantity', e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border" />
                    </div>
                    <div className="w-32">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Kalan Stok</label>
                      <div className={`block w-full rounded-md sm:text-sm p-2 border font-bold ${
                        item.itemId && item.quantity && (itemMap[Number(item.itemId)]?.currentStock - Number(item.quantity)) < 0 
                        ? 'bg-red-50 border-red-300 text-red-600' 
                        : 'bg-green-50 border-green-300 text-green-600'
                      }`}>
                        {item.itemId && item.quantity 
                          ? (itemMap[Number(item.itemId)]?.currentStock - Number(item.quantity)).toFixed(2) 
                          : '-'}
                      </div>
                    </div>
                    <div className="pt-5">
                      <button type="button" onClick={() => handleRemoveBulkExitRow(index)} disabled={bulkExitItems.length === 1} className="text-gray-400 hover:text-red-600 disabled:opacity-50">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => setShowBulkExitModal(false)} className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">İptal</button>
                <button type="submit" className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700">Çıkışları Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Tender Modal */}
      {showEditTenderModal && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg p-6 max-w-5xl w-full shadow-xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">İhaleyi Düzenle: {editingTenderName}</h3>
              <button onClick={handleDeleteTender} className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center">
                <X className="w-4 h-4 mr-1" /> İhaleyi Sil
              </button>
            </div>
            
            <form onSubmit={handleSubmitEditTender} className="flex flex-col flex-1 overflow-hidden">
              <div className="bg-blue-50 p-4 rounded-md border border-blue-200 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      id="allowHeaderEdit" 
                      checked={allowTenderHeaderEdit} 
                      onChange={e => setAllowTenderHeaderEdit(e.target.checked)} 
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" 
                    />
                    <label htmlFor="allowHeaderEdit" className="ml-2 block text-sm text-blue-900 font-medium">
                      İhale adını veya tarihini değiştirmek istiyorum
                    </label>
                  </div>
                  {!allowTenderHeaderEdit && (
                    <span className="text-xs text-blue-600 italic">* Bu alanlar varsayılan olarak kilitlidir.</span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">İhale Adı</label>
                    <input 
                      type="text" 
                      required 
                      disabled={!allowTenderHeaderEdit}
                      value={editingTenderName} 
                      onChange={e => setEditingTenderName(e.target.value)} 
                      className={`mt-1 block w-full rounded-md shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border ${!allowTenderHeaderEdit ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white'}`} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Geçerlilik Tarihi</label>
                    <input 
                      type="date" 
                      disabled={!allowTenderHeaderEdit}
                      value={editTenderEndDateVal} 
                      onChange={e => setEditTenderEndDateVal(e.target.value)} 
                      className={`mt-1 block w-full rounded-md shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border ${!allowTenderHeaderEdit ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white'}`} 
                    />
                  </div>
                </div>
              </div>

              <div className="overflow-y-auto flex-1 border border-gray-200 rounded-md p-2 bg-gray-50">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Malzeme</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Birim</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Toplam Limit</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Mevcut Stok</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {editTenderItems.map((item, index) => (
                      <tr key={item.id}>
                        <td className="px-4 py-2 text-sm text-gray-900">{item.name}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">{item.measurementUnit}</td>
                        <td className="px-4 py-2">
                          <input 
                            type="number" 
                            required 
                            value={item.tenderLimit} 
                            onChange={e => handleEditTenderItemChange(index, 'tenderLimit', e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-xs p-1 border"
                          />
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500">{item.currentStock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 p-4 bg-yellow-50 rounded-md border border-yellow-200">
                <div className="flex items-center mb-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">Değişikliği Onaylayan Personel</label>
                    <select required value={editTenderPersonnelId} onChange={e => setEditTenderPersonnelId(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border">
                      <option value="">Seçiniz...</option>
                      {personnel.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" id="confirmEdit" checked={editTenderConfirm} onChange={e => setEditTenderConfirm(e.target.checked)} className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded" />
                  <label htmlFor="confirmEdit" className="ml-2 block text-sm text-gray-900 font-medium">
                    İhale bilgilerindeki değişiklikleri onaylıyorum. Bu işlem geçmişe kaydedilecektir.
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => setShowEditTenderModal(false)} className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">İptal</button>
                <button type="submit" className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700">Değişiklikleri Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
