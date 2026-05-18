import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus, User, Briefcase, CreditCard, Lock, AlertCircle, LogIn, ShieldCheck } from 'lucide-react';
import { APP_LOGO_URL } from '../constants';
import { getPersonnel } from '../lib/db';

export default function Register() {
  const { registerPersonnel, loginWithPassword, logout } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [personnelList, setPersonnelList] = useState<any[]>([]);
  const [selectedPersonnelId, setSelectedPersonnelId] = useState('');
  const [loginPass, setLoginPass] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    title: '',
    tcNo: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPersonnel = async () => {
      try {
        const all = await getPersonnel();
        setPersonnelList(all);
      } catch (err) {
        console.error("Error fetching personnel:", err);
      }
    };
    fetchPersonnel();
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPersonnelId || !loginPass) {
      setError('Lütfen personel seçin ve şifrenizi girin.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await loginWithPassword(selectedPersonnelId, loginPass);
    } catch (err: any) {
      setError(err.message || 'Giriş başarısız.');
    } finally {
      setLoading(false);
    }
  };

  const [showKVKK, setShowKVKK] = useState(false);
  const [kvkkAccepted, setKvkkAccepted] = useState(false);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kvkkAccepted) {
      setError('Devam etmek için KVKK Aydınlatma Metni\'ni onaylamalısınız.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Şifreler eşleşmiyor.');
      return;
    }
    if (formData.tcNo.length !== 11) {
      setError('TC Kimlik No 11 haneli olmalıdır.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await registerPersonnel({
        name: formData.name,
        title: formData.title,
        tcNo: formData.tcNo,
        password: formData.password
      });
    } catch (err: any) {
      setError(err.message || 'Kayıt sırasında bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <img className="h-20 w-20 rounded-full shadow-lg" src={APP_LOGO_URL} alt="Logo" />
        </div>
        <h2 className="mt-6 text-center text-2xl font-extrabold text-gray-900">
          {mode === 'login' ? 'Personel Girişi' : 'Yeni Personel Kaydı'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Google hesabınız doğrulandı. Lütfen işleminize devam edin.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 text-red-700 text-sm">
              {error}
            </div>
          )}

          {mode === 'login' ? (
            <form className="space-y-6" onSubmit={handleLoginSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700">Kayıtlı Personel</label>
                <select
                  value={selectedPersonnelId}
                  onChange={(e) => setSelectedPersonnelId(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md"
                >
                  <option value="">Personel Seçin</option>
                  {personnelList.map(p => (
                    <option key={p.id} value={p.id}>{p.name} - {p.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Şifre</label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    className="appearance-none block w-full pl-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="pt-2 space-y-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <LogIn className="w-5 h-5 mr-2" />
                  Giriş Yap
                </button>
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Yeni Kayıt Oluştur
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Sistemden Çıkış Yap
                </button>
              </div>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={handleRegisterSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700">Ad Soyad</label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="appearance-none block w-full pl-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Unvan</label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Briefcase className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="appearance-none block w-full pl-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">TC Kimlik No</label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CreditCard className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={11}
                    value={formData.tcNo}
                    onChange={(e) => setFormData({ ...formData, tcNo: e.target.value.replace(/\D/g, '') })}
                    className="appearance-none block w-full pl-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Sistem Şifresi</label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="appearance-none block w-full pl-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Şifre Tekrar</label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="appearance-none block w-full pl-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="kvkk"
                    name="kvkk"
                    type="checkbox"
                    checked={kvkkAccepted}
                    onChange={(e) => setKvkkAccepted(e.target.checked)}
                    className="focus:ring-red-500 h-4 w-4 text-red-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="kvkk" className="font-medium text-gray-700">
                    <button
                      type="button"
                      onClick={() => setShowKVKK(true)}
                      className="text-red-600 hover:text-red-500 underline"
                    >
                      KVKK Aydınlatma Metni
                    </button>
                    'ni okudum ve kabul ediyorum.
                  </label>
                </div>
              </div>

              <div className="pt-4 space-y-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <UserPlus className="w-5 h-5 mr-2" />
                  Kaydı Tamamla
                </button>
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Geri Dön
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {showKVKK && (
        <div className="fixed z-50 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowKVKK(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
              <div>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <ShieldCheck className="h-6 w-6 text-red-600" />
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                    KVKK Aydınlatma Metni
                  </h3>
                  <div className="mt-4 text-sm text-gray-500 text-left space-y-4 max-h-96 overflow-y-auto p-2 border rounded">
                    <p className="font-bold">1. Veri Sorumlusu</p>
                    <p>Edirne Sosyal Yardımlaşma ve Dayanışma Vakfı (SYDV) olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) uyarınca, kişisel verilerinizin güvenliğine büyük önem vermekteyiz.</p>
                    
                    <p className="font-bold">2. İşlenen Kişisel Veriler</p>
                    <p>Sistem kullanımı kapsamında; Ad-Soyad, Unvan, TC Kimlik Numarası (şifreli) ve Sistem Şifresi (şifreli) verileriniz işlenmektedir.</p>
                    
                    <p className="font-bold">3. Veri İşleme Amacı</p>
                    <p>Kişisel verileriniz; stok takip sistemine yetkili erişimin sağlanması, işlem güvenliğinin takibi ve vakıf envanter yönetiminin sağlıklı yürütülmesi amaçlarıyla işlenmektedir.</p>
                    
                    <p className="font-bold">4. Veri Güvenliği</p>
                    <p>TC Kimlik Numaranız ve şifreniz veritabanında AES-256 standardında şifrelenmiş olarak saklanmaktadır. Verilere erişim sadece yetkili personel (edirnesydv@gmail.com) ile sınırlandırılmıştır.</p>
                    
                    <p className="font-bold">5. Haklarınız</p>
                    <p>KVKK'nın 11. maddesi uyarınca; verilerinizin işlenip işlenmediğini öğrenme, düzeltilmesini isteme ve silinmesini talep etme haklarına sahipsiniz.</p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6">
                <button
                  type="button"
                  className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:text-sm"
                  onClick={() => setShowKVKK(false)}
                >
                  Anladım
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
