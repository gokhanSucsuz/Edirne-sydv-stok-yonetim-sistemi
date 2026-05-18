import { format } from 'date-fns';
import { Item, Transaction, Personnel } from './db';
import { APP_LOGO_URL } from '../constants';

export const generateBulkMuayeneKabul = (
  items: { name: string; quantity: number; unit: string; measurementUnit: string }[],
  personnel: Personnel[],
  documentNo: string,
  tenderName: string,
  currentUser?: Personnel | null
) => {
  const now = new Date();
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <title>Muayene ve Kabul Tutanağı</title>
      <style>
        body { font-family: 'Times New Roman', Times, serif; margin: 40px; color: #000; line-height: 1.5; }
        .header { text-align: center; margin-bottom: 30px; position: relative; }
        .logo { position: absolute; left: 0; top: 0; width: 60px; height: 60px; border-radius: 50%; }
        .header h1 { font-size: 16px; margin: 5px 0; font-weight: bold; }
        .header h2 { font-size: 14px; margin: 5px 0; font-weight: normal; }
        .date-right { text-align: right; margin-bottom: 20px; font-size: 12px; }
        .title { text-align: center; font-weight: bold; text-decoration: underline; margin-bottom: 20px; font-size: 16px; }
        .content { text-align: justify; margin-bottom: 30px; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 12px; }
        th, td { border: 1px solid #000; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .footer { margin-top: 50px; display: flex; justify-content: space-around; }
        .signature { text-align: center; width: 200px; font-size: 12px; }
        .signature p { margin: 5px 0; }
        .report-footer { margin-top: 40px; padding-top: 10px; border-top: 1px dashed #ccc; font-size: 10px; color: #666; text-align: right; }
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
        Tarih: ${format(now, 'dd.MM.yyyy')}
      </div>

      <div class="title">MUAYENE VE KABUL TUTANAĞI</div>

      <div class="content">
        <p><strong>İhale Adı:</strong> ${tenderName}</p>
        <p><strong>Evrak No:</strong> ${documentNo}</p>
        <p>Vakfımız tarafından ihalesi/alımı gerçekleştirilen aşağıda dökümü yapılan malzemeler, muayene ve kabul komisyonu tarafından incelenmiş, teknik şartnameye ve numuneye uygun olduğu tespit edilerek eksiksiz bir şekilde teslim alınmıştır.</p>
      </div>

      <table>
        <thead>
          <tr>
            <th>Sıra No</th>
            <th>Malzeme Adı</th>
            <th>Miktar</th>
            <th>Birim</th>
            <th>Birim (Depo)</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((item, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${item.name}</td>
              <td>${item.quantity}</td>
              <td>${item.measurementUnit}</td>
              <td>${item.unit}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="content">
        <p>İşbu tutanak tarafımızca imza altına alınmıştır.</p>
      </div>

      <div class="footer">
        ${personnel.slice(0, 3).map(p => `
          <div class="signature">
            <p><strong>${p.name}</strong></p>
            <p>${p.title}</p>
            <br/><br/>
            <p>(İmza)</p>
          </div>
        `).join('')}
      </div>

      <div class="report-footer">
        Raporu Hazırlayan: ${currentUser ? `${currentUser.name} (${currentUser.title})` : 'Sistem'} | Yazdırılma: ${format(now, 'dd.MM.yyyy HH:mm')}
      </div>

      <script>
        window.onload = function() { 
          setTimeout(() => {
            window.print(); 
          }, 500);
        }
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};

export const generateItemReport = (
  mainItem: Item,
  relatedItems: Item[],
  transactions: Transaction[],
  personnel: Personnel[],
  type: 'all' | 'single' = 'all',
  currentUser?: Personnel | null
) => {
  const now = new Date();
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const personnelMap = new Map(personnel.map(p => [p.id, p.name]));
  const itemIds = type === 'all' ? new Set(relatedItems.map(i => i.id)) : new Set([mainItem.id]);
  
  const filteredTransactions = transactions.filter(tx => itemIds.has(tx.itemId))
    .sort((a, b) => b.date - a.date);

  const html = `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <title>${mainItem.name} Stok Raporu</title>
      <style>
        body { font-family: 'Times New Roman', Times, serif; margin: 30px; color: #000; line-height: 1.4; }
        .header { text-align: center; margin-bottom: 20px; position: relative; }
        .logo { position: absolute; left: 0; top: 0; width: 50px; height: 50px; border-radius: 50%; }
        .header h1 { font-size: 14px; margin: 2px 0; font-weight: bold; }
        .header h2 { font-size: 12px; margin: 2px 0; font-weight: normal; }
        .date-right { text-align: right; margin-bottom: 15px; font-size: 10px; }
        .title { text-align: center; font-weight: bold; text-decoration: underline; margin-bottom: 15px; font-size: 14px; }
        .section-title { font-weight: bold; margin-top: 20px; margin-bottom: 10px; border-bottom: 1px solid #000; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 10px; }
        th, td { border: 1px solid #000; padding: 5px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        .footer { margin-top: 40px; display: flex; justify-content: space-between; }
        .signature { text-align: center; width: 180px; font-size: 11px; }
        .signature p { margin: 3px 0; }
        .report-footer { margin-top: 40px; padding-top: 10px; border-top: 1px dashed #ccc; font-size: 10px; color: #666; text-align: right; }
        @media print {
          body { margin: 15px; }
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

      <div class="title">${mainItem.name.toUpperCase()} STOK HAREKET VE DURUM RAPORU</div>

      <div class="section-title">MEVCUT DURUM (TÜM İHALELER)</div>
      <table>
        <thead>
          <tr>
            <th>İhale/Bağış Adı</th>
            <th>Birim</th>
            <th>İhale Limiti</th>
            <th>Teslim Alınan</th>
            <th>Mevcut Stok</th>
            <th>Durum</th>
          </tr>
        </thead>
        <tbody>
          ${relatedItems.map(item => `
            <tr>
              <td>${item.tenderName || 'Genel Stok'}</td>
              <td>${item.unit}</td>
              <td>${item.tenderLimit || '-'} ${item.measurementUnit}</td>
              <td>${item.totalReceived || 0} ${item.measurementUnit}</td>
              <td style="font-weight:bold;">${item.currentStock} ${item.measurementUnit}</td>
              <td>${item.tenderEndDate ? (item.tenderEndDate < Date.now() ? 'Süresi Doldu' : 'Aktif') : 'Süresiz'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="section-title">İŞLEM GEÇMİŞİ</div>
      <table>
        <thead>
          <tr>
            <th>Tarih</th>
            <th>İhale/Bağış</th>
            <th>İşlem</th>
            <th>Miktar</th>
            <th>Kalan Stok</th>
            <th>Personel</th>
            <th>Evrak No</th>
            <th>Açıklama</th>
          </tr>
        </thead>
        <tbody>
          ${filteredTransactions.length === 0 ? '<tr><td colspan="8" style="text-align:center;">İşlem kaydı bulunamadı.</td></tr>' : 
            filteredTransactions.map(tx => {
              const item = relatedItems.find(i => i.id === tx.itemId);
              return `
                <tr>
                  <td>${format(tx.date, 'dd.MM.yyyy')}</td>
                  <td>${item?.tenderName || 'Genel'}</td>
                  <td style="color: ${tx.type === 'GİRİŞ' ? 'green' : 'red'}; font-weight: bold;">${tx.type}</td>
                  <td>${tx.quantity} ${item?.measurementUnit || ''}</td>
                  <td>${tx.remainingStock} ${item?.measurementUnit || ''}</td>
                  <td>${personnelMap.get(tx.personnelId) || '-'}</td>
                  <td>${tx.documentNo}</td>
                  <td>${tx.description}</td>
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
          <p><strong>${currentUser?.name || '................................'}</strong></p>
          <p>${currentUser?.title || 'Vakıf Personeli'}</p>
        </div>
        <div class="signature">
          <p>Onaylayan</p>
          <br/><br/>
          <p>................................</p>
          <p>Vakıf Müdürü</p>
        </div>
      </div>

      <div class="report-footer">
        Raporu Hazırlayan: ${currentUser ? `${currentUser.name} (${currentUser.title})` : 'Sistem'} | Yazdırılma: ${format(now, 'dd.MM.yyyy HH:mm')}
      </div>

      <script>
        window.onload = function() { 
          setTimeout(() => {
            window.print(); 
          }, 500);
        }
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};

export const generateMonthlyInventoryReport = (
  items: Item[],
  transactions: Transaction[],
  personnel: Personnel[],
  month: number,
  year: number,
  currentUser?: Personnel | null
) => {
  const now = new Date();
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const monthNames = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
  ];

  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0, 23, 59, 59);

  const filteredTransactions = transactions.filter(tx => 
    tx.date >= startDate.getTime() && tx.date <= endDate.getTime()
  ).sort((a, b) => a.date - b.date);

  const itemMap = new Map(items.map(i => [i.id, i]));
  const personnelMap = new Map(personnel.map(p => [p.id, p.name]));

  const html = `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <title>Aylık Envanter Raporu - ${monthNames[month]} ${year}</title>
      <style>
        body { font-family: 'Times New Roman', Times, serif; margin: 30px; color: #000; line-height: 1.4; }
        .header { text-align: center; margin-bottom: 20px; position: relative; }
        .logo { position: absolute; left: 0; top: 0; width: 50px; height: 50px; border-radius: 50%; }
        .header h1 { font-size: 14px; margin: 2px 0; font-weight: bold; }
        .header h2 { font-size: 12px; margin: 2px 0; font-weight: normal; }
        .date-right { text-align: right; margin-bottom: 15px; font-size: 10px; }
        .title { text-align: center; font-weight: bold; text-decoration: underline; margin-bottom: 15px; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 10px; }
        th, td { border: 1px solid #000; padding: 5px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        .footer { margin-top: 40px; display: flex; justify-content: space-between; }
        .signature { text-align: center; width: 180px; font-size: 11px; }
        .signature p { margin: 3px 0; }
        .report-footer { margin-top: 40px; padding-top: 10px; border-top: 1px dashed #ccc; font-size: 10px; color: #666; text-align: right; }
        @media print {
          body { margin: 15px; }
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

      <div class="title">${monthNames[month].toUpperCase()} ${year} DÖNEMİ TÜM BİRİMLER STOK HAREKET RAPORU</div>

      <table>
        <thead>
          <tr>
            <th>Sıra</th>
            <th>Tarih</th>
            <th>Birim</th>
            <th>Malzeme Adı</th>
            <th>İşlem</th>
            <th>Miktar</th>
            <th>Birim</th>
            <th>Personel</th>
            <th>Evrak No</th>
          </tr>
        </thead>
        <tbody>
          ${filteredTransactions.length === 0 ? '<tr><td colspan="9" style="text-align:center;">Bu dönemde herhangi bir hareket bulunmamaktadır.</td></tr>' : 
            filteredTransactions.map((tx, index) => {
              const item = itemMap.get(tx.itemId);
              return `
                <tr>
                  <td>${index + 1}</td>
                  <td>${format(tx.date, 'dd.MM.yyyy')}</td>
                  <td>${tx.unit}</td>
                  <td>${item?.name || 'Bilinmeyen'}</td>
                  <td style="color: ${tx.type === 'GİRİŞ' ? 'green' : 'red'}; font-weight: bold;">${tx.type}</td>
                  <td>${tx.quantity}</td>
                  <td>${item?.measurementUnit || '-'}</td>
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
          <p><strong>${currentUser?.name || '................................'}</strong></p>
          <p>${currentUser?.title || 'Vakıf Personeli'}</p>
        </div>
        <div class="signature">
          <p>Onaylayan</p>
          <br/><br/>
          <p>................................</p>
          <p>Vakıf Müdürü</p>
        </div>
      </div>

      <div class="report-footer">
        Raporu Hazırlayan: ${currentUser ? `${currentUser.name} (${currentUser.title})` : 'Sistem'} | Yazdırılma: ${format(now, 'dd.MM.yyyy HH:mm')}
      </div>

      <script>
        window.onload = function() { 
          setTimeout(() => {
            window.print(); 
          }, 500);
        }
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};

export const generateTenderReport = (
  tenderName: string,
  unit: string,
  tenderItems: Item[],
  allItems: Item[],
  transactions: Transaction[],
  personnel: Personnel[],
  currentUser?: Personnel | null
) => {
  const now = new Date();
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const personnelMap = new Map(personnel.map(p => [p.id, p.name]));
  const tenderItemIds = new Set(tenderItems.map(i => i.id));
  
  // Filter transactions related to this tender's items
  const filteredTransactions = transactions.filter(tx => tenderItemIds.has(tx.itemId))
    .sort((a, b) => b.date - a.date);

  const html = `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <title>${tenderName} İhale Raporu</title>
      <style>
        body { font-family: 'Times New Roman', Times, serif; margin: 30px; color: #000; line-height: 1.4; }
        .header { text-align: center; margin-bottom: 20px; position: relative; }
        .logo { position: absolute; left: 0; top: 0; width: 50px; height: 50px; border-radius: 50%; }
        .header h1 { font-size: 14px; margin: 2px 0; font-weight: bold; }
        .header h2 { font-size: 12px; margin: 2px 0; font-weight: normal; }
        .date-right { text-align: right; margin-bottom: 15px; font-size: 10px; }
        .title { text-align: center; font-weight: bold; text-decoration: underline; margin-bottom: 15px; font-size: 14px; }
        .section-title { font-weight: bold; margin-top: 20px; margin-bottom: 10px; border-bottom: 1px solid #000; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 10px; }
        th, td { border: 1px solid #000; padding: 5px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        .footer { margin-top: 40px; display: flex; justify-content: space-between; }
        .signature { text-align: center; width: 180px; font-size: 11px; }
        .signature p { margin: 3px 0; }
        .info-box { border: 1px solid #000; padding: 10px; margin-bottom: 20px; font-size: 11px; }
        .report-footer { margin-top: 40px; padding-top: 10px; border-top: 1px dashed #ccc; font-size: 10px; color: #666; text-align: right; }
        @media print {
          body { margin: 15px; }
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

      <div class="title">İHALE DETAY VE STOK DURUM RAPORU</div>

      <div class="info-box">
        <strong>İhale Adı:</strong> ${tenderName}<br/>
        <strong>Birim:</strong> ${unit}<br/>
        <strong>İhale Türü:</strong> ${tenderItems[0]?.tenderType || 'İhale'}<br/>
        <strong>Bitiş Tarihi:</strong> ${tenderItems[0]?.tenderEndDate ? format(tenderItems[0].tenderEndDate, 'dd.MM.yyyy') : 'Belirtilmemiş'}
      </div>

      <div class="section-title">İHALE KAPSAMINDAKİ ÜRÜNLER VE STOK DURUMU</div>
      <table>
        <thead>
          <tr>
            <th>Sıra</th>
            <th>Ürün Adı</th>
            <th>İhale Limiti</th>
            <th>Teslim Alınan</th>
            <th>Harcanan</th>
            <th>Kalan Stok</th>
            <th>Diğer İhaleler</th>
          </tr>
        </thead>
        <tbody>
          ${tenderItems.map((item, index) => {
            const received = item.totalReceived || 0;
            const current = item.currentStock || 0;
            const spent = received - current;
            
            // Check other tenders for the same product
            const otherTenders = allItems.filter(i => i.name === item.name && i.id !== item.id);
            const otherTendersInfo = otherTenders.length > 0 
              ? `${otherTenders.length} Farklı İhale (${otherTenders.reduce((acc, curr) => acc + (curr.currentStock || 0), 0)} ${item.measurementUnit})`
              : 'Yok';

            return `
              <tr>
                <td>${index + 1}</td>
                <td>${item.name}</td>
                <td>${item.tenderLimit} ${item.measurementUnit}</td>
                <td>${received} ${item.measurementUnit}</td>
                <td>${spent.toFixed(2)} ${item.measurementUnit}</td>
                <td style="font-weight:bold;">${current} ${item.measurementUnit}</td>
                <td>${otherTendersInfo}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>

      <div class="section-title">BU İHALE İLE İLGİLİ YAPILAN İŞLEMLER</div>
      <table>
        <thead>
          <tr>
            <th>Tarih</th>
            <th>Ürün</th>
            <th>İşlem</th>
            <th>Miktar</th>
            <th>Personel</th>
            <th>Evrak No</th>
            <th>Açıklama</th>
          </tr>
        </thead>
        <tbody>
          ${filteredTransactions.length === 0 ? '<tr><td colspan="7" style="text-align:center;">İşlem kaydı bulunamadı.</td></tr>' : 
            filteredTransactions.map(tx => {
              const item = tenderItems.find(i => i.id === tx.itemId);
              return `
                <tr>
                  <td>${format(tx.date, 'dd.MM.yyyy')}</td>
                  <td>${item?.name || 'Bilinmeyen'}</td>
                  <td style="color: ${tx.type === 'GİRİŞ' ? 'green' : 'red'}; font-weight: bold;">${tx.type}</td>
                  <td>${tx.quantity} ${item?.measurementUnit || ''}</td>
                  <td>${personnelMap.get(tx.personnelId) || '-'}</td>
                  <td>${tx.documentNo}</td>
                  <td>${tx.description}</td>
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
          <p><strong>${currentUser?.name || '................................'}</strong></p>
          <p>${currentUser?.title || 'Vakıf Personeli'}</p>
        </div>
        <div class="signature">
          <p>Onaylayan</p>
          <br/><br/>
          <p>................................</p>
          <p>Vakıf Müdürü</p>
        </div>
      </div>

      <div class="report-footer">
        Raporu Hazırlayan: ${currentUser ? `${currentUser.name} (${currentUser.title})` : 'Sistem'} | Yazdırılma: ${format(now, 'dd.MM.yyyy HH:mm')}
      </div>

      <script>
        window.onload = function() { 
          setTimeout(() => {
            window.print(); 
          }, 500);
        }
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};
