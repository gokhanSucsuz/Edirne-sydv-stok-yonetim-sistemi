import { format } from 'date-fns';
import { Item, Transaction, Personnel } from './db';
import { APP_LOGO_URL } from '../constants';

export const generateItemReport = (
  item: Item,
  allRelatedItems: Item[],
  transactions: Transaction[],
  personnel: Personnel[],
  filterType: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all' = 'all'
) => {
  const now = new Date();
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

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

  const itemMap = new Map(allRelatedItems.map(i => [i.id, i]));
  const personnelMap = new Map(personnel.map(p => [p.id, p.name]));

  const html = `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <title>${item.name} Hareket Raporu</title>
      <style>
        body { font-family: 'Times New Roman', Times, serif; margin: 40px; color: #000; line-height: 1.5; }
        .header { text-align: center; margin-bottom: 30px; position: relative; }
        .logo { position: absolute; left: 0; top: 0; width: 60px; height: 60px; border-radius: 50%; }
        .header h1 { font-size: 16px; margin: 5px 0; font-weight: bold; }
        .header h2 { font-size: 14px; margin: 5px 0; font-weight: normal; }
        .date-right { text-align: right; margin-bottom: 20px; font-size: 12px; }
        .title { text-align: center; font-weight: bold; text-decoration: underline; margin-bottom: 20px; font-size: 14px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; font-size: 12px; border: 1px solid #eee; padding: 10px; border-radius: 4px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 11px; }
        th, td { border: 1px solid #000; padding: 6px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        .footer { margin-top: 50px; display: flex; justify-content: space-between; }
        .signature { text-align: center; width: 200px; font-size: 12px; }
        .signature p { margin: 5px 0; }
        @media print {
          body { margin: 20px; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <img src="${APP_LOGO_URL}" class="logo" />
        <h1>T.C.</h1>
        <h1>EDİRNE VALİLİĞİ</h1>
        <h2>Sosyal Yardımlaşma ve Dayanışma Vakfı Başkanlığı</h2>
      </div>
      
      <div class="date-right">
        Rapor Tarihi: ${format(now, 'dd.MM.yyyy HH:mm')}
      </div>

      <div class="title">MALZEME HAREKET VE STOK RAPORU</div>

      <div class="info-grid">
        <div><strong>Malzeme Adı:</strong> ${item.name}</div>
        <div><strong>Birim:</strong> ${item.unit}</div>
        <div><strong>Ölçü Birimi:</strong> ${item.measurementUnit}</div>
        <div><strong>Filtreleme:</strong> ${filterType === 'all' ? 'Tüm Hareketler' : filterType.toUpperCase()}</div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Sıra</th>
            <th>Tarih</th>
            <th>İhale / Kaynak</th>
            <th>İşlem Türü</th>
            <th>Miktar</th>
            <th>Kalan Stok</th>
            <th>İşlemi Yapan Personel</th>
            <th>Evrak No</th>
          </tr>
        </thead>
        <tbody>
          ${filteredTransactions.length === 0 ? '<tr><td colspan="8" style="text-align:center;">Kayıtlı hareket bulunmamaktadır.</td></tr>' : 
            filteredTransactions.map((tx, index) => {
              const relatedItem = itemMap.get(tx.itemId);
              const sourceInfo = relatedItem?.tenderName 
                ? `${relatedItem.tenderName}${relatedItem.tenderType ? ` (${relatedItem.tenderType})` : ''}`
                : 'Genel';
              return `
                <tr>
                  <td>${index + 1}</td>
                  <td>${format(tx.date, 'dd.MM.yyyy')}</td>
                  <td>${sourceInfo}</td>
                  <td style="color: ${tx.type === 'GİRİŞ' ? 'green' : 'red'}; font-weight: bold;">${tx.type}</td>
                  <td>${tx.quantity} ${item.measurementUnit}</td>
                  <td>${tx.remainingStock} ${item.measurementUnit}</td>
                  <td>${personnelMap.get(tx.personnelId) || '-'}</td>
                  <td>${tx.documentNo}</td>
                </tr>
              `;
            }).join('')
          }
        </tbody>
      </table>

      <div class="footer">
        <div class="signature">
          <p>Hazırlayan</p>
          <br/><br/>
          <p>................................</p>
          <p>Vakıf Personeli</p>
        </div>
        <div class="signature">
          <p>Onaylayan</p>
          <br/><br/>
          <p>................................</p>
          <p>Vakıf Müdürü</p>
        </div>
      </div>

      <script>
        window.onload = function() { 
          setTimeout(() => {
            window.print(); 
            // window.close(); // Opsiyonel: Yazdırdıktan sonra kapatmak isterseniz
          }, 500);
        }
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};
