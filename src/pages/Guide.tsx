import React from 'react';
import { BookOpen, Users, Package, FileText, AlertCircle } from 'lucide-react';

export default function Guide() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex items-center space-x-3 border-b border-gray-200 pb-4">
        <BookOpen className="w-8 h-8 text-red-600" />
        <h1 className="text-2xl font-semibold text-gray-900">Sistem Kullanım Kılavuzu</h1>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6 space-y-8">
          
          {/* Section 1 */}
          <section>
            <h2 className="text-lg font-medium text-gray-900 flex items-center mb-3">
              <Users className="w-5 h-5 mr-2 text-red-500" />
              1. Personel Yönetimi
            </h2>
            <div className="text-gray-600 space-y-2 text-sm pl-7">
              <p>Sistemi kullanacak tüm personellerin öncelikle <strong>Personel Yönetimi</strong> sayfasından sisteme eklenmesi zorunludur.</p>
              <p>Personel kaydı olmadan hiçbir birimde stok giriş/çıkış işlemi veya ihale değişikliği yapılamaz.</p>
              <p>Personel eklerken Ad Soyad ve Ünvan bilgileri zorunludur.</p>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-lg font-medium text-gray-900 flex items-center mb-3">
              <Package className="w-5 h-5 mr-2 text-red-500" />
              2. Stok Birimleri ve İhale Süreçleri
            </h2>
            <div className="text-gray-600 space-y-2 text-sm pl-7">
              <p>Sistemde 5 farklı birim bulunmaktadır: Vefa Temizlik, Aşevi, Dergah, Bağış ve Vakıf.</p>
              <p><strong>İhale Zorunluluğu:</strong> Vefa Temizlik, Aşevi ve Dergah birimlerinde işlem yapabilmek için malzemelerin ihale bilgilerinin (İhale Adı, Geçerlilik Tarihi, Stok Limiti) girilmesi zorunludur. Bağış ve Vakıf birimlerinde ihale şartı aranmaz.</p>
              <p><strong>İhale Değişikliği:</strong> İhale bilgileri sonradan düzenlenebilir. Ancak ihalede belirtilen stok limiti <u>kesinlikle arttırılamaz</u>. Limit dolduğunda yeni bir ihale (yeni bir malzeme kaydı) oluşturulmalıdır.</p>
              <p>İhale bilgilerinde yapılan tüm değişiklikler kayıt altına alınır. İlgili malzemenin altındaki ihale ismine tıklayarak değişiklik geçmişini (hangi personel, ne zaman değiştirdi) görebilirsiniz.</p>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-lg font-medium text-gray-900 flex items-center mb-3">
              <AlertCircle className="w-5 h-5 mr-2 text-red-500" />
              3. Stok Giriş ve Çıkış İşlemleri
            </h2>
            <div className="text-gray-600 space-y-2 text-sm pl-7">
              <p><strong>Giriş İşlemi:</strong> Malzeme stoğa eklenirken ihale limiti kontrol edilir. Limit aşılıyorsa sistem işleme izin vermez. İşlem başarıyla tamamlandığında otomatik olarak <strong>Muayene ve Kabul Tutanağı</strong> oluşturulur ve yazdırılabilir.</p>
              <p><strong>Çıkış İşlemi:</strong> Stokta yeterli malzeme yoksa veya stok 0 (sıfır) ise çıkış işlemi yapılamaz. Sistem "Stok Bitti" uyarısı verir.</p>
              <p>Tüm işlemlerde işlemi gerçekleştiren personelin seçilmesi ve resmi evrak numarasının girilmesi zorunludur.</p>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-lg font-medium text-gray-900 flex items-center mb-3">
              <FileText className="w-5 h-5 mr-2 text-red-500" />
              4. İstatistikler ve Raporlama
            </h2>
            <div className="text-gray-600 space-y-2 text-sm pl-7">
              <p><strong>Resmi Stok Raporu:</strong> Günlük, haftalık veya aylık periyotlarda, seçilen birime göre resmi yazışma kurallarına uygun stok raporu alınabilir. Bu raporda önceki aydan devreden stoklar, dönem içi giren/çıkan ve sonraki aya devreden stoklar detaylıca gösterilir.</p>
              <p><strong>İhale Raporu:</strong> İhale kapsamında alınan malzemelerin limitleri, mevcut stokları ve ihale değişiklik geçmişlerini içeren özel bir ihale raporu PDF olarak alınabilir.</p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
