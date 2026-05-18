'use client';

import React, { useEffect, useState } from 'react';
import { 
  getAllItems, 
  getAllTransactions, 
  getPersonnel, 
  Item, 
  Transaction, 
  Personnel,
  UnitType
} from '@/lib/db';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, subDays, subWeeks, subMonths, isAfter } from 'date-fns';
import { tr } from 'date-fns/locale';
import { APP_LOGO_URL } from '@/lib/constants';
import { Printer, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function Statistics() {
  const { personnel: currentPersonnel } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [reportUnit, setReportUnit] = useState<UnitType | 'Tümü'>('Tümü');

  useEffect(() => {
    const loadData = async () => {
      const [i, t, p] = await Promise.all([
        getAllItems(),
        getAllTransactions(),
        getPersonnel()
      ]);
      setItems(i);
      setTransactions(t);
      setPersonnel(p);
    };
    loadData();
  }, []);

  // Prepare data for charts
  const itemsByUnit = items.reduce((acc, item) => {
    acc[item.unit] = (acc[item.unit] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.keys(itemsByUnit).map(key => ({
    name: key,
    value: itemsByUnit[key]
  }));

  const txByUnit = transactions.reduce((acc, tx) => {
    if (!acc[tx.unit]) acc[tx.unit] = { name: tx.unit, GİRİŞ: 0, ÇIKIŞ: 0 };
    acc[tx.unit][tx.type] += 1; // Count of transactions, not quantity
    return acc;
  }, {} as Record<string, any>);

  const barData = Object.values(txByUnit);

  const handlePrint = () => {
    let startDate = new Date();
    if (reportType === 'daily') startDate = subDays(new Date(), 1);
    else if (reportType === 'weekly') startDate = subWeeks(new Date(), 1);
    else if (reportType === 'monthly') startDate = subMonths(new Date(), 1);

    const filteredTxs = transactions.filter(tx => {
      const isAfterDate = isAfter(tx.date, startDate);
      const isCorrectUnit = reportUnit === 'Tümü' || tx.unit === reportUnit;
      return isAfterDate && isCorrectUnit;
    }).sort((a, b) => b.date - a.date);

    const personnelMap = personnel.reduce((acc, p) => {
      if (p.id) acc[p.id] = p.name;
      return acc;
    }, {} as Record<string, string>);

    const itemMap = items.reduce((acc, i) => {
      if (i.id) acc[i.id] = i;
      return acc;
    }, {} as Record<string, Item>);

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const dateStr = format(new Date(), 'dd.MM.yyyy');
    const reportTitle = `${reportType === 'daily' ? 'GÜNLÜK' : reportType === 'weekly' ? 'HAFTALIK' : 'AYLIK'} STOK İŞLEM RAPORU`;

    // Calculate Stock Summary
    const stockSummary = items.filter(item => reportUnit === 'Tümü' || item.unit === reportUnit).map(item => {
      const itemTxs = filteredTxs.filter(tx => tx.itemId === item.id);
      const totalIn = itemTxs.filter(tx => tx.type === 'GİRİŞ').reduce((sum, tx) => sum + tx.quantity, 0);
      const totalOut = itemTxs.filter(tx => tx.type === 'ÇIKIŞ').reduce((sum, tx) => sum + tx.quantity, 0);
      
      // Devreden (Previous Month) = Current Stock - Total In + Total Out
      // This assumes the report is run up to the current date.
      const previousStock = item.currentStock - totalIn + totalOut;
      
      return {
        name: item.name,
        unit: item.measurementUnit,
        previousStock,
        totalIn,
        totalOut,
        currentStock: item.currentStock
      };
    });

    const html = `
      <!DOCTYPE html>
      <html lang="tr">
      <head>
        <meta charset="UTF-8">
        <title>Stok Raporu</title>
        <style>
          body { font-family: 'Times New Roman', Times, serif; margin: 40px; color: #000; }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { font-size: 16px; margin: 5px 0; font-weight: bold; }
          .header h2 { font-size: 14px; margin: 5px 0; font-weight: normal; }
          .date-right { text-align: right; margin-bottom: 20px; font-size: 12px; }
          .title { text-align: center; font-weight: bold; text-decoration: underline; margin-bottom: 20px; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 12px; }
          th, td { border: 1px solid #000; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; font-weight: bold; }
          .footer { margin-top: 50px; display: flex; justify-content: space-between; }
          .signature { text-align: center; width: 200px; }
          .signature p { margin: 5px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>T.C.</h1>
          <h1>EDİRNE VALİLİĞİ</h1>
          <h2>Sosyal Yardımlaşma ve Dayanışma Vakfı Başkanlığı</h2>
        </div>
        
        <div class="date-right">
          Tarih: ${dateStr}
        </div>

        <div class="title">
          ${reportUnit !== 'Tümü' ? reportUnit.toUpperCase() + ' BİRİMİ ' : ''}${reportTitle}
        </div>

        <p style="font-size: 12px; text-indent: 30px; text-align: justify;">
          Vakfımız ${reportUnit !== 'Tümü' ? reportUnit + ' birimi' : 'tüm birimleri'} kapsamında ${format(startDate, 'dd.MM.yyyy')} - ${dateStr} tarihleri arasında gerçekleştirilen stok icmal (özet) durumu ve detaylı işlem dökümü aşağıda sunulmuştur. Kalan stoklar bir sonraki döneme devretmiştir.
        </p>

        <div style="font-weight: bold; margin-bottom: 10px; font-size: 13px;">1. STOK İCMAL (ÖZET) TABLOSU</div>
        <table>
          <thead>
            <tr>
              <th>Sıra</th>
              <th>Malzeme Adı</th>
              <th>Önceki Dönemden Devreden</th>
              <th>Dönem İçi Giren</th>
              <th>Dönem İçi Çıkan</th>
              <th>Sonraki Döneme Devreden (Kalan)</th>
            </tr>
          </thead>
          <tbody>
            ${stockSummary.length === 0 ? '<tr><td colspan="6" style="text-align:center;">Kayıtlı malzeme bulunmamaktadır.</td></tr>' : 
              stockSummary.map((item, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${item.name}</td>
                  <td>${item.previousStock} ${item.unit}</td>
                  <td>${item.totalIn} ${item.unit}</td>
                  <td>${item.totalOut} ${item.unit}</td>
                  <td><strong>${item.currentStock} ${item.unit}</strong></td>
                </tr>
              `).join('')
            }
          </tbody>
        </table>

        <div style="font-weight: bold; margin-bottom: 10px; font-size: 13px;">2. DETAYLI İŞLEM DÖKÜMÜ</div>
        <table>
          <thead>
            <tr>
              <th>Sıra</th>
              <th>Tarih</th>
              <th>Birim</th>
              <th>İşlem Türü</th>
              <th>Malzeme Adı</th>
              <th>Miktar</th>
              <th>Evrak No</th>
              <th>İşlemi Yapan Personel</th>
            </tr>
          </thead>
          <tbody>
            ${filteredTxs.length === 0 ? '<tr><td colspan="8" style="text-align:center;">Bu dönemde işlem bulunmamaktadır.</td></tr>' : 
              filteredTxs.map((tx, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${format(tx.date, 'dd.MM.yyyy')}</td>
                  <td>${tx.unit}</td>
                  <td>${tx.type}</td>
                  <td>${itemMap[tx.itemId]?.name || '-'}</td>
                  <td>${tx.quantity} ${itemMap[tx.itemId]?.measurementUnit || ''}</td>
                  <td>${tx.documentNo}</td>
                  <td>${personnelMap[tx.personnelId] || '-'}</td>
                </tr>
              `).join('')
            }
          </tbody>
        </table>

        <p style="font-size: 12px; text-indent: 30px;">
          Bilgilerinize arz ederim.
        </p>

        <div class="footer">
          <div class="signature">
            <p>Hazırlayan</p>
            <br/><br/>
            <p><strong>${currentPersonnel?.name || '................................'}</strong></p>
            <p>${currentPersonnel?.title || 'Vakıf Personeli'}</p>
          </div>
          <div class="signature">
            <p>Onaylayan</p>
            <br/><br/>
            <p>................................</p>
            <p>Vakıf Müdürü</p>
          </div>
        </div>
        <div style="margin-top: 40px; padding-top: 10px; border-top: 1px dashed #ccc; font-size: 10px; color: #666; text-align: right;">
          Raporu Hazırlayan: ${currentPersonnel ? `${currentPersonnel.name} (${currentPersonnel.title})` : 'Sistem'} | Yazdırılma: ${format(new Date(), 'dd.MM.yyyy HH:mm')}
        </div>
        <script>
          window.onload = function() { window.print(); window.close(); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleTenderPrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const tenderItems = items.filter(i => i.tenderName);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>İhale İstatistikleri Raporu</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
          .header { text-align: center; margin-bottom: 30px; position: relative; }
          .logo { position: absolute; left: 0; top: 0; width: 80px; height: 80px; border-radius: 50%; }
          .header h1 { margin: 0 0 5px 0; font-size: 18px; }
          .header h2 { margin: 0 0 5px 0; font-size: 16px; font-weight: normal; }
          .header h3 { margin: 10px 0 5px 0; font-size: 14px; text-decoration: underline; }
          .header p { margin: 0; font-size: 12px; color: #666; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 12px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .history-table { margin-top: 10px; width: 100%; border: 1px dashed #ccc; }
          .history-table th, .history-table td { border: none; border-bottom: 1px dashed #eee; padding: 4px; font-size: 11px; }
          .history-table th { background-color: #fafafa; }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="${APP_LOGO_URL}" class="logo" />
          <h1>T.C. EDİRNE VALİLİĞİ</h1>
          <h2>Sosyal Yardımlaşma ve Dayanışma Vakfı Başkanlığı</h2>
          <h3>İhale İstatistikleri ve Değişiklik Raporu</h3>
          <p>Tarih: ${format(new Date(), 'dd.MM.yyyy HH:mm')}</p>
        </div>

        <table>
          <thead>
            <tr>
              <th>Birim</th>
              <th>Malzeme</th>
              <th>İhale Adı</th>
              <th>Geçerlilik Tarihi</th>
              <th>Önceki İhaleden Devreden</th>
              <th>İhale Toplam Stoğu</th>
              <th>Mevcut Toplam Stok</th>
            </tr>
          </thead>
          <tbody>
            ${tenderItems.map(item => `
              <tr>
                <td>${item.unit}</td>
                <td>${item.name}</td>
                <td>${item.tenderName}</td>
                <td>${item.tenderEndDate ? format(item.tenderEndDate, 'dd.MM.yyyy') : '-'}</td>
                <td>${item.previousTenderStock || 0} ${item.measurementUnit}</td>
                <td>${item.tenderLimit} ${item.measurementUnit}</td>
                <td>${item.currentStock} ${item.measurementUnit}</td>
              </tr>
              ${item.tenderHistory && item.tenderHistory.length > 0 ? `
                <tr>
                  <td colspan="6" style="padding: 10px 20px; background-color: #fcfcfc;">
                    <strong>Değişiklik Geçmişi:</strong>
                    <table class="history-table">
                      <thead>
                        <tr>
                          <th>Tarih</th>
                          <th>Personel</th>
                          <th>Değişiklikler</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${item.tenderHistory.map(h => `
                          <tr>
                            <td>${format(h.date, 'dd.MM.yyyy HH:mm')}</td>
                            <td>${h.personnelName}</td>
                            <td>${h.changes}</td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                  </td>
                </tr>
              ` : ''}
            `).join('')}
            ${tenderItems.length === 0 ? '<tr><td colspan="6" style="text-align:center;">İhale kaydı bulunamadı.</td></tr>' : ''}
          </tbody>
        </table>
        <div style="margin-top: 40px; padding-top: 10px; border-top: 1px dashed #ccc; font-size: 10px; color: #666; text-align: right;">
          Raporu Hazırlayan: ${currentPersonnel ? `${currentPersonnel.name} (${currentPersonnel.title})` : 'Sistem'} | Yazdırılma: ${format(new Date(), 'dd.MM.yyyy HH:mm')}
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">İstatistikler ve Raporlar</h1>
      </div>

      {/* Rapor Oluşturma Kartı */}
      <div className="bg-white shadow sm:rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <FileText className="w-5 h-5 mr-2 text-gray-500" />
          Resmi Rapor Oluştur
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700">Rapor Periyodu</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border"
            >
              <option value="daily">Günlük Rapor</option>
              <option value="weekly">Haftalık Rapor</option>
              <option value="monthly">Aylık Rapor</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Birim</label>
            <select
              value={reportUnit}
              onChange={(e) => setReportUnit(e.target.value as any)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border"
            >
              <option value="Tümü">Tüm Birimler</option>
              <option value="Vefa Temizlik">Vefa Temizlik</option>
              <option value="Aşevi">Aşevi</option>
              <option value="Dergah">Dergah</option>
              <option value="Bağış">Bağış</option>
              <option value="Vakıf">Vakıf</option>
            </select>
          </div>
          <div>
            <button
              onClick={handlePrint}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 mb-2"
            >
              <Printer className="w-4 h-4 mr-2" />
              Raporu Yazdır / PDF Al
            </button>
            <button
              onClick={handleTenderPrint}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <FileText className="w-4 h-4 mr-2" />
              İhale Raporu Al
            </button>
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          * Raporlar resmi yazışma kurallarına uygun olarak hazırlanır ve yazdırılabilir formattadır. PDF olarak kaydetmek için yazdırma ekranında "PDF Olarak Kaydet" seçeneğini kullanabilirsiniz.
        </p>
      </div>

      {/* Grafikler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow sm:rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Birimlere Göre Malzeme Dağılımı</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white shadow sm:rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Birimlere Göre İşlem Sayıları (Giriş/Çıkış)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart
                data={barData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="GİRİŞ" fill="#10B981" name="Giriş İşlemleri" />
                <Bar dataKey="ÇIKIŞ" fill="#EF4444" name="Çıkış İşlemleri" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
