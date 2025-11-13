import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import { View, ActivityIndicator } from 'react-native';

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  triggerDataUpdate: () => void;
  dataUpdateTrigger: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataUpdateTrigger, setDataUpdateTrigger] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#A42020" />
      </View>
    );
  }

  /**
   * Faz logout do usuário
   */
  async function logout(): Promise<void> {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      throw error;
    }
  }

  /**
   * Recarrega os dados do usuário atual
   * Útil após atualizar perfil, foto, etc.
   */
  async function refreshUser(): Promise<void> {
    try {
      if (auth.currentUser) {
        await auth.currentUser.reload();
        setUser({ ...auth.currentUser });
      }
    } catch (error) {
      console.error('Erro ao recarregar usuário:', error);
    }
  }

  /**
   * Dispara atualização de dados para outras telas
   */
  function triggerDataUpdate(): void {
    setDataUpdateTrigger(prev => prev + 1);
  }

  return (
    <AuthContext.Provider value={{ user, setUser, logout, refreshUser, triggerDataUpdate, dataUpdateTrigger }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
