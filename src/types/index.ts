// src/types/index.ts

// Configuração de cores (para uso em componentes)
export const Colors = {
  white: '#FFFFFF',
  blue: '#007AFF', // Cor principal
  red: '#FF3B30',  // Cor de destaque/aviso
  lightBlue: '#ADD8E6',
  lighterBlue: '#E0F7FA',
  lightestBlue: '#F0FFFF',
  orange: '#FFA500',
};

export interface DailyProgressEntry {
  progress: number; // Valor alcançado (e.g., 30 minutos)
  target: number; // Meta diária (e.g., 60 minutos)
  percentage: number; // Porcentagem (0-100)
}

export interface Habit {
  id: string;
  userId: string;
  name: string;
}

export interface Goal {
  id: string;
  userId: string;
  name: string;
  description?: string;
  target: number;
  dailyTarget: number;
  deadline: Date;
  progressTotal: number;
  progress: string[]; // Array de datas completadas ('YYYY-MM-DD')
  habitId: string; // 🚨 Essencial para o modal
  dailyProgress?: {
    [key: string]: DailyProgressEntry; // 'YYYY-MM-DD': { progress: 1, target: 1, percentage: 100 }
  };
}

// Usado para o formulário de criação/edição
export type GoalFormValues = Omit<Goal, 'id' | 'userId' | 'progress' | 'progressTotal' | 'dailyProgress'> & {
  habitId: string;
};