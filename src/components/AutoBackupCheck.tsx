'use client';

import React, { useState, useEffect } from 'react';
import { getBackups, addBackupRecord, getAllDataForBackup } from '@/lib/db';
import { format } from 'date-fns';
import { Database, AlertTriangle, Download, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function AutoBackupCheck() {
  const { personnel, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<'checking' | 'warning' | 'downloading' | 'success' | 'error'>('checking');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Sadece giriş yapmış kullanıcılar için kontrol et
    if (!personnel && !user) return;
    
    // Oturumda sadece 1 kez kontrol etmesi için sessionStorage kullanılabilir
    if (sessionStorage.getItem('backupChecked')) {
      return;
    }

    const checkBackupStatus = async () => {
      try {
        const backups = await getBackups();
        const lastBackup = backups[0];
        
        let shouldBackup = false;

        if (!lastBackup) {
          shouldBackup = true; // Hiç yedek yoksa
        } else {
          // Firebase Timestamp'ini Date nesnesine çeviriyoruz
          const lastBackupDate = lastBackup.createdAt?.toDate ? lastBackup.createdAt.toDate() : new Date(lastBackup.createdAt);
          const daysSinceLastBackup = Math.floor((new Date().getTime() - lastBackupDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysSinceLastBackup >= 10) {
            shouldBackup = true;
          }
        }

        if (shouldBackup) {
          setIsOpen(true);
          setStatus('warning');
        } else {
          sessionStorage.setItem('backupChecked', 'true');
        }
      } catch (error) {
        console.error('Yedekleme kontrolü sırasında hata:', error);
      }
    };

    checkBackupStatus();
  }, [personnel, user]);

  const startAutoBackup = async () => {
    setStatus('downloading');
    
    try {
      // 1. Verileri al
      const allData = await getAllDataForBackup();
      
      // 2. Blob oluştur ve indir
      const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `edirne-sydv-otomatik-yedek-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // 3. Veritabanına kaydet
      await addBackupRecord({
        type: 'Otomatik (Giriş)',
        status: 'Başarılı',
        fileName: a.download,
        size: (blob.size / 1024).toFixed(2) + ' KB'
      });

      // 4. Başarı durumu
      setStatus('success');
      sessionStorage.setItem('backupChecked', 'true');
      
      // 5. 3 saniye sonra modalı kapat
      setTimeout(() => {
        setIsOpen(false);
      }, 3000);
      
    } catch (error) {
      console.error('Otomatik yedekleme hatası:', error);
      setStatus('error');
      setErrorMessage('Yedekleme alınırken bir hata oluştu. Lütfen sistem yöneticinize başvurun.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-[100] px-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-200 transform transition-all">
        
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center ${
          status === 'success' ? 'bg-green-50 border-green-100' :
          status === 'error' ? 'bg-red-50 border-red-100' :
          'bg-orange-50 border-orange-100'
        }`}>
          {status === 'success' ? (
            <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
          ) : status === 'error' ? (
            <AlertTriangle className="w-8 h-8 text-red-600 mr-3" />
          ) : status === 'downloading' ? (
            <Loader2 className="w-8 h-8 text-blue-600 mr-3 animate-spin" />
          ) : (
            <Database className="w-8 h-8 text-orange-600 mr-3 animate-pulse" />
          )}
          <h3 className="text-lg font-bold text-gray-900">
            {status === 'success' ? 'Yedekleme Tamamlandı' : 
             status === 'error' ? 'Yedekleme Hatası' : 
             status === 'downloading' ? 'Yedekleme Yapılıyor...' : 
             'Sistem Yedekleme Uyarısı'}
          </h3>
        </div>

        {/* Content */}
        <div className="p-6">
          {status === 'warning' && (
            <div className="space-y-4">
              <p className="text-gray-600 text-sm leading-relaxed">
                Sistem verilerinin yedeği <span className="font-bold text-red-600">en son 10 günden daha uzun bir süre önce</span> alınmış veya hiç alınmamış.
              </p>
              <p className="text-gray-600 text-sm leading-relaxed">
                Veri kaybını önlemek ve sistem güvenliğini sağlamak için kullanıma devam etmeden önce otomatik yedekleme yapılması <strong>zorunludur</strong>.
              </p>
              
              <button
                onClick={startAutoBackup}
                className="w-full mt-4 flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 shadow-sm transition-colors"
              >
                <Download className="w-5 h-5 mr-2" />
                Otomatik Yedeklemeyi Başlat
              </button>
            </div>
          )}

          {status === 'downloading' && (
            <div className="text-center py-4 space-y-4">
              <p className="text-gray-600 text-sm">
                Sistem verileri hazırlanıyor ve bilgisayarınıza indiriliyor... Lütfen bekleyiniz. Tarayıcınızı kapatmayınız.
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center py-4 space-y-4">
              <p className="text-green-700 text-sm font-medium">
                Yedek dosyası bilgisayarınıza başarıyla indirildi ve sistem kaydı oluşturuldu.
              </p>
              <p className="text-gray-500 text-xs">
                Sisteme yönlendiriliyorsunuz...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <p className="text-red-600 text-sm font-medium">{errorMessage}</p>
              <button
                onClick={startAutoBackup}
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gray-600 hover:bg-gray-700 transition-colors"
              >
                Tekrar Dene
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
