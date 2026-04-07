import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { Item, Transaction, Personnel } from './db';

// Extend jsPDF with autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export const generateItemReport = (
  item: Item,
  allRelatedItems: Item[],
  transactions: Transaction[],
  personnel: Personnel[],
  filterType: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all' = 'all'
) => {
  const doc = new jsPDF();
  const now = new Date();

  // Filter transactions by date if needed
  let filteredTransactions = transactions.filter(tx => tx.itemId === item.id || allRelatedItems.some(ri => ri.id === tx.itemId));
  
  if (filterType !== 'all') {
    const startTime = new Date();
    if (filterType === 'daily') startTime.setHours(0, 0, 0, 0);
    else if (filterType === 'weekly') startTime.setDate(now.getDate() - 7);
    else if (filterType === 'monthly') startTime.setMonth(now.getMonth() - 1);
    else if (filterType === 'yearly') startTime.setFullYear(now.getFullYear() - 1);
    
    filteredTransactions = filteredTransactions.filter(tx => tx.date >= startTime.getTime());
  }

  // Sort transactions by date
  filteredTransactions.sort((a, b) => a.date - b.date);

  // Group by tender
  const itemMap = new Map(allRelatedItems.map(i => [i.id, i]));
  const personnelMap = new Map(personnel.map(p => [p.id, p.name]));

  doc.setFontSize(18);
  doc.text('Malzeme Hareket Raporu', 14, 20);
  
  doc.setFontSize(12);
  doc.text(`Malzeme: ${item.name}`, 14, 30);
  doc.text(`Birim: ${item.unit}`, 14, 37);
  doc.text(`Rapor Tarihi: ${format(now, 'dd.MM.yyyy HH:mm')}`, 14, 44);
  doc.text(`Filtre: ${filterType === 'all' ? 'Tümü' : filterType}`, 14, 51);

  const tableData = filteredTransactions.map(tx => {
    const relatedItem = itemMap.get(tx.itemId);
    const sourceInfo = relatedItem?.tenderName 
      ? `${relatedItem.tenderName}${relatedItem.tenderType ? ` (${relatedItem.tenderType})` : ''}`
      : 'Genel';
    return [
      format(tx.date, 'dd.MM.yyyy'),
      sourceInfo,
      tx.type,
      `${tx.quantity} ${item.measurementUnit}`,
      `${tx.remainingStock} ${item.measurementUnit}`,
      personnelMap.get(tx.personnelId) || 'Bilinmiyor',
      tx.documentNo
    ];
  });

  doc.autoTable({
    startY: 60,
    head: [['Tarih', 'İhale/Kaynak', 'İşlem', 'Miktar', 'Kalan Stok', 'Personel', 'Evrak No']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillStyle: [239, 68, 68] }, // Red-600
  });

  doc.save(`${item.name}_rapor_${format(now, 'yyyyMMdd')}.pdf`);
};
