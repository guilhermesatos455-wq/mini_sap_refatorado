import React, { createContext, useContext, useEffect, useState } from 'react';
import { GoogleAuthProvider, signInWithPopup, signOut, User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';

interface AuthContextType {
  user: User | null;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  loading: boolean;
  authError: string | null;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

const isAuthorizedEmail = (email: string | null | undefined): boolean => {
  if (!email) return false;
  const lower = email.toLowerCase().trim();
  if (lower === 'guilhermesatos455@gmail.com') return true;
  if (lower.endsWith('@natulab.com.br')) return true;
  return false;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        if (isAuthorizedEmail(currentUser.email)) {
          setUser(currentUser);
          setAuthError(null);
        } else {
          await signOut(auth);
          setUser(null);
          setAuthError(`Acesso negado para o e-mail "${currentUser.email}". Apenas contas com domínio @natulab.com.br (ou guilhermesatos455@gmail.com) são permitidas.`);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    try {
      setAuthError(null);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const email = result.user.email;
      if (!isAuthorizedEmail(email)) {
        await signOut(auth);
        setUser(null);
        throw new Error(`Acesso negado para o e-mail "${email}". O sistema é restrito a contas @natulab.com.br e guilhermesatos455@gmail.com.`);
      }
      setUser(result.user);
    } catch (error: any) {
      console.error("Auth error:", error);
      if (error?.code === 'auth/popup-closed-by-user' || error?.message?.includes('popup-closed-by-user')) {
        setAuthError(null);
        return;
      }
      setAuthError(error.message || 'Erro ao autenticar com Google.');
      throw error;
    }
  };

  const signOutUser = async () => {
    await signOut(auth);
    setUser(null);
    setAuthError(null);
  };

  const clearAuthError = () => setAuthError(null);

  return (
    <AuthContext.Provider value={{ user, signInWithGoogle, signOutUser, loading, authError, clearAuthError }}>
        {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
