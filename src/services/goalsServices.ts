// src/services/goalsServices.ts
import { db, auth } from '../../firebaseConfig'; // Assumindo firebaseConfig
import { collection, doc, updateDoc, getDoc, Timestamp, getDocs, query, where, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { Goal, GoalFormValues, DailyProgressEntry } from '../types';

const goalsRef = collection(db, 'goals');

// ... (funções ensureUser, serializeForFirestore, deserializeFromFirestore - AS ANTERIORES)

const ensureUser = () => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');
  return user;
};

const serializeForFirestore = (goalData: Partial<GoalFormValues | Goal>) => {
  const data: any = { ...goalData };
  if (data.deadline && data.deadline instanceof Date) {
    data.deadline = Timestamp.fromDate(data.deadline);
  }
  // Remove undefined values to prevent Firestore errors
  Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);
  return data;
};

// 🚨 CORREÇÃO CRÍTICA DO ERRO 'toDate is not a function' 🚨
const deserializeFromFirestore = (docData: any, id: string): Goal => ({
    ...docData,
    id,
    deadline: (docData.deadline && typeof docData.deadline.toDate === 'function') 
        ? docData.deadline.toDate() 
        : new Date(), 
});


export const listGoals = async (): Promise<Goal[]> => {
    const user = ensureUser();
    const q = query(goalsRef, where("userId", "==", user.uid));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => deserializeFromFirestore(doc.data(), doc.id));
};

export const createGoal = async (goalData: GoalFormValues): Promise<string> => {
    const user = ensureUser();
    
    const serializedData = serializeForFirestore(goalData);
    
    const newGoalData = {
        ...serializedData,
        userId: user.uid,
        progressTotal: 0,
        progress: [],
        dailyProgress: {},
        createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(goalsRef, newGoalData);
    return docRef.id;
};

export const deleteGoal = async (goalId: string): Promise<void> => {
    ensureUser();
    await deleteDoc(doc(db, 'goals', goalId));
};

export const updateDailyProgress = async (
  goalId: string,
  dateKey: string,
  entry: DailyProgressEntry
): Promise<void> => {
  // A lógica de atualização foi simplificada para atualizar apenas o dailyProgress e os totais
  const user = ensureUser();
  const ref = doc(db, 'goals', goalId);

  // Busca o estado atual para calcular a diferença
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) throw new Error('Meta não encontrada');

  const data = snapshot.data() as Goal;
  const currentDailyProgress = data.dailyProgress || {};

  const originalEntry = currentDailyProgress[dateKey] || { progress: 0, target: data.dailyTarget || 1, percentage: 0 };
  const progressDifference = entry.progress - originalEntry.progress;

  const updatedDailyProgress = {
    ...currentDailyProgress,
    [dateKey]: entry,
  };

  const currentProgressTotal = data.progressTotal || 0;
  const updatedProgressTotal = currentProgressTotal + progressDifference;
  
  const currentProgress = data.progress || [];
  let updatedProgress = [...currentProgress];
  
  const isCompleted = entry.percentage >= 100;
  const alreadyCompleted = currentProgress.includes(dateKey);
  
  // Atualiza o array de progresso concluído (dias)
  if (isCompleted && !alreadyCompleted) {
    updatedProgress.push(dateKey);
  } else if (!isCompleted && alreadyCompleted) {
    updatedProgress = updatedProgress.filter(d => d !== dateKey);
  }

  await updateDoc(ref, {
    dailyProgress: updatedDailyProgress,
    progress: updatedProgress,
    progressTotal: updatedProgressTotal,
  });
};

export const updateGoal = async (id: string, goalData: Partial<GoalFormValues>) => {
  ensureUser();
  const ref = doc(db, 'goals', id);
  
  const updates = serializeForFirestore(goalData);
  delete updates.dailyProgress; 
  
  await updateDoc(ref, updates);
};

export const deleteGoalsByHabit = async (habitId: string): Promise<void> => {
    const user = ensureUser();
    const q = query(goalsRef, where("userId", "==", user.uid), where("habitId", "==", habitId));
    const snapshot = await getDocs(q);
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
};