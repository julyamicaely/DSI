import { db } from "../../../../firebaseConfig";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";

const habitsRef = collection(db, "habits");

export const addHabit = async (dados: any) => {
  await addDoc(habitsRef, dados);
};

export const listHabits = async () => {
  const snapshot = await getDocs(habitsRef);
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
