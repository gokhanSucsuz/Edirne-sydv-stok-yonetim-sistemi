'use client';

import React, { useState, useEffect } from 'react';
import { Database, Download, Cloud, AlertTriangle, CheckCircle, Clock, Shield } from 'lucide-react';
import { getBackups, addBackupRecord, getAllDataForBackup } from '@/lib/db';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function Backup() {
  const [backups, setBackups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);

  useEffect(() => {
    fetchBackups();
  }, []);

  const fetchBackups = async () => {
    const data = await getBackups();
    setBackups(data);
  };

  const handleManualBackup = async () => {
    setLoading(true);
    setStatus({ type: 'info', message: 'Veriler hazırlanıyor...' });
    try {
      const allData = await getAllDataForBackup();
      const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `edirne-sydv-yedek-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      await addBackupRecord({
        type: 'Manuel',
        status: 'Başarılı',
        fileName: a.download,
        size: (blob.size / 1024).toFixed(2) + ' KB'
      });

      setStatus({ type: 'success', message: 'Yedekleme başarıyla tamamlandı ve indirildi.' });
      fetchBackups();
    } catch (error) {
      console.error('Backup error:', error);
      setStatus({ type: 'error', message: 'Yedekleme sırasında bir hata oluştu.' });
    } finally {
      setLoading(false);
    }
  };

  const lastBackup = backups[0];
  const daysSinceLastBackup = lastBackup 
    ? Math.floor((new Date().getTime() - lastBackup.createdAt.toDate().getTime()) / (1000 * 60 * 60 * 24))
    : 999;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate flex items-center">
            <Database className="w-8 h-8 mr-3 text-red-600" />
            Veri Yedekleme ve Güvenlik Merkezi
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Sistem verilerinin güvenliği ve sürekliliği için düzenli yedekleme yapılması zorunludur.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Durum Kartı */}
        <div className="bg-white overflow-hidden shadow rounded-lg border-t-4 border-red-600">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {daysSinceLastBackup > 10 ? (
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                ) : (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                )}
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Sistem Durumu</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">
                      {daysSinceLastBackup > 10 ? 'Yedekleme Gecikti' : 'Sistem Güncel'}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <span className="font-medium text-gray-700">Son Yedekleme:</span>{' '}
              <span className="text-gray-600">
                {lastBackup ? format(lastBackup.createdAt.toDate(), 'd MMMM yyyy HH:mm', { locale: tr }) : 'Hiç yedek alınmadı'}
              </span>
            </div>
          </div>
        </div>

        {/* Bilgi Kartı */}
        <div className="bg-white overflow-hidden shadow rounded-lg border-t-4 border-blue-600">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Otomatik Yedekleme Periyodu</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">10 Gün</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3 text-xs text-gray-500">
            10 gün içinde manuel yedek alınmazsa, sistem otomatik olarak edirnesydv@gmail.com Drive hesabına yedekleme yapar.
          </div>
        </div>

        {/* İşlem Kartı */}
        <div className="bg-white overflow-hidden shadow rounded-lg border-t-4 border-green-600">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Cloud className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <button
                  onClick={handleManualBackup}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Şimdi Yedek Al (JSON)
                </button>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3 text-xs text-gray-500">
            Manuel yedekleme verileri bilgisayarınıza indirir ve sistem günlüğüne kaydeder.
          </div>
        </div>
      </div>

      {status && (
        <div className={`mt-6 p-4 rounded-md ${
          status.type === 'success' ? 'bg-green-50 text-green-800' : 
          status.type === 'error' ? 'bg-red-50 text-red-800' : 'bg-blue-50 text-blue-800'
        }`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {status.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{status.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Yedekleme Geçmişi */}
      <div className="mt-10">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Shield className="w-5 h-5 mr-2 text-gray-400" />
          Yedekleme Geçmişi ve Güvenlik Logları
        </h3>
        <div className="flex flex-col">
          <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
              <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tür</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dosya Adı</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Boyut</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {backups.map((backup) => (
                      <tr key={backup.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {format(backup.createdAt.toDate(), 'd MMMM yyyy HH:mm', { locale: tr })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{backup.type}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{backup.fileName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{backup.size}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            {backup.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {backups.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500 italic">
                          Henüz bir yedekleme kaydı bulunmuyor.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KVKK ve Güvenlik Notu */}
      <div className="mt-12 bg-gray-50 rounded-xl p-8 border border-gray-200">
        <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <Shield className="w-6 h-6 mr-2 text-red-600" />
          KVKK ve Veri Güvenliği Taahhütnamesi
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-gray-600">
          <div>
            <p className="font-bold mb-2">Veri Şifreleme:</p>
            <p>Sistemdeki tüm hassas veriler (TC No, Şifreler) AES-256 standardında şifrelenerek saklanmaktadır. Veritabanına doğrudan erişim olsa dahi bu veriler okunamaz durumdadır.</p>
          </div>
          <div>
            <p className="font-bold mb-2">Erişim Kontrolü:</p>
            <p>Sisteme sadece edirnesydv@gmail.com Google hesabı ile doğrulanmış yetkili personeller erişebilir. Her işlem loglanmakta ve takip edilmektedir.</p>
          </div>
          <div>
            <p className="font-bold mb-2">Yedekleme Güvenliği:</p>
            <p>Yedekleme dosyaları kurum içi kullanım için tasarlanmıştır. Yedeklerin güvenli ortamlarda (harici disk veya kurumsal Drive) saklanması kullanıcının sorumluluğundadır.</p>
          </div>
          <div>
            <p className="font-bold mb-2">KVKK Uyumu:</p>
            <p>Bu uygulama 6698 sayılı Kişisel Verilerin Korunması Kanunu'na tam uyumlu olacak şekilde tasarlanmıştır. Veri minimizasyonu ve gizlilik ön plandadır.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
