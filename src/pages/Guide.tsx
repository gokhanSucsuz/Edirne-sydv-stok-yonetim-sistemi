import React from 'react';
import { BookOpen, Users, Package, FileText, AlertCircle, LayoutDashboard, ClipboardCheck, History, Printer } from 'lucide-react';

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
          
          {/* Section 1: Dashboard */}
          <section className="relative pl-8 border-l-2 border-red-100">
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-red-600 border-4 border-white shadow-sm"></div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center mb-4">
              <LayoutDashboard className="w-6 h-6 mr-3 text-red-600" />
              1. Gösterge Paneli ve Genel Bakış
            </h2>
            <div className="text-gray-600 space-y-4 text-sm">
              <p className="leading-relaxed">Sisteme giriş yapıldığında karşılaşılan ana ekrandır. Burada vakfın genel stok durumu özetlenir.</p>
              <ul className="list-disc pl-5 space-y-2 text-gray-700">
                <li><strong>İstatistikler:</strong> Toplam ürün sayısı, kritik stoktaki ürünler ve aktif ihale sayıları anlık olarak izlenebilir.</li>
                <li><strong>Aylık Envanter Raporu:</strong> Panelin sağ üst köşesinde bulunan buton ile seçilen ay ve yıl için tüm birimlerdeki stok hareketlerini (giriş/çıkış) içeren detaylı bir rapor alınabilir.</li>
                <li><strong>Kritik Stok Uyarıları:</strong> Belirlenen limitlerin altına düşen ürünler burada listelenerek hızlı aksiyon alınması sağlanır.</li>
              </ul>
            </div>
          </section>

          {/* Section 2: Personnel */}
          <section className="relative pl-8 border-l-2 border-red-100">
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-red-600 border-4 border-white shadow-sm"></div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center mb-4">
              <Users className="w-6 h-6 mr-3 text-red-600" />
              2. Personel Yönetimi
            </h2>
            <div className="text-gray-600 space-y-4 text-sm">
              <p className="leading-relaxed">Sistemdeki tüm işlemlerin izlenebilirliği için personel kaydı zorunludur.</p>
              <ul className="list-disc pl-5 space-y-2 text-gray-700">
                <li><strong>Kayıt:</strong> "Personel Yönetimi" sayfasından personel adı, soyadı ve ünvanı ile kayıt yapılır.</li>
                <li><strong>İşlem İlişkilendirme:</strong> Stok girişi, çıkışı veya ihale tanımlama sırasında mutlaka bir personel seçilmelidir. Bu sayede "Hazırlayan" ve "Onaylayan" kısımları raporlarda otomatik dolar.</li>
              </ul>
            </div>
          </section>

          {/* Section 3: Tender Management */}
          <section className="relative pl-8 border-l-2 border-red-100">
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-red-600 border-4 border-white shadow-sm"></div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center mb-4">
              <ClipboardCheck className="w-6 h-6 mr-3 text-red-600" />
              3. İhale ve Bağış Yönetimi
            </h2>
            <div className="text-gray-600 space-y-4 text-sm">
              <p className="leading-relaxed">İhale bazlı çalışan birimlerde (Vefa Temizlik, Aşevi, Dergah) stok hareketleri ihaleler üzerinden yürür.</p>
              <ul className="list-disc pl-5 space-y-2 text-gray-700">
                <li><strong>İhale Tanımlama:</strong> İhale adı, bitiş tarihi ve ihaleye dahil ürünlerin limitleri belirlenir.</li>
                <li><strong>İhale Raporu:</strong> "İhale Yönetimi" sayfasındaki her ihale için "Rapor Al" butonu bulunur. Bu rapor; ihalenin genel durumunu, ürün bazlı harcanan/kalan stokları ve o ihaleyle ilgili yapılan tüm geçmiş işlemleri gösterir.</li>
                <li><strong>Limit Kontrolü:</strong> Sistem, ihalede belirlenen limitin üzerinde stok girişi yapılmasına izin vermez.</li>
              </ul>
            </div>
          </section>

          {/* Section 4: Stock Operations */}
          <section className="relative pl-8 border-l-2 border-red-100">
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-red-600 border-4 border-white shadow-sm"></div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center mb-4">
              <Package className="w-6 h-6 mr-3 text-red-600" />
              4. Stok İşlemleri (Toplu Giriş/Çıkış)
            </h2>
            <div className="text-gray-600 space-y-4 text-sm">
              <p className="leading-relaxed">Hata payını azaltmak ve hızı artırmak için sistemde sadece toplu işlemler desteklenmektedir.</p>
              <ul className="list-disc pl-5 space-y-2 text-gray-700">
                <li><strong>Toplu Stok Girişi:</strong> Vakfa teslim edilen malzemeler için kullanılır. Giriş onaylandığında sistem otomatik olarak <strong>"Muayene ve Kabul Tutanağı"</strong> oluşturur.</li>
                <li><strong>Toplu Stok Çıkışı:</strong> Malzemelerin harcanması durumunda kullanılır. Sistem <strong>FIFO (İlk Giren İlk Çıkar)</strong> mantığıyla en eski ihaleye ait stoktan düşüm yapar.</li>
                <li><strong>Mevcut Stok Durumu:</strong> Birim panellerinde ürünler "Kullanılan / Mevcut" formatında gösterilir. "Kullanılan" miktar, ihale kapsamında şimdiye kadar teslim alınan toplam miktardan mevcut stokun çıkarılmasıyla hesaplanır.</li>
              </ul>
            </div>
          </section>

          {/* Section 5: Reporting */}
          <section className="relative pl-8 border-l-2 border-red-100">
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-red-600 border-4 border-white shadow-sm"></div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center mb-4">
              <Printer className="w-6 h-6 mr-3 text-red-600" />
              5. Raporlama Sistemi
            </h2>
            <div className="text-gray-600 space-y-4 text-sm">
              <p className="leading-relaxed">Tüm raporlar resmi formatta ve Türkçe karakter sorunu yaşanmayacak şekilde tasarlanmıştır.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 p-3 rounded-lg bg-gray-50">
                  <h4 className="font-bold text-gray-900 text-xs mb-1">Muayene ve Kabul Tutanağı</h4>
                  <p className="text-[10px] text-gray-600 text-justify">Toplu stok girişi sonrası otomatik üretilir. Malzemelerin şartnameye uygun teslim alındığını belgeler.</p>
                </div>
                <div className="border border-gray-200 p-3 rounded-lg bg-gray-50">
                  <h4 className="font-bold text-gray-900 text-xs mb-1">İhale Detay ve Stok Raporu</h4>
                  <p className="text-[10px] text-gray-600 text-justify">İhale bazlı tüm hareketleri, diğer ihalelerle karşılaştırmalı stok durumunu ve işlem geçmişini sunar.</p>
                </div>
                <div className="border border-gray-200 p-3 rounded-lg bg-gray-50">
                  <h4 className="font-bold text-gray-900 text-xs mb-1">Aylık Envanter Raporu</h4>
                  <p className="text-[10px] text-gray-600 text-justify">Belirli bir ay içindeki tüm birimlerin giriş-çıkış hareketlerini kronolojik olarak listeler.</p>
                </div>
                <div className="border border-gray-200 p-3 rounded-lg bg-gray-50">
                  <h4 className="font-bold text-gray-900 text-xs mb-1">Ürün Hareket Raporu</h4>
                  <p className="text-[10px] text-gray-600 text-justify">Tek bir ürünün tüm ihalelerdeki toplam serüvenini ve mevcut konumunu raporlar.</p>
                </div>
              </div>
            </div>
          </section>

          <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
            <h3 className="text-red-900 font-bold mb-2 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              Kritik Uyarılar
            </h3>
            <ul className="text-red-800 text-xs space-y-2 list-disc pl-5">
              <li>Stok girişi yapıldığında mutlaka fatura kesilmesi gerektiğini unutmayınız.</li>
              <li>Süresi dolmuş ihalelerden stok çıkışı yapılabilir ancak yeni stok girişi yapılamaz.</li>
              <li>Sistemde evrak numaraları benzersiz olmalıdır; aynı numara ile ikinci bir işlem kaydedilemez.</li>
              <li>Birimler arası malzeme transferi için önce bir birimden çıkış, sonra diğer birime giriş yapılmalıdır.</li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
}
