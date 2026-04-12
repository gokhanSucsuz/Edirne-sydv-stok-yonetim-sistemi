import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, Mail, Lock, ShieldCheck } from 'lucide-react';
import { APP_LOGO_URL } from '../constants';
import { getPersonnel } from '../lib/db';

export default function Login() {
  const { loginWithGoogle, loginWithPassword, loginError } = useAuth();
  const [loading, setLoading] = useState(false);
  const [personnelList, setPersonnelList] = useState<any[]>([]);
  const [selectedPersonnel, setSelectedPersonnel] = useState<any>(null);
  const [password, setPassword] = useState('');

  React.useEffect(() => {
    const fetchPersonnel = async () => {
      const all = await getPersonnel();
      setPersonnelList(all);
    };
    fetchPersonnel();
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error('Login error caught in component:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async () => {
    if (!selectedPersonnel || !password) return;
    setLoading(true);
    try {
      await loginWithPassword(selectedPersonnel.id, password);
    } catch (err: any) {
      console.error('Password login error:', err);
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <img className="h-24 w-24 rounded-full shadow-lg" src={APP_LOGO_URL} alt="Logo" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          EDİRNE SYDV STOK TAKİP
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Sisteme erişmek için giriş yapın
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {loginError && (
            <div className="mb-4 bg-red-100 border-l-4 border-red-600 p-4 text-red-800 text-sm font-bold shadow-sm">
              {loginError}
            </div>
          )}

          {!selectedPersonnel ? (
            <div className="space-y-6">
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5 mr-2" alt="Google" />
                Google ile Giriş Yap
              </button>
              
              {personnelList.length > 0 && (
                <>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">veya</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Personel Seçin</label>
                    <select
                      onChange={(e) => setSelectedPersonnel(personnelList.find(p => p.id === e.target.value))}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md"
                    >
                      <option value="">Personel Seçin</option>
                      {personnelList.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center font-medium text-gray-900">{selectedPersonnel.name}</div>
              <input
                type="password"
                placeholder="Şifre"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
              />
              <button
                onClick={handlePasswordLogin}
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Giriş Yap
              </button>
              <button
                onClick={() => setSelectedPersonnel(null)}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Geri
              </button>
              <a
                href="/register"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Yeni Kayıt Oluştur
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
