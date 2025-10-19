import { db, auth } from "../../../../firebaseConfig";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where } from "firebase/firestore";

const habitsRef = collection(db, "habits");

export const addHabit = async (dados: any) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Usuário não autenticado");
  await addDoc(habitsRef, dados);
};

export const listHabits = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error("Usuário não autenticado");

  const q = query(habitsRef, where("userId", "==", user.uid));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const updateHabit = async (id: string, dados: any) => {
  const ref = doc(db, "habits", id);
  await updateDoc(ref, dados);
};

export const deleteHabit = async (id: string) => {
  const ref = doc(db, "habits", id);
  await deleteDoc(ref);
};
