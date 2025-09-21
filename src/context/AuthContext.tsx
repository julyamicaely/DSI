// src/context/AuthContext.tsx
import React, { createContext, useState, useContext, ReactNode } from 'react';

// Define o tipo para as credenciais
interface AuthCredentials {
  email: string;
  password: string;
}

// Define o tipo para o contexto (o que ele irá fornecer)
interface AuthContextType {
  credentials: AuthCredentials | null;
  setCredentials: (creds: AuthCredentials) => void;
}

// Cria o contexto com valores iniciais
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define o provedor do contexto, que irá envolver as telas
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [credentials, setCredentials] = useState<AuthCredentials | null>(null);

  return (
    <AuthContext.Provider value={{ credentials, setCredentials }}>
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