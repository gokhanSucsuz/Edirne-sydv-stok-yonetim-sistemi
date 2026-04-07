import React from 'react';
import { BookOpen, Users, Package, FileText, AlertCircle } from 'lucide-react';

export default function Guide() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex items-center space-x-3 border-b border-gray-200 pb-4">
        <div className="p-2 bg-red-600 rounded-lg shadow-lg">
          <BookOpen className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sistem Kullanım Kılavuzu</h1>
          <p className="text-sm text-gray-500">Stok Yönetim Sistemi Detaylı Kullanım Rehberi</p>
        </div>
      </div>

      <div className="bg-white shadow-xl overflow-hidden sm:rounded-2xl border border-gray-100">
        <div className="px-6 py-8 space-y-12">
          
          {/* Section 1 */}
          <section className="relative pl-8 border-l-2 border-red-100">
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-red-600 border-4 border-white shadow-sm"></div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center mb-4">
              <Users className="w-6 h-6 mr-3 text-red-600" />
              1. Personel ve Yetkilendirme
            </h2>
            <div className="text-gray-600 space-y-4 text-sm">
              <p className="leading-relaxed">Sistemin temel taşı personel kaydıdır. <strong>Personel Yönetimi</strong> sayfası üzerinden tüm çalışanların sisteme tanımlanması gerekir.</p>
              <ul className="list-disc pl-5 space-y-2 text-gray-700">
                <li><strong>Zorunlu Alanlar:</strong> Ad Soyad ve Ünvan bilgileri her personel için girilmelidir.</li>
                <li><strong>İşlem Onayı:</strong> Yapılan her stok girişi, çıkışı veya ihale düzenlemesi mutlaka bir personel ile ilişkilendirilmelidir.</li>
                <li><strong>Güvenlik:</strong> Personel seçimi yapılmadan sistem hiçbir veri kaydına izin vermez.</li>
              </ul>
            </div>
          </section>

          {/* Section 2 */}
          <section className="relative pl-8 border-l-2 border-red-100">
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-red-600 border-4 border-white shadow-sm"></div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center mb-4">
              <Package className="w-6 h-6 mr-3 text-red-600" />
              2. Birimler ve İhale/Bağış Yönetimi
            </h2>
            <div className="text-gray-600 space-y-4 text-sm">
              <p className="leading-relaxed">Sistemde 5 ana birim bulunmaktadır. Her birimin işleyiş kuralları farklıdır:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <h4 className="font-bold text-gray-900 mb-2">İhale Bazlı Birimler</h4>
                  <p className="text-xs text-gray-600">Vefa Temizlik, Aşevi, Dergah</p>
                  <p className="mt-2 text-xs italic text-red-600">Bu birimlerde ihale adı, geçerlilik tarihi ve stok limiti girilmesi zorunludur.</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <h4 className="font-bold text-gray-900 mb-2">Serbest Birimler</h4>
                  <p className="text-xs text-gray-600">Bağış ve Vakıf</p>
                  <p className="mt-2 text-xs italic text-green-600">İhale şartı aranmaz, doğrudan stok girişi yapılabilir.</p>
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mt-4">
                <h4 className="font-bold text-blue-900 mb-2">Dergah Birimi Özel Durumu</h4>
                <p className="text-xs text-blue-800">Dergah biriminde kayıt yaparken <strong>"İhale"</strong> veya <strong>"Bağış"</strong> seçeneklerinden biri seçilmelidir. Bu seçim raporlarda ve stok takibinde ayrı ayrı gösterilir.</p>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="relative pl-8 border-l-2 border-red-100">
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-red-600 border-4 border-white shadow-sm"></div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center mb-4">
              <AlertCircle className="w-6 h-6 mr-3 text-red-600" />
              3. Stok Hareketleri ve FIFO Mantığı
            </h2>
            <div className="text-gray-600 space-y-4 text-sm">
              <p className="leading-relaxed">Stok yönetimi en üst düzey doğruluk için <strong>FIFO (İlk Giren İlk Çıkar)</strong> prensibiyle çalışır:</p>
              <ul className="list-disc pl-5 space-y-2 text-gray-700">
                <li><strong>FIFO Sistemi:</strong> Aynı isimde farklı ihalelere ait ürünler varsa, stok çıkışı yapıldığında sistem otomatik olarak en eski tarihli ihaledeki üründen düşüm yapar.</li>
                <li><strong>Otomatik Evrak No:</strong> Her işlem için sistem benzersiz bir evrak numarası üretir. Kullanıcı manuel giriş yapabilir ancak sistem mükerrer (aynı) numaraya izin vermez.</li>
                <li><strong>Görsel Uyarılar:</strong> Stok bittiğinde ürünler "Biten Stoklar" bölümüne taşınır. Kritik seviyeye düşen ürünler sarı renkli "Kritik Seviye" uyarısıyla gösterilir.</li>
              </ul>
            </div>
          </section>

          {/* Section 4 */}
          <section className="relative pl-8 border-l-2 border-red-100">
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-red-600 border-4 border-white shadow-sm"></div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center mb-4">
              <FileText className="w-6 h-6 mr-3 text-red-600" />
              4. Raporlama ve Çıktılar
            </h2>
            <div className="text-gray-600 space-y-4 text-sm">
              <p className="leading-relaxed">Sistem profesyonel PDF raporları üretme yeteneğine sahiptir:</p>
              <ul className="list-disc pl-5 space-y-2 text-gray-700">
                <li><strong>Ürün Bazlı Rapor:</strong> Her ürünün yanındaki "Rapor" butonu ile o ürünün tüm ihalelerdeki hareket geçmişi, personeli ve evrak numaralarıyla birlikte PDF olarak alınabilir.</li>
                <li><strong>Resmi Stok Raporu:</strong> İstatistikler sayfasından birim bazlı, devreden stokları da içeren resmi formatta raporlar oluşturulabilir.</li>
                <li><strong>Muayene ve Kabul Tutanağı:</strong> Her stok girişinde sistem otomatik olarak bu tutanağı hazırlar ve yazdırma seçeneği sunar.</li>
              </ul>
            </div>
          </section>

          <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
            <h3 className="text-red-900 font-bold mb-2 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              Önemli Hatırlatma
            </h3>
            <p className="text-red-800 text-sm">
              Süresi dolmuş ihaleler üzerinde kesinlikle değişiklik yapılamaz ve bu ihaleler silinemez. İhale limitleri dolduğunda sistem otomatik olarak çıkış işlemini durdurur. Bu durumda yeni bir ihale tanımlanması gerekmektedir.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
