import React, { createContext, useState, useContext, ReactNode } from 'react';
import { User } from 'firebase/auth';

// Define o tipo para o contexto (o que ele irá fornecer)
interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void; // ✅ adicionamos essa função
}

// Cria o contexto com valores iniciais
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define o provedor do contexto, que irá envolver as telas
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  // ✅ Função de logout
  function logout() {
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook customizado para usar o contexto facilmente
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
