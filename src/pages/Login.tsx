import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ShieldCheck } from 'lucide-react';
import { APP_LOGO_URL } from '../constants';

export default function Login() {
  const { loginWithGoogle, loginError } = useAuth();
  const [loading, setLoading] = useState(false);

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
          Sisteme erişmek için Google ile giriş yapın
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {loginError && (
            <div className="mb-4 bg-red-100 border-l-4 border-red-600 p-4 text-red-800 text-sm font-bold shadow-sm">
              {loginError}
            </div>
          )}

          <div className="space-y-6">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5 mr-2" alt="Google" />
              Google ile Giriş Yap
            </button>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-center text-xs text-gray-500">
              <ShieldCheck className="w-4 h-4 mr-1" />
              Sadece Yetkili Hesap Erişimi
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
