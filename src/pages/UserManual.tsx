import React from 'react';
import { BookOpen, Shield, CheckCircle, HelpCircle, FileText, Settings, Database, Users, Package, ArrowRight } from 'lucide-react';
import { APP_LOGO_URL } from '../constants';

export default function UserManual() {
  return (
    <div className="min-h-screen bg-[#f5f2ed] text-[#1a1a1a] font-serif">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 py-12 px-4 sm:px-6 lg:px-8 shadow-sm">
        <div className="max-w-5xl mx-auto flex flex-col items-center text-center">
          <img src={APP_LOGO_URL} alt="Logo" className="h-24 w-24 rounded-full shadow-xl mb-6 border-4 border-red-600" />
          <h1 className="text-4xl md:text-5xl font-light tracking-tight text-gray-900 mb-4">
            EDİRNE SYDV <span className="font-bold text-red-700">STOK TAKİP SİSTEMİ</span>
          </h1>
          <div className="h-1 w-24 bg-red-600 mb-6"></div>
          <p className="text-xl text-gray-600 max-w-2xl italic">
            Kullanıcı Kılavuzu ve Operasyonel Standartlar Rehberi
          </p>
          <div className="mt-8 flex gap-4 text-xs uppercase tracking-[0.2em] font-sans font-bold text-gray-500">
            <span>Sürüm 2.0</span>
            <span>•</span>
            <span>Nisan 2026</span>
            <span>•</span>
            <span>Gizli</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Giriş */}
        <section className="mb-20">
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 bg-red-700 text-white flex items-center justify-center rounded-full mr-4 shadow-lg">
              <Shield className="w-6 h-6" />
            </div>
            <h2 className="text-3xl font-light">Sistem <span className="font-bold">Güvenliği ve KVKK</span></h2>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-xl border-l-8 border-red-700 font-sans leading-relaxed text-gray-700">
            <p className="mb-4">
              Bu sistem, Edirne Sosyal Yardımlaşma ve Dayanışma Vakfı envanterinin dijital ortamda güvenli bir şekilde takip edilmesi amacıyla geliştirilmiştir. 
              Sistemdeki tüm veriler <strong>6698 sayılı KVKK</strong> kapsamında korunmaktadır.
            </p>
            <ul className="space-y-3">
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-1 flex-shrink-0" />
                <span><strong>Erişim Kısıtlaması:</strong> Sadece <code>edirnesydv@gmail.com</code> Google hesabı ile doğrulanan personel sisteme erişebilir.</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-1 flex-shrink-0" />
                <span><strong>Veri Şifreleme:</strong> TC Kimlik Numaraları ve şifreler veritabanında AES-256 standardında şifrelenmiş olarak saklanır.</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-1 flex-shrink-0" />
                <span><strong>İşlem Logları:</strong> Yapılan her stok hareketi, işlemi yapan personelin bilgisiyle birlikte kalıcı olarak kaydedilir.</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Temel Modüller */}
        <section className="mb-20">
          <div className="flex items-center mb-12">
            <div className="w-12 h-12 bg-gray-900 text-white flex items-center justify-center rounded-full mr-4 shadow-lg">
              <Settings className="w-6 h-6" />
            </div>
            <h2 className="text-3xl font-light">Operasyonel <span className="font-bold">Modüller</span></h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-sans">
            {/* Stok Yönetimi */}
            <div className="bg-white p-8 rounded-2xl shadow-md hover:shadow-2xl transition-shadow border border-gray-100">
              <Package className="w-10 h-10 text-red-600 mb-4" />
              <h3 className="text-xl font-bold mb-3">Stok ve Envanter</h3>
              <p className="text-gray-600 text-sm mb-4">Ürünlerin sisteme tanımlanması, kritik stok seviyelerinin belirlenmesi ve güncel miktarların takibi bu modül üzerinden yapılır.</p>
              <div className="text-xs text-gray-400 uppercase tracking-wider font-bold">Özellikler: Barkod Takibi, Kritik Stok Uyarısı</div>
            </div>

            {/* Personel Yönetimi */}
            <div className="bg-white p-8 rounded-2xl shadow-md hover:shadow-2xl transition-shadow border border-gray-100">
              <Users className="w-10 h-10 text-blue-600 mb-4" />
              <h3 className="text-xl font-bold mb-3">Personel Yetkilendirme</h3>
              <p className="text-gray-600 text-sm mb-4">Sistemi kullanacak personellerin tanımlanması ve şifre işlemlerinin yönetildiği bölümdür.</p>
              <div className="text-xs text-gray-400 uppercase tracking-wider font-bold">Özellikler: Şifreli Kayıt, Unvan Bazlı Takip</div>
            </div>

            {/* Yedekleme */}
            <div className="bg-white p-8 rounded-2xl shadow-md hover:shadow-2xl transition-shadow border border-gray-100">
              <Database className="w-10 h-10 text-green-600 mb-4" />
              <h3 className="text-xl font-bold mb-3">Veri Yedekleme</h3>
              <p className="text-gray-600 text-sm mb-4">Verilerin 10 günde bir yedeklenmesi zorunludur. Manuel yedekleme ile veriler JSON formatında indirilebilir.</p>
              <div className="text-xs text-gray-400 uppercase tracking-wider font-bold">Özellikler: Otomatik Drive Yedekleme, Manuel Export</div>
            </div>

            {/* Raporlama */}
            <div className="bg-white p-8 rounded-2xl shadow-md hover:shadow-2xl transition-shadow border border-gray-100">
              <FileText className="w-10 h-10 text-purple-600 mb-4" />
              <h3 className="text-xl font-bold mb-3">Raporlama ve Analiz</h3>
              <p className="text-gray-600 text-sm mb-4">Geçmişe dönük tüm stok hareketlerinin, giriş-çıkış fişlerinin ve personel işlemlerinin raporlandığı bölümdür.</p>
              <div className="text-xs text-gray-400 uppercase tracking-wider font-bold">Özellikler: PDF Çıktısı, Filtreleme</div>
            </div>
          </div>
        </section>

        {/* Adım Adım Kullanım */}
        <section className="mb-20">
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 bg-blue-700 text-white flex items-center justify-center rounded-full mr-4 shadow-lg">
              <ArrowRight className="w-6 h-6" />
            </div>
            <h2 className="text-3xl font-light">Adım Adım <span className="font-bold">Kullanım Rehberi</span></h2>
          </div>
          
          <div className="space-y-12 font-sans">
            <div className="relative pl-12 border-l-2 border-gray-200">
              <div className="absolute -left-4 top-0 w-8 h-8 bg-white border-2 border-blue-700 rounded-full flex items-center justify-center font-bold text-blue-700">1</div>
              <h4 className="text-lg font-bold mb-2">Sisteme Giriş</h4>
              <p className="text-gray-600">Google hesabınızla (edirnesydv@gmail.com) giriş yapın. Ardından personel listenizden kendinizi seçip şifrenizi girerek ana panele erişin.</p>
            </div>

            <div className="relative pl-12 border-l-2 border-gray-200">
              <div className="absolute -left-4 top-0 w-8 h-8 bg-white border-2 border-blue-700 rounded-full flex items-center justify-center font-bold text-blue-700">2</div>
              <h4 className="text-lg font-bold mb-2">Ürün Tanımlama</h4>
              <p className="text-gray-600">"Stok Yönetimi" sayfasından yeni ürünler ekleyin. Her ürün için bir birim (Adet, KG, Paket vb.) ve kritik stok seviyesi belirleyin.</p>
            </div>

            <div className="relative pl-12 border-l-2 border-gray-200">
              <div className="absolute -left-4 top-0 w-8 h-8 bg-white border-2 border-blue-700 rounded-full flex items-center justify-center font-bold text-blue-700">3</div>
              <h4 className="text-lg font-bold mb-2">Stok Hareketleri</h4>
              <p className="text-gray-600">Ürün giriş veya çıkışı yaparken mutlaka "Belge No" ve "Açıklama" girin. Bu bilgiler denetimlerde esas alınacaktır.</p>
            </div>

            <div className="relative pl-12 border-l-2 border-gray-200">
              <div className="absolute -left-4 top-0 w-8 h-8 bg-white border-2 border-blue-700 rounded-full flex items-center justify-center font-bold text-blue-700">4</div>
              <h4 className="text-lg font-bold mb-2">Yedekleme ve Güvenlik</h4>
              <p className="text-gray-600">Haftalık olarak "Yedekleme" sayfasına girip manuel yedek almanız önerilir. Sistem 10 gün geçmesi durumunda sizi uyaracaktır.</p>
            </div>
          </div>
        </section>

        {/* SSS */}
        <section>
          <div className="bg-gray-900 text-white p-12 rounded-3xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <HelpCircle className="w-32 h-32" />
            </div>
            <h2 className="text-3xl font-light mb-8">Sıkça Sorulan <span className="font-bold">Sorular</span></h2>
            <div className="space-y-6 font-sans">
              <div>
                <p className="font-bold text-red-400 mb-1">Şifremi unutursam ne yapmalıyım?</p>
                <p className="text-gray-400 text-sm">Sistem yöneticisi (edirnesydv@gmail.com) ile iletişime geçerek şifrenizin sıfırlanmasını talep edebilirsiniz.</p>
              </div>
              <div>
                <p className="font-bold text-red-400 mb-1">Başka bir Google hesabı ile girebilir miyim?</p>
                <p className="text-gray-400 text-sm">Hayır. Güvenlik protokolü gereği sadece tanımlı kurumsal hesap ile erişim mümkündür.</p>
              </div>
              <div>
                <p className="font-bold text-red-400 mb-1">Veriler silinirse geri getirilebilir mi?</p>
                <p className="text-gray-400 text-sm">Eğer düzenli yedek aldıysanız, son yedek dosyasından veriler geri yüklenebilir. Bu nedenle yedekleme kritiktir.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-20 pt-8 border-t border-gray-200 text-center text-gray-400 text-xs uppercase tracking-widest font-sans">
          <p>© 2026 Edirne Sosyal Yardımlaşma ve Dayanışma Vakfı • Bilgi İşlem Birimi</p>
        </footer>
      </div>
    </div>
  );
}
