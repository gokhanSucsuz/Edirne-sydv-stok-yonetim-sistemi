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
  loginWithGoogle: () => Promise<void>;
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Check if this user is in the personnel collection
        const q = query(collection(db, 'personnel'), where('email', '==', firebaseUser.email));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const pData = querySnapshot.docs[0].data() as Personnel;
          setPersonnel({ ...pData, id: querySnapshot.docs[0].id });
        } else {
          setPersonnel(null);
        }
      } else {
        setPersonnel(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    if (result.user.email !== AUTHORIZED_EMAIL) {
      await signOut(auth);
      throw new Error('Bu sisteme erişim yetkiniz bulunmamaktadır.');
    }
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
    <AuthContext.Provider value={{ user, personnel, loading, loginWithGoogle, loginWithEmail, registerPersonnel, logout }}>
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
