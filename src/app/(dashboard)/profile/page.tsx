'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { updatePersonnel } from '@/lib/db';
import { UserCircle, Save, Key, User, Shield } from 'lucide-react';

export default function ProfilePage() {
  const { personnel, updateCurrentPersonnel } = useAuth();
  
  const [name, setName] = useState('');
  const [tcNo, setTcNo] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (personnel) {
      setName(personnel.name || '');
      setTcNo(personnel.tcNo || '');
      setPassword(personnel.password || '');
      setConfirmPassword(personnel.password || '');
    }
  }, [personnel]);

  if (!personnel) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Profil bilgileri yüklenemedi. Sadece yetkili personeller erişebilir.</div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!name) {
      setMessage({ type: 'error', text: 'Ad Soyad zorunludur.' });
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Şifreler eşleşmiyor.' });
      return;
    }

    setIsSaving(true);
    try {
      const updatedData = {
        ...personnel,
        name,
        tcNo,
        password
      };
      
      await updatePersonnel(updatedData as any);
      updateCurrentPersonnel(updatedData);
      
      setMessage({ type: 'success', text: 'Profil bilgileriniz başarıyla güncellendi.' });
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Güncelleme sırasında bir hata oluştu.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Profilim</h1>
      </div>

      <div className="bg-white shadow sm:rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-5 border-b border-gray-200 sm:px-6 flex items-center">
          <div className="bg-red-100 p-3 rounded-full mr-4">
            <UserCircle className="w-8 h-8 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">{personnel.name}</h3>
            <p className="mt-1 text-sm text-gray-500 flex items-center">
              <Shield className="w-4 h-4 mr-1 text-gray-400" />
              {personnel.title}
            </p>
          </div>
        </div>
        
        <div className="px-4 py-5 sm:p-6">
          {message && (
            <div className={`mb-4 p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <p className={`text-sm ${message.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                {message.text}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 flex items-center">
                  <User className="w-4 h-4 mr-1 text-gray-400" />
                  Ad Soyad
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Ünvan / Görev
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="title"
                    value={personnel.title}
                    disabled
                    className="shadow-sm block w-full sm:text-sm border-gray-300 rounded-md p-2 border bg-gray-100 text-gray-500 cursor-not-allowed"
                    title="Ünvanınızı sadece sistem yöneticisi değiştirebilir."
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="tcNo" className="block text-sm font-medium text-gray-700">
                  TC Kimlik No
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="tcNo"
                    value={tcNo}
                    onChange={e => setTcNo(e.target.value)}
                    className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200">
              <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                <Key className="w-5 h-5 mr-2 text-gray-500" />
                Şifre İşlemleri
              </h4>
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Yeni Şifre
                  </label>
                  <div className="mt-1">
                    <input
                      type="password"
                      id="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Yeni Şifre (Tekrar)
                  </label>
                  <div className="mt-1">
                    <input
                      type="password"
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-5 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                <Save className="w-5 h-5 mr-2" />
                {isSaving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
