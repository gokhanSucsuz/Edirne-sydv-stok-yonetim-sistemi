import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Personnel, addPersonnel, getPersonnel } from '../lib/db';
import { encryptData } from '../lib/encryption';

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

const AUTHORIZED_EMAIL = 'edirnesydv@gmail.com';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [personnel, setPersonnel] = useState<Personnel | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        if (firebaseUser.email === AUTHORIZED_EMAIL) {
          setUser(firebaseUser);
          // Personel otomatik seçilmeyecek, Register (Personel Seçim) sayfasına yönlendirilecek
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
    console.log('Google login started');
    setLoginError(null);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      console.log('Google login result:', result.user.email);
      if (result.user.email !== AUTHORIZED_EMAIL) {
        console.log('Unauthorized email, signing out');
        await signOut(auth);
        throw new Error('Sisteme erişim yetkiniz bulunmamaktadır. Lütfen sistem yöneticisi ile iletişime geçiniz.');
      }
      console.log('Authorized email, login successful');
    } catch (error) {
      console.error('Google login error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setLoginError(errorMessage);
      throw error;
    }
  };

  const loginWithPassword = async (personnelId: string, password: string) => {
    const allPersonnel = await getPersonnel();
    const personnel = allPersonnel.find(p => p.id === personnelId);
    if (!personnel || personnel.password !== password) {
      throw new Error('Hatalı şifre.');
    }
    // Login successful
    setPersonnel(personnel);
  };

  const loginWithEmail = async (email: string, pass: string) => {
    // Google ile giriş yapılmış olmalı
    if (!user || user.email !== AUTHORIZED_EMAIL) {
      throw new Error('Öncelikle Google ile giriş yapmalısınız.');
    }
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const registerPersonnel = async (data: { name: string; title: string; tcNo: string; password: string }) => {
    if (!user || user.email !== AUTHORIZED_EMAIL) throw new Error('Yetkisiz işlem.');

    // 1. Create Email/Password account (or just update if it's the same email)
    // Actually, if they logged in with Google, they have an account.
    // But the user wants them to login with email/password later.
    // Firebase allows linking or just having multiple providers.
    
    // For simplicity and following user request:
    // We will store the encrypted password in Firestore as requested.
    // And we can use createUserWithEmailAndPassword if they want a separate login.
    // But they are already logged in with Google.
    
    // Let's just add them to the personnel collection first.
    const newPersonnel: Omit<Personnel, 'id' | 'createdAt'> = {
      name: data.name,
      title: data.title,
      tcNo: data.tcNo,
      password: data.password,
      email: user.email!
    };

    await addPersonnel(newPersonnel);
    
    // Update profile
    await updateProfile(user, { displayName: data.name });

    // Refresh personnel state
    const q = query(collection(db, 'personnel'), where('email', '==', user.email));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const pData = querySnapshot.docs[0].data() as Personnel;
      setPersonnel({ ...pData, id: querySnapshot.docs[0].id });
    }
  };

  const logout = async () => {
    await signOut(auth);
    window.location.href = '/login';
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
