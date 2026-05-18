'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  User,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { AUTHORIZED_EMAIL } from '@/lib/constants';
import { useRouter } from 'next/navigation';

export interface Personnel {
  id?: string;
  name: string;
  title: string;
  tcNo?: string;
  password?: string;
  email: string;
  createdAt?: number;
}

interface AuthContextType {
  user: User | null;
  personnel: Personnel | null;
  loading: boolean;
  loginError: string | null;
  loginWithGoogle: () => Promise<void>;
  loginWithPassword: (personnelId: string, password: string) => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerPersonnel: (data: { name: string; title: string; tcNo: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [personnel, setPersonnel] = useState<Personnel | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        if (firebaseUser.email === AUTHORIZED_EMAIL) {
          setUser(firebaseUser);
          setPersonnel(null);
        } else {
          await signOut(auth);
          setUser(null);
          setPersonnel(null);
        }
      } else {
        setUser(null);
        setPersonnel(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    setLoginError(null);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      if (result.user.email !== AUTHORIZED_EMAIL) {
        await signOut(auth);
        throw new Error('Sisteme erişim yetkiniz bulunmamaktadır. Lütfen sistem yöneticisi ile iletişime geçiniz.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setLoginError(errorMessage);
      throw error;
    }
  };

  const loginWithPassword = async (personnelId: string, password: string) => {
    const res = await fetch('/api/personnel');
    if (!res.ok) throw new Error('Personel listesi alınamadı.');
    const allPersonnel: Personnel[] = await res.json();
    const found = allPersonnel.find(p => p.id === personnelId);
    if (!found || found.password !== password) {
      throw new Error('Hatalı şifre.');
    }
    setPersonnel(found);
  };

  const loginWithEmail = async (email: string, pass: string) => {
    if (!user || user.email !== AUTHORIZED_EMAIL) {
      throw new Error('Öncelikle Google ile giriş yapmalısınız.');
    }
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const registerPersonnel = async (data: { name: string; title: string; tcNo: string; password: string }) => {
    if (!user || user.email !== AUTHORIZED_EMAIL) throw new Error('Yetkisiz işlem.');

    const res = await fetch('/api/personnel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        email: user.email,
      }),
    });

    if (!res.ok) throw new Error('Personel kaydı oluşturulamadı.');
    
    await updateProfile(user, { displayName: data.name });

    const getRes = await fetch('/api/personnel');
    if (getRes.ok) {
      const all: Personnel[] = await getRes.json();
      const newP = all.find(p => p.email === user.email && p.name === data.name);
      if (newP) setPersonnel(newP);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setPersonnel(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, personnel, loading, loginError, loginWithGoogle, loginWithPassword, loginWithEmail, registerPersonnel, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
